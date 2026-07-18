import { Router } from "express";
import { analyzeMessage, translateText } from "../controllers/analysis.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { rateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/analyze", requireAuth, rateLimiter(15, 60000), analyzeMessage);
router.post("/translate", requireAuth, rateLimiter(15, 60000), translateText);

export default router;

