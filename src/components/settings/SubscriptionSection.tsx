import React, { useState, useRef } from "react";
import { CreditCard, LogOut, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { PlanType, UserProfile, PLAN_ENTITLEMENTS } from "../../plans/subscription";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

interface SubscriptionSectionProps {
  theme: "light" | "dark";
  user: UserProfile | null;
  onUpgradePlan: (plan: PlanType) => void;
  onLogout: () => void;
  token: string | null;
}

// Display-only labels for the UI (never used as payment amounts)
const PLAN_DISPLAY: Record<string, { monthly: string; annual: string }> = {
  guard:  { monthly: "$4.99/mo",   annual: "$49/yr" },
  shield: { monthly: "$12.99/mo", annual: "$129/yr" }
};

/** Exponential backoff delay: 2s → 4s → 8s */
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Calls verify-order with up to `maxRetries` attempts on 5xx errors.
 * Shows a "Verifying payment…" toast during retries.
 * Returns the response JSON on success, throws on final failure.
 */
async function verifyOrderWithRetry(
  payload: object,
  token: string | null,
  maxRetries = 3
): Promise<{ success: boolean; message?: string; conflict?: boolean }> {
  let lastError: Error | null = null;
  let retryToastId: string | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitMs = 2000 * Math.pow(2, attempt - 1); // 2s, 4s
      retryToastId = toast.loading(`Verifying payment… (attempt ${attempt + 1}/${maxRetries})`, {
        id: retryToastId
      }) as string;
      await sleep(waitMs);
    }

    try {
      const res = await fetch("/api/payments/verify-order", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Dismiss retry toast on any response
      if (retryToastId) toast.dismiss(retryToastId);

      // 2xx and 4xx are definitive — don't retry
      if (res.status < 500) {
        const data = await res.json();
        if (!res.ok) throw Object.assign(new Error(data.error || "Verification failed."), { status: res.status });
        return data;
      }

      // 5xx — server error, eligible for retry
      const errText = await res.text().catch(() => "Unknown server error");
      lastError = new Error(`Server error (${res.status}): ${errText}`);
    } catch (fetchErr: any) {
      if (retryToastId) toast.dismiss(retryToastId);
      // Network error — eligible for retry
      lastError = fetchErr;
    }
  }

  throw lastError || new Error("Payment verification failed after multiple attempts.");
}

export function SubscriptionSection({
  theme,
  user,
  onUpgradePlan,
  onLogout,
  token
}: SubscriptionSectionProps) {
  const { entitlements: authEntitlements } = useAuth();
  const [isProcessing, setIsProcessing]   = useState(false);
  const [billingCycle, setBillingCycle]   = useState<"monthly" | "yearly">("monthly");
  const [paymentError, setPaymentError]   = useState<string | null>(null);
  // Ref prevents double-clicks from opening two Razorpay modals
  const isOpenRef = useRef(false);

  if (!user) return null;

  const activePlan   = user.plan;
  const entitlements = PLAN_ENTITLEMENTS[activePlan];
  const cycleKey     = billingCycle === "yearly" ? "annual" : "monthly";

  // ── Standard Checkout (order-based) ─────────────────────────────────────────
  const handleUpgradeViaOrder = async (tier: "guard" | "shield") => {
    if (isProcessing || isOpenRef.current) return;  // prevent double-click

    setIsProcessing(true);
    setPaymentError(null);
    isOpenRef.current = true;

    const targetPlan = (
      tier === "guard"
        ? (billingCycle === "monthly" ? PlanType.GUARD_MONTHLY : PlanType.GUARD_ANNUAL)
        : (billingCycle === "monthly" ? PlanType.SHIELD_MONTHLY : PlanType.SHIELD_ANNUAL)
    ) as PlanType;

    // planType key sent to backend — backend looks up the authoritative INR amount
    const planKey = `${tier}_${cycleKey}`;

    try {
      // ── Step 1: Create order (backend derives amount — we never send it) ──────
      const orderRes = await fetch("/api/payments/create-order", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ planType: planKey })   // NO amount field
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create payment order.");
      }

      const orderData = await orderRes.json();

      // Validate Razorpay checkout.js is loaded
      if (typeof (window as any).Razorpay === "undefined") {
        throw new Error(
          "Payment provider script not loaded. Check your internet connection and reload the page."
        );
      }

      // ── Step 2: Open Razorpay checkout modal ─────────────────────────────────
      const options = {
        key:      orderData.key_id,
        amount:   orderData.amount,
        currency: orderData.currency,
        name:     "Dogesh Signal",
        description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan — ${billingCycle}`,
        order_id: orderData.order_id,
        image:    "/logo.png",
        prefill:  { email: user.email },
        theme:    { color: "#F97316" },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled.", { icon: "ℹ️" });
            setIsProcessing(false);
            isOpenRef.current = false;
          }
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id:   string;
          razorpay_signature:  string;
        }) => {
          // ── Step 3: Verify signature on backend with retry ──────────────────
          setIsProcessing(true);
          try {
            const verifyData = await verifyOrderWithRetry(
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
                planType:            targetPlan
              },
              token
            );

            // 409 Conflict = already verified (idempotent success)
            if (verifyData.success) {
              toast.success(`🎉 ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan activated!`);
              onUpgradePlan(targetPlan);
            } else {
              throw new Error("Verification returned failure.");
            }
          } catch (verifyErr: any) {
            const status = (verifyErr as any)?.status;
            if (status === 422) {
              setPaymentError("Payment signature invalid. Please contact support with your payment ID.");
            } else if (status === 403) {
              setPaymentError("Ownership mismatch. Please log out and try again.");
            } else {
              setPaymentError(
                verifyErr?.message ||
                "Verification failed. Your payment may have been taken — contact support."
              );
            }
            toast.error("Payment verification failed — see error below.");
          } finally {
            setIsProcessing(false);
            isOpenRef.current = false;
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);

      // Handle payment failure inside the modal (card declined, network, etc.)
      rzp.on("payment.failed", (failureResponse: any) => {
        const desc = failureResponse?.error?.description || "Payment failed.";
        const code = failureResponse?.error?.code || "";
        toast.error(`Payment failed: ${desc}`);
        setPaymentError(`Payment failed${code ? ` (${code})` : ""}: ${desc}`);
        setIsProcessing(false);
        isOpenRef.current = false;
      });

      rzp.open();
    } catch (err: any) {
      console.error("Checkout error:", err);
      const msg = err?.message || "Failed to open payment checkout.";
      setPaymentError(msg);
      toast.error(msg);
      setIsProcessing(false);
      isOpenRef.current = false;
    }
  };

  // ── Subscription flow (kept for recurring billing when Razorpay plan IDs exist) ──
  const handleUpgradeViaSubscription = async (tier: "guard" | "shield") => {
    if (isProcessing || isOpenRef.current) return;

    setIsProcessing(true);
    setPaymentError(null);
    isOpenRef.current = true;

    const targetPlan = (
      tier === "guard"
        ? (billingCycle === "monthly" ? PlanType.GUARD_MONTHLY : PlanType.GUARD_ANNUAL)
        : (billingCycle === "monthly" ? PlanType.SHIELD_MONTHLY : PlanType.SHIELD_ANNUAL)
    ) as PlanType;

    try {
      const response = await fetch("/api/payments/create-subscription", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ planType: tier, interval: billingCycle })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to initialize subscription checkout.");
      }

      const orderData = await response.json();

      if (typeof (window as any).Razorpay === "undefined") {
        throw new Error("Payment provider script not loaded. Reload the page and try again.");
      }

      const options = {
        key:             orderData.keyId,
        subscription_id: orderData.subscriptionId,
        name:            "Dogesh Signal",
        description:     `${targetPlan.toUpperCase()} Plan Subscription`,
        image:           "/logo.png",
        prefill:         { email: user.email },
        theme:           { color: "#F97316" },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled.", { icon: "ℹ️" });
            setIsProcessing(false);
            isOpenRef.current = false;
          }
        },
        handler: async (checkoutResponse: any) => {
          setIsProcessing(true);
          try {
            const verifyData = await verifyOrderWithRetry(
              {
                razorpay_payment_id:      checkoutResponse.razorpay_payment_id,
                razorpay_subscription_id: checkoutResponse.razorpay_subscription_id,
                razorpay_signature:       checkoutResponse.razorpay_signature,
                planType:                 targetPlan
              },
              token
            );
            if (verifyData.success) {
              toast.success(`🎉 ${targetPlan.toUpperCase()} subscription activated!`);
              onUpgradePlan(targetPlan);
            }
          } catch (verifyErr: any) {
            setPaymentError(verifyErr?.message || "Subscription verification failed.");
            toast.error("Subscription verification failed.");
          } finally {
            setIsProcessing(false);
            isOpenRef.current = false;
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (fr: any) => {
        const desc = fr?.error?.description || "Payment failed.";
        toast.error(`Payment failed: ${desc}`);
        setPaymentError(desc);
        setIsProcessing(false);
        isOpenRef.current = false;
      });
      rzp.open();
    } catch (err: any) {
      const msg = err?.message || "Failed to open payment checkout.";
      setPaymentError(msg);
      toast.error(msg);
      setIsProcessing(false);
      isOpenRef.current = false;
    }
  };

  // Primary flow: Standard Checkout (order-based)
  const handleUpgrade = handleUpgradeViaOrder;

  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl"
    : "bg-white border border-slate-200 shadow-md";

  return (
    <div className={`p-6 rounded-2xl space-y-4.5 ${bgCardClass}`} id="cloud_sync_sub_card">
      <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200 dark:border-slate-800">
        <CreditCard className="w-4.5 h-4.5 text-orange-500" />
        <h3 className="text-xs font-sans font-bold tracking-wider uppercase text-slate-850 dark:text-slate-200">
          Cloud Sync &amp; Subscription
        </h3>
      </div>

      <div className="space-y-4 text-left">
        {/* Current plan info */}
        <div className="p-3.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Account:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{user.email}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Subscription:</span>
            <span className="font-bold text-orange-500 uppercase font-mono">{user.plan}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Profile ID:</span>
            <span className="font-mono text-[9px] text-slate-400 truncate max-w-[150px]">{user.id}</span>
          </div>
        </div>

        {/* Sandbox Mock Payments Warning Banner */}
        {authEntitlements?.mockPaymentsAllowed && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-left">
              <p className="text-[9.5px] font-mono font-bold text-amber-500 uppercase tracking-wider">Sandbox Mode Active</p>
              <p className="text-[9px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed">
                Mock payments are enabled. Upgrades will not trigger real billing.
              </p>
            </div>
          </div>
        )}

        {/* Payment error banner */}
        {paymentError && (
          <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-rose-400 leading-relaxed">{paymentError}</p>
          </div>
        )}

        {/* Upgrade section (hidden when on top Shield tier) */}
        {user.plan !== PlanType.SHIELD_MONTHLY && user.plan !== PlanType.SHIELD_ANNUAL && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-900/60 space-y-2.5">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                Upgrade Plan
              </span>
              {/* Monthly / Yearly toggle */}
              <div className="p-0.5 bg-slate-200 dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-850 flex select-none">
                {(["monthly", "yearly"] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    disabled={isProcessing}
                    className={`px-2 py-0.5 rounded-md transition-all text-[8px] font-mono uppercase font-bold cursor-pointer border-none ${
                      billingCycle === cycle
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent"
                    }`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>

            {isProcessing ? (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col items-center justify-center space-y-2 text-center">
                <span className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Connecting to Razorpay…
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Guard button — only show when on free Sniff plan */}
                {user.plan === PlanType.SNIFF && (
                  <button
                    id="btn_upgrade_guard"
                    onClick={() => handleUpgrade("guard")}
                    disabled={isProcessing}
                    className="flex-grow py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-[10px] font-mono font-bold uppercase text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-3.5 h-3.5 text-orange-500" />
                    <span>Guard ({PLAN_DISPLAY.guard[cycleKey]})</span>
                  </button>
                )}
                {/* Shield button */}
                <button
                  id="btn_upgrade_shield"
                  onClick={() => handleUpgrade("shield")}
                  disabled={isProcessing}
                  className="flex-grow py-2 px-3 bg-orange-500 hover:bg-orange-450 text-slate-950 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                  <span>Shield ({PLAN_DISPLAY.shield[cycleKey]})</span>
                </button>
              </div>
            )}

            {/* Test credentials reminder for dev */}
            <p className="text-[9px] font-mono text-slate-500 dark:text-slate-600 text-center pt-1">
              Test card: 4111 1111 1111 1111 · CVV: 123 · Exp: 12/26 · UPI: success@razorpay
            </p>
          </div>
        )}

        {/* Footer: cloud/local status + logout */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-900/60 flex justify-between items-center">
          {entitlements.features["history.cloud"] ? (
            <span className="text-[9.5px] font-mono text-emerald-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cloud active
            </span>
          ) : (
            <span className="text-[9.5px] font-mono text-amber-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5 select-none">
              🔒 Local active
            </span>
          )}
          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-500 rounded-lg font-mono text-[9.5px] uppercase font-bold border border-rose-500/10 cursor-pointer flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
}
