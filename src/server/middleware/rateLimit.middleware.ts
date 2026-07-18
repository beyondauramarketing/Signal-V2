import { Request, Response, NextFunction } from "express";
import { logEvent } from "../utils/logger";

const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();
    const cleanIp = Array.isArray(ip) ? ip[0] : ip;
    // Prefix key with route base and path to prevent collisions between endpoints
    const key = `${req.baseUrl || ""}${req.path}:${cleanIp}`;
    const userLimit = rateLimits.get(key);
    
    if (!userLimit || now > userLimit.resetTime) {
      rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    userLimit.count++;
    if (userLimit.count > limit) {
      logEvent("WARN", "Rate limit exceeded on payment endpoint", { ip: key, path: req.path });
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    next();
  };
}
