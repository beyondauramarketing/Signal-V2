import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { supabaseAdmin, isSupabaseConfiguredBackend } from "../utils/supabase";
import { PLAN_ENTITLEMENTS, PlanType } from "../../plans/subscription";
import { logEvent } from "../utils/logger";

export async function getUserEntitlements(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    let plan = "sniff";
    let status = "ACTIVE";
    let analysesToday = 0;
    let packCreditsRemaining = 0;

    if (isSupabaseConfiguredBackend()) {
      // 1. Fetch user profile
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .select("plan, plan_status")
        .eq("id", userId)
        .single();
      
      if (profileErr) {
        logEvent("WARN", "Profiles lookup failed for entitlements resolution", { userId, error: profileErr.message });
      }
      
      if (profile) {
        plan = profile.plan || "sniff";
        status = profile.plan_status || "ACTIVE";
      }

      // 2. Fetch daily usage limit
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabaseAdmin
        .from("usage")
        .select("analyses_today, last_reset")
        .eq("user_id", userId)
        .single();

      if (usage) {
        const dbResetDate = new Date(usage.last_reset).toISOString().split("T")[0];
        if (dbResetDate === today) {
          analysesToday = usage.analyses_today;
        }
      }

      // 3. Fetch credit packs balance
      const { data: credits } = await supabaseAdmin
        .from("credit_packs")
        .select("remaining_credits")
        .eq("user_id", userId);

      if (credits) {
        packCreditsRemaining = credits.reduce((acc, curr) => acc + curr.remaining_credits, 0);
      }
    } else {
      // Mock / Local Fallback
      plan = req.user.plan || "sniff";
      status = req.user.plan_status || "ACTIVE";
    }

    // ── Admin / tester bypass ──────────────────────────────────────────────
    // Admin accounts get shield_annual entitlements with their actual usage counted.
    if (req.user.isAdmin) {
      const entitlementData = PLAN_ENTITLEMENTS[PlanType.SHIELD_ANNUAL];
      return res.json({
        userId,
        email: userEmail,
        plan: PlanType.SHIELD_ANNUAL,
        status: "ACTIVE",
        isAdmin: true,
        features: entitlementData.features,
        limits: { 
          ...entitlementData.limits, 
          "analysis.daily": 999999 
        },
        usage: {
          analysesToday,
          packCreditsRemaining: 999999,
        },
        mockPaymentsAllowed: process.env.ALLOW_MOCK_PAYMENTS === "true"
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    const entitlementData = PLAN_ENTITLEMENTS[plan as PlanType] || PLAN_ENTITLEMENTS[PlanType.SNIFF];

    return res.json({
      userId,
      email: userEmail,
      plan,
      status,
      features: entitlementData.features,
      limits: entitlementData.limits,
      usage: {
        analysesToday,
        packCreditsRemaining
      },
      mockPaymentsAllowed: process.env.ALLOW_MOCK_PAYMENTS === "true"
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to resolve entitlements.", details: err.message });
  }
}
