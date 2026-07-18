import { Request, Response, NextFunction } from "express";
import { PlanType, PLAN_AMOUNTS } from "../../plans/subscription";

/**
 * Server-authoritative plan price map (USD cents).
 * 100 cents = $1. Never trust client-supplied amounts.
 *
 * This is the SINGLE source of truth for what each plan costs.
 * To change pricing, update this map — no frontend changes required.
 */
export const PLAN_PRICES_USD: Record<string, number> = {
  [PlanType.GUARD_MONTHLY]: PLAN_AMOUNTS[PlanType.GUARD_MONTHLY],
  [PlanType.GUARD_ANNUAL]:  PLAN_AMOUNTS[PlanType.GUARD_ANNUAL],
  [PlanType.SHIELD_MONTHLY]: PLAN_AMOUNTS[PlanType.SHIELD_MONTHLY],
  [PlanType.SHIELD_ANNUAL]:  PLAN_AMOUNTS[PlanType.SHIELD_ANNUAL]
};

/** Valid plan identifiers accepted from the frontend */
export const VALID_PLANS = new Set(Object.keys(PLAN_PRICES_USD));

/** Valid billing cycles accepted from the frontend */
export const VALID_CYCLES = new Set(["monthly", "yearly", "annual"]);

/**
 * Normalises billing cycle: treats "yearly" and "annual" as equivalent.
 */
export function normaliseCycle(cycle: string): "monthly" | "annual" {
  return cycle === "yearly" || cycle === "annual" ? "annual" : "monthly";
}

/**
 * Derives the canonical plan key from tier + cycle.
 * e.g. ("guard", "yearly") → "guard_annual"
 */
export function toPlanKey(tier: string, cycle: string): string {
  return `${tier}_${normaliseCycle(cycle)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: validate POST /api/payments/create-order
// Ensures planType is a known plan; derives authoritative amount server-side.
// ─────────────────────────────────────────────────────────────────────────────
export function validateCreateOrder(req: Request, res: Response, next: NextFunction): void {
  const { planType } = req.body;

  if (!planType || typeof planType !== "string") {
    res.status(400).json({
      error: "Missing required field: planType.",
      valid_plans: Array.from(VALID_PLANS)
    });
    return;
  }

  if (!VALID_PLANS.has(planType)) {
    res.status(400).json({
      error: `Invalid planType: "${planType}". Must be one of: ${Array.from(VALID_PLANS).join(", ")}.`
    });
    return;
  }

  // Strip any client-supplied amount — the amount will be derived server-side
  delete req.body.amount;

  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: validate POST /api/payments/verify-order
// Ensures all three Razorpay callback fields are present and non-empty strings.
// ─────────────────────────────────────────────────────────────────────────────
export function validateVerifyOrder(req: Request, res: Response, next: NextFunction): void {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const missing: string[] = [];
  if (!razorpay_order_id || typeof razorpay_order_id !== "string")   missing.push("razorpay_order_id");
  if (!razorpay_payment_id || typeof razorpay_payment_id !== "string") missing.push("razorpay_payment_id");
  if (!razorpay_signature || typeof razorpay_signature !== "string")  missing.push("razorpay_signature");

  if (missing.length > 0) {
    res.status(400).json({
      error: `Missing or invalid required fields: ${missing.join(", ")}.`
    });
    return;
  }

  // Validate field format (Razorpay IDs follow known prefixes)
  if (!razorpay_order_id.startsWith("order_") && !razorpay_order_id.startsWith("order_mock_")) {
    res.status(400).json({ error: "razorpay_order_id has an unrecognised format." });
    return;
  }
  if (!razorpay_payment_id.startsWith("pay_") && !razorpay_payment_id.startsWith("pay_mock_")) {
    res.status(400).json({ error: "razorpay_payment_id has an unrecognised format." });
    return;
  }

  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: validate POST /api/payments/create-subscription
// Validates tier (guard/shield) and billing cycle before Razorpay API call.
// ─────────────────────────────────────────────────────────────────────────────
export function validateCreateSubscription(req: Request, res: Response, next: NextFunction): void {
  const { planType, interval } = req.body;

  if (!planType || !interval) {
    res.status(400).json({ error: "Missing required fields: planType and interval." });
    return;
  }

  const VALID_TIERS = new Set(["guard", "shield"]);
  if (!VALID_TIERS.has(planType)) {
    res.status(400).json({ error: `Invalid planType: "${planType}". Must be "guard" or "shield".` });
    return;
  }

  if (!VALID_CYCLES.has(interval)) {
    res.status(400).json({ error: `Invalid interval: "${interval}". Must be "monthly", "yearly", or "annual".` });
    return;
  }

  next();
}
