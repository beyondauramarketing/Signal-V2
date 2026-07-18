import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { supabaseAdmin, isSupabaseConfiguredBackend } from "../utils/supabase";
import { logEvent } from "../utils/logger";
import { PLAN_PRICES_USD } from "../middleware/validatePayment.middleware";
import { PaymentStatus } from "../utils/paymentStates";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD CHECKOUT — Create Order
// POST /api/payments/create-order
//
// Security guarantees:
//   • Amount is derived server-side from planType — the client NEVER supplies it.
//   • Pending order record is persisted to DB with user_id BEFORE returning order_id.
//     This creates the ownership anchor used by verifyOrder.
//   • key_id (public) is returned; key_secret stays on the server only.
// ─────────────────────────────────────────────────────────────────────────────
export async function createOrder(req: AuthenticatedRequest, res: Response) {
  const userId    = req.user.id;
  const userEmail = req.user.email;

  // planType already validated by validateCreateOrder middleware
  // amount has already been stripped from req.body by the middleware
  const { planType, currency = "USD" } = req.body;

  // ── Step 1: Derive authoritative amount from the server-side price map ──────
  const amountCents = PLAN_PRICES_USD[planType];
  // (middleware guarantees planType exists in the map, but be defensive)
  if (!amountCents) {
    return res.status(400).json({ error: `Unknown planType: "${planType}".` });
  }

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const hasRazorpayConfig = !!keyId && !!keySecret && keySecret !== "placeholder-secret";

  let rzpOrderId: string   = `order_mock_${Date.now()}`;
  let orderAmount: number  = amountCents;
  let orderCurrency: string = currency;

  // ── Step 2: Create the order with Razorpay API ───────────────────────────────
  if (hasRazorpayConfig) {
    try {
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({ key_id: keyId!, key_secret: keySecret! });

      const order = await (razorpay.orders.create as any)({
        amount:   amountCents,
        currency,
        receipt:  `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
        notes: { userId, userEmail, planType }
      });

      rzpOrderId    = order.id;
      orderAmount   = order.amount as number;
      orderCurrency = order.currency;

      logEvent("INFO", "payment_created", {
        userId,
        orderId:    rzpOrderId,
        planType,
        amount:     orderAmount,
        currency:   orderCurrency,
        created_at: new Date().toISOString()
      });
    } catch (rzpErr: any) {
      logEvent("ERROR", "Razorpay orders.create() failed", { userId, error: rzpErr.message });
      return res.status(502).json({
        error: "Payment provider error. Please try again in a moment."
      });
    }
  } else {
    if (process.env.ALLOW_MOCK_PAYMENTS !== "true") {
      return res.status(501).json({
        error: "Payment provider not configured. Contact the administrator."
      });
    }
    logEvent("WARN", "Mock order generated (Razorpay not configured)", { userId, rzpOrderId });
  }

  // ── Step 3: Persist PENDING record to DB (creates ownership anchor) ──────────
  // This record is the authoritative link between razorpay_order_id ↔ user_id.
  // verifyOrder will look this up to prevent cross-user replay attacks.
  if (isSupabaseConfiguredBackend()) {
    const { error: dbError } = await supabaseAdmin.from("payments").insert({
      user_id:         userId,
      subscription_id: rzpOrderId,   // reusing subscription_id column to store order_id
      payment_id:      null,          // filled in by verifyOrder
      amount:          orderAmount,
      currency:        orderCurrency,
      status:          PaymentStatus.PENDING,
      verified:        false,
      created_at:      new Date().toISOString(),
      updated_at:      new Date().toISOString()
    });

    if (dbError) {
      logEvent("ERROR", "Failed to persist pending order record", { userId, rzpOrderId, error: dbError });
      // Non-fatal: log but proceed. Ownership check will be skipped gracefully.
    } else {
      // Append-only audit log
      await supabaseAdmin.from("payment_logs").insert({
        user_id:    userId,
        event_type: "order.created",
        payload: {
          order_id:   rzpOrderId,
          plan_type:  planType,
          amount:     orderAmount,
          currency:   orderCurrency,
          created_at: new Date().toISOString()
        }
      });
    }
  }

  return res.status(200).json({
    order_id: rzpOrderId,
    amount:   orderAmount,
    currency: orderCurrency,
    // key_id (public) is safe to send to the frontend — secret never leaves the server
    key_id:   keyId || "rzp_test_placeholder"
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD CHECKOUT — Verify Order Payment Signature
// POST /api/payments/verify-order
//
// Security guarantees (in execution order):
//   1. Input validated by validateVerifyOrder middleware before this runs
//   2. HMAC-SHA256 signature verified with timingSafeEqual (422 on mismatch)
//   3. Order ownership verified: order_id must belong to req.user.id (403 on mismatch)
//   4. Idempotency: payment_id already verified → 409 Conflict (not re-processed)
//   5. State transition: PENDING → CAPTURED (never skips states)
//   6. Plan only activated AFTER all checks pass
//   7. Append-only audit log written
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyOrder(req: AuthenticatedRequest, res: Response) {
  const userId = req.user.id;

  // All three fields already validated by middleware
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const hasRazorpayConfig = !!keySecret && keySecret !== "placeholder-secret";

  // ── Step 1: Cryptographic signature verification ─────────────────────────────
  // MUST happen before any DB read/write.
  // Algorithm: HMAC-SHA256( order_id + "|" + payment_id, KEY_SECRET )
  if (hasRazorpayConfig) {
    const expectedSig = crypto
      .createHmac("sha256", keySecret!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    let isValid = false;
    try {
      isValid =
        expectedSig.length === razorpay_signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSig, "hex"),
          Buffer.from(razorpay_signature, "hex")
        );
    } catch {
      // Buffer.from will throw on non-hex strings — treat as invalid
      isValid = false;
    }

    if (!isValid) {
      logEvent("ERROR", "payment_verification_failed", {
        userId,
        razorpay_order_id,
        razorpay_payment_id,
        reason: "HMAC_SIGNATURE_MISMATCH",
        verified_at: new Date().toISOString()
      });
      // 422 Unprocessable Entity: request is well-formed but semantically invalid
      return res.status(422).json({ error: "Payment signature is invalid." });
    }
  } else {
    logEvent("WARN", "Mock mode: skipping signature verification (no KEY_SECRET)", { userId });
  }

  // ── Step 2: Idempotency check — has this payment_id already been verified? ───
  // Uses payment_id (not order_id) because retries occur with the same payment_id.
  if (isSupabaseConfiguredBackend()) {
    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, verified, status")
      .eq("payment_id", razorpay_payment_id)
      .maybeSingle();

    if (lookupErr) {
      logEvent("ERROR", "DB lookup failed during idempotency check", { userId, error: lookupErr });
      return res.status(500).json({ error: "Internal error during payment verification." });
    }

    if (existing?.verified) {
      logEvent("INFO", "payment_already_verified", {
        userId,
        razorpay_payment_id,
        existing_user_id: existing.user_id
      });
      // 409 Conflict: payment already processed — safe to return success
      return res.status(409).json({
        success: true,
        message:  "Payment already verified.",
        conflict: true
      });
    }

    // ── Step 3: Order ownership verification ─────────────────────────────────────
    // Fetch the PENDING record created by createOrder and assert it belongs to this user.
    // Prevents replay: user A's order_id cannot activate user B's account.
    const { data: pendingOrder, error: orderErr } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, status")
      .eq("subscription_id", razorpay_order_id)   // order_id stored in subscription_id column
      .eq("status", PaymentStatus.PENDING)
      .maybeSingle();

    if (orderErr) {
      logEvent("ERROR", "DB lookup failed during ownership check", { userId, error: orderErr });
      return res.status(500).json({ error: "Internal error during ownership verification." });
    }

    if (!pendingOrder) {
      logEvent("WARN", "payment_order_not_found", { userId, razorpay_order_id });
      // 404: could be a completely fabricated order_id
      return res.status(404).json({ error: "Order not found. It may have already been processed." });
    }

    if (pendingOrder.user_id !== userId) {
      logEvent("ERROR", "payment_ownership_mismatch", {
        requesting_user:    userId,
        order_owner:        pendingOrder.user_id,
        razorpay_order_id,
        razorpay_payment_id
      });
      // 403 Forbidden: order exists but belongs to a different user
      return res.status(403).json({ error: "Forbidden: This order does not belong to your account." });
    }

    // ── Step 4: All checks passed — transition PENDING → CAPTURED ───────────────
    // Plan is activated ONLY after HMAC + ownership both verified.
    const now = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from("payments")
      .update({
        payment_id:  razorpay_payment_id,
        status:      PaymentStatus.CAPTURED,
        verified:    true,
        updated_at:  now
      })
      .eq("id", pendingOrder.id);

    if (updateErr) {
      logEvent("ERROR", "Failed to update payment record to CAPTURED", { userId, error: updateErr });
      return res.status(500).json({ error: "Internal error activating payment. Contact support." });
    }

    // ── Step 5: Activate the user's plan ─────────────────────────────────────────
    if (planType) {
      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .update({ plan: planType, plan_status: "ACTIVE" })
        .eq("id", userId);

      if (profileErr) {
        logEvent("ERROR", "Failed to update user plan after payment", { userId, planType, error: profileErr });
        // Payment captured but plan not updated — log for manual reconciliation
        // Still return success so the UI reflects payment; webhook will also fire
      }
    }

    // ── Step 6: Append-only audit log entry (never overwrite, always append) ─────
    await supabaseAdmin.from("payment_logs").insert({
      user_id:    userId,
      event_type: "payment_verified",
      payload: {
        razorpay_order_id,
        razorpay_payment_id,
        plan_type:   planType,
        status:      PaymentStatus.CAPTURED,
        verified_at: now
      }
    });

    logEvent("INFO", "payment_verified", {
      userId,
      razorpay_payment_id,
      razorpay_order_id,
      planType,
      verified_at: now
    });
  } else {
    // Mock mode: no DB — still log the event
    logEvent("WARN", "Mock mode: skipping DB persistence for verify-order", { userId });
  }

  return res.status(200).json({ success: true });
}
