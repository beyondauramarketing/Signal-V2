import { Request, Response } from "express";
import { supabaseAdmin, isSupabaseConfiguredBackend } from "../utils/supabase";
import { logEvent } from "../utils/logger";
import { PaymentStatus, WEBHOOK_EVENT_STATUS_MAP } from "../utils/paymentStates";
import crypto from "crypto";
import { PlanType, PLAN_IDS, PLAN_AMOUNTS } from "../../plans/subscription";

export async function processWebhook(req: Request, res: Response) {
  const received_at = new Date().toISOString();

  try {
    const signature    = req.headers["x-razorpay-signature"] as string;
    const rawBodyString = (req as any).rawBody ? (req as any).rawBody.toString() : "";

    // ── 1. Webhook Signature Verification ───────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== "placeholder-webhook-secret") {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBodyString)
        .digest("hex");

      let isValid = false;
      try {
        isValid =
          !!signature &&
          expectedSignature.length === signature.length &&
          crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(signature, "hex")
          );
      } catch {
        isValid = false;
      }

      if (!isValid) {
        logEvent("ERROR", "webhook_signature_invalid", {
          received_at,
          signature: signature?.slice(0, 8) + "..." // partial, never full
        });
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
    } else {
      logEvent("WARN", "webhook_signature_bypassed (secret not set or placeholder)", { received_at });
    }

    const body  = req.body;
    const event = body.event as string;

    // ── Extract standard Razorpay webhook fields ─────────────────────────────────
    const subscription    = body.payload?.subscription?.entity;
    const payment         = body.payload?.payment?.entity;
    const subscriptionId  = subscription?.id || body.payload?.entity?.subscription_id || null;
    const paymentId       = payment?.id || body.payload?.entity?.id || null;
    const amount          = payment?.amount || subscription?.amount || 0;
    const currency        = payment?.currency || subscription?.currency || "USD";

    // Notes metadata injected during subscription/order creation
    const notes  = subscription?.notes || payment?.notes || {};
    const userId = notes.userId || null;

    // Resolve plan from plan_id or amount fallback
    const planId       = subscription?.plan_id;
    const PLAN_ID_MAP: Record<string, string> = {};
    for (const [pType, pId] of Object.entries(PLAN_IDS)) {
      if (pId) {
        PLAN_ID_MAP[pId] = pType;
      }
    }

    const AMOUNT_PLAN_MAP: Record<number, string> = {};
    for (const [pType, amt] of Object.entries(PLAN_AMOUNTS)) {
      if (amt > 0) {
        AMOUNT_PLAN_MAP[amt] = pType;
        AMOUNT_PLAN_MAP[amt * 100] = pType;
      }
    }

    let planType =
      PLAN_ID_MAP[planId] ||
      AMOUNT_PLAN_MAP[amount] ||
      notes.planType ||
      "guard_monthly"; // safe fallback

    // Webhook Replay Protection: use Razorpay event ID
    const webhookEventId = body.id || `evt_${body.created_at || Date.now()}`;

    // Determine target PaymentStatus from the event name
    const targetStatus: PaymentStatus | undefined = WEBHOOK_EVENT_STATUS_MAP[event];

    // ── 2. Structured log for every webhook received ─────────────────────────────
    logEvent("INFO", "webhook_received", {
      event,
      subscription_id:  subscriptionId,
      payment_id:       paymentId,
      webhook_event_id: webhookEventId,
      user_id:          userId,
      plan_type:        planType,
      target_status:    targetStatus,
      received_at
    });

    if (!isSupabaseConfiguredBackend()) {
      logEvent("WARN", "webhook_mock_mode: no DB updates", { event, webhookEventId });
      return res.json({ status: "ok" });
    }

    // ── 3. Replay Protection — reject duplicate event IDs ────────────────────────
    const { data: duplicateCheck } = await supabaseAdmin
      .from("payment_logs")
      .select("id")
      .eq("payload->>webhook_event_id", webhookEventId)
      .maybeSingle();

    if (duplicateCheck) {
      logEvent("INFO", "webhook_duplicate_ignored", { webhookEventId, event });
      return res.json({ status: "ok", message: "Duplicate event ignored" });
    }

    // ── 4. Append-only audit log for this webhook event ──────────────────────────
    await supabaseAdmin.from("payment_logs").insert({
      user_id:    userId,
      event_type: `webhook.${event}`,
      payload: {
        event,
        subscription_id:  subscriptionId,
        payment_id:       paymentId,
        plan_type:        planType,
        amount,
        currency,
        webhook_event_id: webhookEventId,
        signature:        signature ? signature.slice(0, 10) + "…" : null, // partial only
        received_at
      }
    });

    // ── 5. Idempotency check for charged/authorized events ────────────────────────
    if (paymentId && (event === "subscription.charged" || event === "payment.authorized")) {
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("id, verified")
        .eq("payment_id", paymentId)
        .maybeSingle();

      if (existingPayment?.verified) {
        logEvent("INFO", "webhook_payment_already_verified", { paymentId, event });
        return res.json({ status: "ok", message: "Payment already verified." });
      }
    }

    // ── 6. Process event with state machine transitions ───────────────────────────
    if (
      event === "subscription.charged"   ||
      event === "payment.authorized"     ||
      event === "subscription.activated" ||
      event === "subscription.resumed"
    ) {
      // ACTIVE events → CAPTURED
      await supabaseAdmin.from("payments").upsert({
        user_id:         userId,
        subscription_id: subscriptionId,
        payment_id:      paymentId,
        amount,
        currency,
        status:          PaymentStatus.CAPTURED,
        verified:        true,
        updated_at:      new Date().toISOString()
      }, { onConflict: "payment_id" });

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: planType, plan_status: "ACTIVE" })
          .eq("id", userId);
      }

      logEvent("INFO", "webhook_plan_activated", { event, userId, planType, subscriptionId });

    } else if (event === "subscription.paused" || event === "subscription.halted") {
      // Grace period / retry exhausted → PENDING (still has access, needs attention)
      await supabaseAdmin
        .from("payments")
        .update({ status: PaymentStatus.PENDING, updated_at: new Date().toISOString() })
        .eq("subscription_id", subscriptionId);

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan_status: "PAST_DUE" })
          .eq("id", userId);
      }

      logEvent("INFO", `webhook_subscription_${event === "subscription.paused" ? "paused" : "halted"}`, { subscriptionId, userId });

    } else if (event === "subscription.cancelled" || event === "subscription.completed") {
      const status = event === "subscription.cancelled"
        ? PaymentStatus.CANCELLED
        : PaymentStatus.EXPIRED;

      await supabaseAdmin
        .from("payments")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("subscription_id", subscriptionId);

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "sniff", plan_status: status })
          .eq("id", userId);
      }

      logEvent("INFO", `webhook_subscription_terminated`, { status, subscriptionId, userId });

    } else if (event === "payment.failed") {
      await supabaseAdmin.from("payments").upsert({
        user_id:         userId,
        subscription_id: subscriptionId,
        payment_id:      paymentId,
        amount,
        currency,
        status:          PaymentStatus.FAILED,
        verified:        false,
        updated_at:      new Date().toISOString()
      }, { onConflict: "payment_id" });

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan_status: "FAILED" })
          .eq("id", userId);
      }

      logEvent("INFO", "payment_failed", { subscriptionId, userId, paymentId });

    } else if (event === "subscription.pending") {
      await supabaseAdmin
        .from("payments")
        .update({ status: PaymentStatus.PENDING, updated_at: new Date().toISOString() })
        .eq("subscription_id", subscriptionId);

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan_status: "PENDING" })
          .eq("id", userId);
      }

      logEvent("INFO", "webhook_subscription_pending", { subscriptionId, userId });

    } else {
      // Unknown event — logged above, no action needed
      logEvent("INFO", `webhook_event_unhandled`, { event, webhookEventId });
    }

    return res.json({ status: "ok" });
  } catch (error: any) {
    logEvent("ERROR", "webhook_processing_exception", {
      error:       error.message,
      received_at
    });
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
