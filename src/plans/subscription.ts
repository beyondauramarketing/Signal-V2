export enum PlanType {
  SNIFF = "sniff",
  GUARD_MONTHLY = "guard_monthly",
  GUARD_ANNUAL = "guard_annual",
  SHIELD_MONTHLY = "shield_monthly",
  SHIELD_ANNUAL = "shield_annual"
}

export interface UserProfile {
  id: string;
  email: string;
  plan: PlanType;
  createdAt: string;
}

export type FeatureKey =
  | "analysis.basic"
  | "analysis.advanced"
  | "analysis.premium"
  | "history.local"
  | "history.cloud"
  | "reply.basic"
  | "reply.smart"
  | "reply.premium"
  | "export.summary"
  | "tracking.basic"
  | "tracking.full"
  | "scenarios.selected"
  | "scenarios.full"
  | "support.priority"
  | "beta.early_access";

export interface Entitlements {
  features: Record<FeatureKey, boolean>;
  limits: {
    "analysis.daily": number;
    "analysis.monthly": number;
    "cloud_history.saved": number;
    "exports.monthly": number;
    "premium_scenarios.monthly": number;
  };
}

const sniffFeatures: Record<FeatureKey, boolean> = {
  "analysis.basic": true,
  "analysis.advanced": false,
  "analysis.premium": false,
  "history.local": true,
  "history.cloud": false,
  "reply.basic": true,
  "reply.smart": false,
  "reply.premium": false,
  "export.summary": false,
  "tracking.basic": false,
  "tracking.full": false,
  "scenarios.selected": false,
  "scenarios.full": false,
  "support.priority": false,
  "beta.early_access": false
};

const sniffLimits = {
  "analysis.daily": 5,
  "analysis.monthly": 30,
  "cloud_history.saved": 0,
  "exports.monthly": 0,
  "premium_scenarios.monthly": 0
};

const guardFeatures: Record<FeatureKey, boolean> = {
  "analysis.basic": true,
  "analysis.advanced": true,
  "analysis.premium": false,
  "history.local": true,
  "history.cloud": true,
  "reply.basic": true,
  "reply.smart": true,
  "reply.premium": false,
  "export.summary": true,
  "tracking.basic": true,
  "tracking.full": false,
  "scenarios.selected": true,
  "scenarios.full": false,
  "support.priority": false,
  "beta.early_access": false
};

const guardLimits = {
  "analysis.daily": 50,
  "analysis.monthly": 300,
  "cloud_history.saved": 500,
  "exports.monthly": 50,
  "premium_scenarios.monthly": 20
};

const shieldFeatures: Record<FeatureKey, boolean> = {
  "analysis.basic": true,
  "analysis.advanced": true,
  "analysis.premium": true,
  "history.local": true,
  "history.cloud": true,
  "reply.basic": true,
  "reply.smart": true,
  "reply.premium": true,
  "export.summary": true,
  "tracking.basic": true,
  "tracking.full": true,
  "scenarios.selected": true,
  "scenarios.full": true,
  "support.priority": true,
  "beta.early_access": true
};

const shieldLimits = {
  "analysis.daily": 200,
  "analysis.monthly": 1500,
  "cloud_history.saved": 5000,
  "exports.monthly": 500,
  "premium_scenarios.monthly": 200
};

export const PLAN_ENTITLEMENTS: Record<PlanType, Entitlements> = {
  [PlanType.SNIFF]: {
    features: sniffFeatures,
    limits: sniffLimits
  },
  [PlanType.GUARD_MONTHLY]: {
    features: guardFeatures,
    limits: guardLimits
  },
  [PlanType.GUARD_ANNUAL]: {
    features: guardFeatures,
    limits: guardLimits
  },
  [PlanType.SHIELD_MONTHLY]: {
    features: shieldFeatures,
    limits: shieldLimits
  },
  [PlanType.SHIELD_ANNUAL]: {
    features: shieldFeatures,
    limits: shieldLimits
  }
};

export const PLAN_IDS: Record<PlanType, string | null> = {
  [PlanType.SNIFF]: null,
  [PlanType.GUARD_MONTHLY]: "plan_guard_monthly_live_128938129",
  [PlanType.GUARD_ANNUAL]: "plan_guard_yearly_live_128938130",
  [PlanType.SHIELD_MONTHLY]: "plan_shield_monthly_live_128938131",
  [PlanType.SHIELD_ANNUAL]: "plan_shield_yearly_live_128938132"
};

export const PLAN_AMOUNTS: Record<PlanType, number> = {
  [PlanType.SNIFF]: 0,
  [PlanType.GUARD_MONTHLY]: 499,
  [PlanType.GUARD_ANNUAL]: 4900,
  [PlanType.SHIELD_MONTHLY]: 1299,
  [PlanType.SHIELD_ANNUAL]: 12900
};

// Simulated Auth Session Helper for testing the architecture in the client app
export function getMockUser(): UserProfile | null {
  const data = localStorage.getItem("dogesh_mock_user");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setMockUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem("dogesh_mock_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("dogesh_mock_user");
  }
}

export function isLoggedIn(): boolean {
  return getMockUser() !== null;
}
