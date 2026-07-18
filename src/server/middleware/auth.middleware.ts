import { Request, Response, NextFunction } from "express";
import { supabaseAdmin, isSupabaseConfiguredBackend } from "../utils/supabase";
import { logEvent } from "../utils/logger";
import { isAdminEmail } from "../utils/admin";

export interface AuthenticatedRequest extends Request {
  user?: any;
  usageSource?: "plan" | "credit";
  targetPack?: any;
  currentUsageRow?: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!isSupabaseConfiguredBackend()) {
    req.user = { id: "00000000-0000-0000-0000-000000000000", email: "mock_user@example.com", isAdmin: false };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Guest access fallback when no token is present
    req.user = { id: "00000000-0000-0000-0000-000000000000", email: null, isAdmin: false, plan: "sniff" };
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const getAuthUser = async () => {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) throw new Error(error?.message || "User not found");
      return user;
    };
    
    let user;
    let retries = 2;
    let delay = 500;
    while (true) {
      try {
        user = await getAuthUser();
        break;
      } catch (err) {
        if (retries <= 0) throw err;
        retries--;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }

    // Tag admin / tester accounts — downstream controllers check req.user.isAdmin
    (user as any).isAdmin = isAdminEmail(user.email);

    if ((user as any).isAdmin) {
      logEvent("INFO", "[Admin] Admin account authenticated — full entitlements granted", { email: user.email });
    }

    req.user = user;
    next();
  } catch (err: any) {
    logEvent("WARN", "Auth middleware authentication failed", { error: err.message });
    return res.status(401).json({ error: "Authentication failed", details: err.message });
  }
}
