import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { supabaseAdmin, isSupabaseConfiguredBackend } from "../utils/supabase";
import { logEvent } from "../utils/logger";
import { fetchWithRetry } from "../utils/fetch";
import crypto from "crypto";
import { PlanType, PLAN_IDS, PLAN_AMOUNTS } from "../../plans/subscription";
import { PaymentStatus } from "../utils/paymentStates";

export async function createSubscription(req: AuthenticatedRequest, res: Response) {
  let paymentRecordId: string | null = null;
  const userId = req.user.id;
  const userEmail = req.user.email;
  
  try {
    const { planType, interval } = req.body;
    if (!planType || !interval) {
      return res.status(400).json({ error: "Missing required parameters: planType and interval." });
    }
    if (planType !== "guard" && planType !== "shield") {
      return res.status(400).json({ error: "Invalid planType. Must be 'guard' or 'shield'." });
    }
    if (interval !== "monthly" && interval !== "yearly" && interval !== "annual") {
      return res.status(400).json({ error: "Invalid interval. Must be 'monthly', 'yearly', or 'annual'." });
    }

    const billingCycle = interval === "yearly" || interval === "annual" ? "annual" : "monthly";
    const planKey = `${planType}_${billingCycle}`;
    const amount = PLAN_AMOUNTS[planKey];
    const currency = "USD";
    const planId = PLAN_IDS[planKey];

    logEvent("INFO", "Initiating subscription creation request", { userId, planType, billingCycle });

    // 1. Create Pending Subscription in Internal Database
    if (isSupabaseConfiguredBackend()) {
      const { data: paymentRecord, error: dbError } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id:         userId,
          subscription_id: `pending_${Date.now()}`,
          amount,
          currency,
          status:          PaymentStatus.PENDING,
          verified:        false,
          created_at:      new Date().toISOString(),
          updated_at:      new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        logEvent("ERROR", "Failed to create internal pending subscription record", { userId, error: dbError });
        return res.status(500).json({ error: "Database error during subscription initialization." });
      }
      paymentRecordId = paymentRecord.id;
    }

    // 2. Request Razorpay Subscription Creation
    let subscriptionId = `sub_mock_${Date.now()}`;
    const hasRazorpayConfig = !!process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== "placeholder-secret";

    if (hasRazorpayConfig) {
      try {
        const authHeader = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
        const rzpResponse = await fetchWithRetry("https://api.razorpay.com/v1/subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${authHeader}`
          },
          body: JSON.stringify({
            plan_id: planId,
            total_count: 12,
            quantity: 1,
            customer_notify: 1,
            notes: {
              userId,
              email: userEmail,
              planType,
              paymentRecordId
            }
          })
        });

        if (!rzpResponse.ok) {
          const rzpError = await rzpResponse.text();
          throw new Error(`Razorpay subscription creation response not OK: ${rzpError}`);
        }

        const rzpData = await rzpResponse.json();
        subscriptionId = rzpData.id;
      } catch (rzpErr: any) {
        logEvent("ERROR", "Razorpay subscription creation failed, rolling back internal DB payment record", { userId, error: rzpErr.message });
        if (paymentRecordId) {
          await supabaseAdmin.from("payments").delete().eq("id", paymentRecordId);
        }
        return res.status(502).json({ error: "Razorpay provider is currently unreachable. Please try again later." });
      }
    } else {
      if (process.env.ALLOW_MOCK_PAYMENTS !== "true") {
        logEvent("WARN", "Razorpay credentials not configured and ALLOW_MOCK_PAYMENTS is not true. Blocking subscription creation.", { userId });
        if (paymentRecordId) {
          await supabaseAdmin.from("payments").delete().eq("id", paymentRecordId);
        }
        return res.status(501).json({
          error: "Razorpay integration is not configured on the backend. To enable simulated upgrades in development, set ALLOW_MOCK_PAYMENTS=true in your .env file."
        });
      }
      logEvent("WARN", "Razorpay credentials not configured. Generating mock subscription ID since ALLOW_MOCK_PAYMENTS is true", { userId, subscriptionId });
    }

    // 3. Update the pending subscription record with actual Razorpay Subscription ID
    if (paymentRecordId) {
      const { error: updErr } = await supabaseAdmin
        .from("payments")
        .update({ subscription_id: subscriptionId })
        .eq("id", paymentRecordId);
        
      if (updErr) {
        logEvent("ERROR", "Failed to update pending payment record with subscription ID", { userId, paymentRecordId, subscriptionId, error: updErr });
      }
    }

    // Append-only audit log
    if (isSupabaseConfiguredBackend()) {
      await supabaseAdmin.from("payment_logs").insert({
        user_id:    userId,
        event_type: "subscription.created_pending",
        payload: {
          plan_type:       planType,
          subscription_id: subscriptionId,
          internal_id:     paymentRecordId,
          created_at:      new Date().toISOString()
        }
      });
    }

    logEvent("INFO", "payment_created", {
      userId, planType, billingCycle,
      subscriptionId, internalId: paymentRecordId,
      created_at: new Date().toISOString()
    });

    logEvent("INFO", "Subscription checkout initiated successfully", { userId, subscriptionId });

    return res.json({
      subscriptionId,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder"
    });
  } catch (error: any) {
    logEvent("ERROR", "Failed to create subscription", { userId, error: error.message });
    return res.status(500).json({ error: "Failed to initialize subscription checkout." });
  }
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response) {
  const userId = req.user.id;
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, planType } = req.body;

    logEvent("INFO", "Initiating subscription payment verification", { userId, razorpay_payment_id, razorpay_subscription_id });

    // 1. Signature Verification (subscription flow: payment_id|subscription_id)
    const hasRazorpayConfig = !!process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== "placeholder-secret";
    if (hasRazorpayConfig) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest("hex");

      let isValid = false;
      try {
        isValid =
          !!razorpay_signature &&
          expectedSignature.length === razorpay_signature.length &&
          crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(razorpay_signature, "hex")
          );
      } catch {
        isValid = false;
      }

      if (!isValid) {
        logEvent("ERROR", "payment_verification_failed", {
          userId, razorpay_payment_id, reason: "HMAC_SIGNATURE_MISMATCH"
        });
        // 422 Unprocessable Entity: well-formed request but signature is semantically invalid
        return res.status(422).json({ error: "Payment signature is invalid." });
      }
    } else {
      logEvent("WARN", "Mock Mode: Bypassing signature verification", { userId });
    }

    if (isSupabaseConfiguredBackend()) {
      // 2. Idempotency Check
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("payment_id", razorpay_payment_id)
        .maybeSingle();

      if (existingPayment && existingPayment.verified) {
        logEvent("INFO", "Payment already verified (Idempotent bypass)", { userId, razorpay_payment_id });
        return res.json({ success: true, message: "Payment already verified." });
      }

      // 3. Update the payment row: transition to CAPTURED
      await supabaseAdmin
        .from("payments")
        .update({
          payment_id: razorpay_payment_id,
          status:     PaymentStatus.CAPTURED,
          verified:   true,
          updated_at: new Date().toISOString()
        })
        .eq("subscription_id", razorpay_subscription_id);

      // 4. Update the User's Profile Plan
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: planType,
          plan_status: "ACTIVE"
        })
        .eq("id", userId);

      if (profileError) {
        logEvent("ERROR", "Failed to update user profile plan during payment verification", { userId, error: profileError });
        return res.status(500).json({ error: "Failed to update profile subscription status." });
      }

      // Append-only audit log
      await supabaseAdmin.from("payment_logs").insert({
        user_id:    userId,
        event_type: "payment_verified",
        payload: {
          razorpay_payment_id,
          razorpay_subscription_id,
          plan_type:   planType,
          status:      PaymentStatus.CAPTURED,
          verified_at: new Date().toISOString()
        }
      });

      logEvent("INFO", "payment_verified", {
        userId, razorpay_payment_id, razorpay_subscription_id, planType,
        verified_at: new Date().toISOString()
      });
    } else {
      logEvent("WARN", "Mock Mode: Skipping database persistence for verify-payment", { userId });
    }

    logEvent("INFO", "Subscription payment verified and user upgraded successfully", { userId, planType });
    return res.json({ success: true });
  } catch (error: any) {
    logEvent("ERROR", "Payment verification exception occurred", { userId, error: error.message });
    return res.status(500).json({ error: "Payment verification process failed." });
  }
}

export async function getSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user.id;
    if (!isSupabaseConfiguredBackend()) {
      return res.json({ plan: "sniff", status: "ACTIVE", subscription: null });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, plan_status")
      .eq("id", userId)
      .single();

    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return res.json({
      plan: profile?.plan || "sniff",
      status: profile?.plan_status || "ACTIVE",
      subscription: payments?.[0] || null
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load subscription." });
  }
}

export async function getUsage(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user.id;
    if (!isSupabaseConfiguredBackend()) {
      return res.json({ analysesToday: 0, lastReset: new Date().toISOString() });
    }

    const { data: usage } = await supabaseAdmin
      .from("usage")
      .select("analyses_today, last_reset")
      .eq("user_id", userId)
      .single();

    return res.json({
      analysesToday: usage?.analyses_today || 0,
      lastReset: usage?.last_reset || new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load usage metrics." });
  }
}

export async function restoreSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user.id;
    if (!isSupabaseConfiguredBackend()) {
      return res.json({ success: true, message: "Mock subscription restored." });
    }

    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("verified", true)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    if (payments && payments.length > 0) {
      const activeSub = payments[0];
      const subscriptionId = activeSub.subscription_id;
      const hasRazorpayConfig = !!process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== "placeholder-secret";

      let planType = "sniff";

      if (hasRazorpayConfig && subscriptionId && !subscriptionId.startsWith("sub_mock_")) {
        try {
          const authHeader = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
          const rzpResponse = await fetchWithRetry(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
            method: "GET",
            headers: {
              "Authorization": `Basic ${authHeader}`
            }
          });
          if (rzpResponse.ok) {
            const rzpData = await rzpResponse.json();
            const planId = rzpData.plan_id;
            if (planId === "plan_guard_monthly_live_128938129") planType = "guard_monthly";
            else if (planId === "plan_guard_yearly_live_128938130") planType = "guard_annual";
            else if (planId === "plan_shield_monthly_live_128938131") planType = "shield_monthly";
            else if (planId === "plan_shield_yearly_live_128938132") planType = "shield_annual";
          }
        } catch (err) {
          console.error("Razorpay subscription fetch failed during restore:", err);
        }
      }

      // Fallback: Check amount if not resolved from plan_id
      if (planType === "sniff") {
        const amt = activeSub.amount >= 10000 ? activeSub.amount / 100 : activeSub.amount;
        if (amt === PLAN_AMOUNTS.shield_annual) planType = "shield_annual";
        else if (amt === PLAN_AMOUNTS.shield_monthly) planType = "shield_monthly";
        else if (amt === PLAN_AMOUNTS.guard_annual) planType = "guard_annual";
        else if (amt === PLAN_AMOUNTS.guard_monthly) planType = "guard_monthly";
      }
      
      await supabaseAdmin
        .from("profiles")
        .update({ plan: planType, plan_status: "ACTIVE" })
        .eq("id", userId);

      return res.json({ success: true, message: `Restored ${planType.toUpperCase()} subscription.` });
    }

    return res.status(404).json({ error: "No active paid subscriptions found to restore." });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to restore subscription." });
  }
}

export async function cancelSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user.id;
    if (!isSupabaseConfiguredBackend()) {
      return res.json({ success: true, message: "Mock subscription cancelled." });
    }

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (!payment) {
      return res.status(404).json({ error: "No active subscription found to cancel." });
    }

    const subscriptionId = payment.subscription_id;
    const hasRazorpayConfig = !!process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== "placeholder-secret";

    if (hasRazorpayConfig && !subscriptionId.startsWith("sub_mock_")) {
      const authHeader = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
      const cancelResponse = await fetchWithRetry(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authHeader}`
        },
        body: JSON.stringify({ cancel_at_cycle_end: 0 })
      });

      if (!cancelResponse.ok) {
        const cancelError = await cancelResponse.text();
        console.error("Razorpay subscription cancel failed:", cancelError);
        return res.status(500).json({ error: "Failed to cancel subscription on Razorpay." });
      }
    }

    await supabaseAdmin
      .from("payments")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("subscription_id", subscriptionId);

    await supabaseAdmin
      .from("profiles")
      .update({ plan: "sniff", plan_status: "CANCELLED" })
      .eq("id", userId);

    await supabaseAdmin.from("payment_logs").insert({
      user_id: userId,
      event_type: "subscription.cancelled_client",
      payload: { subscriptionId }
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to cancel subscription." });
  }
}
