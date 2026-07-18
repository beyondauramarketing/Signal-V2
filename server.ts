import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { validateEnvironment } from "./src/server/middleware/validateEnv.middleware";
import { logEvent } from "./src/server/utils/logger";

// Validate required configurations on boot
validateEnvironment();

const app = express();

// ── Block sensitive config and dotfile access ────────────────────────────────
app.use((req, res, next) => {
  const urlPath = req.path.toLowerCase();
  if (
    urlPath.includes("/.env") ||
    urlPath.includes("/package.json") ||
    urlPath.includes("/tsconfig.json") ||
    urlPath.includes("/supabase_schema.sql") ||
    urlPath.split("/").some(part => part.startsWith(".") && part !== "" && part !== ".well-known")
  ) {
    logEvent("WARN", `Blocked access attempt to sensitive file: ${req.originalUrl}`, { ip: req.ip });
    return res.status(403).json({ error: "Access denied. Sensitive file exposure is blocked." });
  }
  next();
});

// ── Security headers (helmet sets X-Frame-Options, CSP, HSTS, etc.) ──────────
app.use(helmet({
  // Allow Razorpay checkout.js and our own scripts
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "https://checkout.razorpay.com", "'unsafe-inline'"],
      frameSrc:    ["'self'", "https://api.razorpay.com"],
      connectSrc:  ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      imgSrc:      ["'self'", "data:", "https://checkout.razorpay.com"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      fontSrc:     ["'self'", "data:"],
      workerSrc:   ["'self'", "blob:"]
    }
  }
}));

// ── CORS — only allow requests from our own origin in production ──────────────
const allowedOrigins = [
  process.env.APP_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:5173"   // Vite dev server
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ── Response compression ──────────────────────────────────────────────────────
app.use(compression());

// ── Body parser — captures rawBody for webhook HMAC verification ──────────────
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// ── API Routers ───────────────────────────────────────────────────────────────
import analysisRouter    from "./src/server/routes/analysis.routes";
import paymentRouter     from "./src/server/routes/payment.routes";
import webhookRouter     from "./src/server/routes/webhook.routes";
import healthRouter      from "./src/server/routes/health.routes";
import entitlementsRouter from "./src/server/routes/entitlements.routes";

app.use("/api", analysisRouter);
app.use("/api", paymentRouter);
app.use("/api", webhookRouter);
app.use("/api", healthRouter);
app.use("/api", entitlementsRouter);

// ── Server startup ────────────────────────────────────────────────────────────
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "localhost", () => {
    logEvent("INFO", `[Dogesh Signal] Server running on http://localhost:${PORT}`);
  });
}

startServer();
