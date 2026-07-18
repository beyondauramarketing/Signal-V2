import { Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { supabaseAdmin, isSupabaseConfiguredBackend } from "../utils/supabase";
import { PLAN_ENTITLEMENTS, PlanType } from "../../plans/subscription";
import { logEvent } from "../utils/logger";

let aiClient: GoogleGenAI | null = null;
const guestUsage = new Map<string, { count: number; resetTime: number }>();
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function analyzeMessage(req: AuthenticatedRequest, res: Response) {
  const isGuest = req.user.id === "00000000-0000-0000-0000-000000000000";
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  let isGuestIncremented = false;
  let isUsageIncremented = false;
  let isCreditDecremented = false;
  let packIdToRefund: string | null = null;
  let usageSource: "plan" | "credit" = "plan";
  let targetPack: any = null;

  try {
    const { message, enableReplyForge, model } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Message is required and must be a string." });
    }

    const modelName = model || process.env.GEMINI_MODEL || "gemini-3.5-flash";

    // ── Guest Limit Validation (IP-based tracking in-memory) ──────────────────────
    if (isGuest) {
      const now = Date.now();
      const guestLimit = 5;
      const windowMs = 24 * 60 * 60 * 1000;
      
      const record = guestUsage.get(clientIp);
      if (!record || now > record.resetTime) {
        guestUsage.set(clientIp, { count: 1, resetTime: now + windowMs });
      } else {
        if (record.count >= guestLimit) {
          logEvent("WARN", "Guest daily limit exceeded", { ip: clientIp });
          return res.status(429).json({ error: "Guest daily limit exceeded. Please sign up or log in to get more scans." });
        }
        record.count++;
      }
      isGuestIncremented = true;
    }

    // ── Authenticated User Limit & Concurrency Handling ────────────────────────
    let plan = "sniff";
    if (!req.user.isAdmin && isSupabaseConfiguredBackend() && !isGuest) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan")
        .eq("id", req.user.id)
        .single();
      
      if (profile) plan = profile.plan || "sniff";

      const entitlements = PLAN_ENTITLEMENTS[plan as PlanType] || PLAN_ENTITLEMENTS[PlanType.SNIFF];
      const limit = entitlements.limits["analysis.daily"];

      if (limit !== Infinity) {
        // Optimistic reservation to avoid concurrent race conditions: increment counter first
        const { error: rpcErr } = await supabaseAdmin.rpc("increment_daily_usage", { user_id_param: req.user.id });
        
        let analysesToday = 0;
        if (rpcErr && rpcErr.code === "42883") {
          // Fallback if RPC is missing
          const { data: usage } = await supabaseAdmin
            .from("usage")
            .select("analyses_today, last_reset")
            .eq("user_id", req.user.id)
            .single();
          
          const todayStr = new Date().toISOString().split("T")[0];
          const currentCount = usage ? usage.analyses_today : 0;
          const lastReset = usage ? new Date(usage.last_reset).toISOString().split("T")[0] : todayStr;
          analysesToday = lastReset === todayStr ? currentCount + 1 : 1;

          if (usage) {
            await supabaseAdmin
              .from("usage")
              .update({ 
                analyses_today: analysesToday,
                last_reset: lastReset === todayStr ? usage.last_reset : new Date().toISOString()
              })
              .eq("user_id", req.user.id);
          } else {
            await supabaseAdmin
              .from("usage")
              .insert({
                user_id: req.user.id,
                analyses_today: 1,
                last_reset: new Date().toISOString()
              });
          }
        } else if (rpcErr) {
          throw rpcErr;
        } else {
          const { data: usage } = await supabaseAdmin
            .from("usage")
            .select("analyses_today")
            .eq("user_id", req.user.id)
            .single();
          analysesToday = usage?.analyses_today || 1;
        }

        isUsageIncremented = true;

        if (analysesToday > limit) {
          // If we exceeded daily limit, refund the usage increment and try using credit pack
          isUsageIncremented = false;
          const { data: currentUsage } = await supabaseAdmin
            .from("usage")
            .select("analyses_today")
            .eq("user_id", req.user.id)
            .single();
          if (currentUsage && currentUsage.analyses_today > 0) {
            await supabaseAdmin
              .from("usage")
              .update({ analyses_today: currentUsage.analyses_today - 1 })
              .eq("user_id", req.user.id);
          }

          // Fetch and evaluate credit packs
          const { data: packs, error: fetchErr } = await supabaseAdmin
            .from("credit_packs")
            .select("*")
            .eq("user_id", req.user.id)
            .gt("remaining_credits", 0);

          if (fetchErr) throw fetchErr;

          const now = new Date();
          const validPacks = [];

          for (const pack of (packs || [])) {
            if (pack.expires_at && new Date(pack.expires_at) <= now) {
              await supabaseAdmin
                .from("credit_packs")
                .update({ remaining_credits: 0 })
                .eq("id", pack.id);

              await supabaseAdmin.from("credit_transactions").insert({
                user_id: req.user.id,
                amount: -pack.remaining_credits,
                type: "EXPIRY",
                metadata: { description: "Credit pack expired", packId: pack.id }
              });
            } else {
              validPacks.push(pack);
            }
          }

          if (validPacks.length === 0) {
            return res.status(403).json({
              error: "Daily limit exceeded. Please upgrade your plan or purchase Signal Packs."
            });
          }

          const sortedPacks = validPacks.sort((a, b) => {
            if (!a.expires_at) return 1;
            if (!b.expires_at) return -1;
            return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
          });

          const packToUse = sortedPacks[0];

          // Atomically decrement credit pack
          const { error: rpcDecErr } = await supabaseAdmin.rpc("decrement_credit_pack", { pack_id_param: packToUse.id });
          if (rpcDecErr && rpcDecErr.code === "42883") {
            await supabaseAdmin
              .from("credit_packs")
              .update({ remaining_credits: packToUse.remaining_credits - 1 })
              .eq("id", packToUse.id);
          } else if (rpcDecErr) {
            throw rpcDecErr;
          }

          await supabaseAdmin.from("credit_transactions").insert({
            user_id: req.user.id,
            amount: -1,
            type: "USAGE",
            metadata: { description: "Daily limit exceeded scan consumption", packId: packToUse.id }
          });

          isCreditDecremented = true;
          packIdToRefund = packToUse.id;
          usageSource = "credit";
          targetPack = packToUse;
        }
      }
    }

    const ai = getAiClient();

    // Coach vetting guidelines for Gemini
    const systemInstruction = `You are a professional communication coach and boundary assistant for Dogesh Signal (a trustworthy message-analysis assistant that helps users understand tone, risk levels, and pressure patterns in text messages).

Your objective is to analyze the user-provided text message with extreme precision according to these rules:

PART 1: CONTEXT DETECTION (WHO IS THE SENDER)
Identify one of these 5 scenarios based on the message content:
1) "HR / Recruiter / Hiring Team" (Keywords: "apply", "position", "hiring", "interview", "role", "salary", "benefits", "onboarding", "job offer", "team", "company")
2) "Freelance Client / Project Owner" (Keywords: "project", "work", "deliver", "milestone", "task", "scope", "payment", "compensation", "deadline", "client", "vendor", "contractor")
3) "Buyer / Seller / Marketplace Lead" (Keywords: "item", "product", "price", "buy", "sell", "marketplace", "listing", "shipping", "delivery", "order", "purchase")
4) "Landlord / Property Manager / Tenant" (Keywords: "rent", "property", "lease", "tenant", "landlord", "apartment", "house", "monthly", "utility", "maintenance")
5) "Ambiguous / Unvetted Profile" (Keywords: NONE of the above specific patterns)

PART 2: STRATEGIC SCAN TARGET DETECTION (WHO IS BEING TARGETED)
Set the Strategic Scan Target EXACTLY as follows:
- For Context = "Freelance Client / Project Owner":
  * If message asks worker to do work -> "Worker / Freelancer / Vendor"
  * If message asks client to pay -> "Client / Buyer"
- For Context = "HR / Recruiter / Hiring Team": -> "Job Candidate"
- For Context = "Landlord / Property Manager / Tenant": -> "Tenant / Renter"
- For Context = "Buyer / Seller / Marketplace Lead":
  * If buyer message -> "Seller"
  * If seller message -> "Buyer"
- For Context = "Ambiguous / Unvetted Profile": -> "Targeted Counterparty"

CRITICAL RULE: The Strategic Scan Target is ALWAYS the target being asked to act, commit, or do/pay (never the sender!). NEVER give the same Strategic Scan Target for different messages; it must be completely context-aware and accurate.

PART 3: CONTEXT-SPECIFIC WEIGHTS & MICRO-FEATURE DEFINITIONS
Score each of the 10 micro-features as an integer within its context-specific maximum range value defined below.

If context = "Freelance Client / Project Owner":
- deferredPaymentRisk: Max 25
- urgencyPressure: Max 20
- guiltPressure: Max 15
- sunkCostPressure: Max 15
- futureOpportunityBait: Max 10
- scopeCreepRisk: Max 15
- dependencyPressure: Max 10
- boundaryErosion: Max 15
- manipulationIntensity: Max 10
- transparencySignals: Max 10

If context = "HR / Recruiter / Hiring Team":
- deferredPaymentRisk: Max 5
- urgencyPressure: Max 15
- guiltPressure: Max 12
- sunkCostPressure: Max 10
- futureOpportunityBait: Max 12
- scopeCreepRisk: Max 8
- dependencyPressure: Max 12
- boundaryErosion: Max 12
- manipulationIntensity: Max 15
- transparencySignals: Max 10

If context = "Landlord / Property Manager / Tenant":
- deferredPaymentRisk: Max 8
- urgencyPressure: Max 12
- guiltPressure: Max 10
- sunkCostPressure: Max 8
- futureOpportunityBait: Max 5
- scopeCreepRisk: Max 5
- dependencyPressure: Max 10
- boundaryErosion: Max 18
- manipulationIntensity: Max 10
- transparencySignals: Max 10

If context = "Buyer / Seller / Marketplace Lead":
- deferredPaymentRisk: Max 6
- urgencyPressure: Max 10
- guiltPressure: Max 10
- sunkCostPressure: Max 8
- futureOpportunityBait: Max 10
- scopeCreepRisk: Max 12
- dependencyPressure: Max 10
- boundaryErosion: Max 10
- manipulationIntensity: Max 10
- transparencySignals: Max 10

If context = "Ambiguous / Unvetted Profile":
- Treat maxes as all Max 10.

Definitions of scores:
- deferredPaymentRisk (0 to Context Max): Payment postponed until work completed, without clear terms.
- urgencyPressure (0 to Context Max): High-urgency language like "today", "immediately", "urgent", "right now".
- guiltPressure (0 to Context Max): Emotional framing like "don't let the team down", "I was counting on you".
- sunkCostPressure (0 to Context Max): Past effort as leverage: "we've come this far", "effort you've put in".
- futureOpportunityBait (0 to Context Max): Promise of future work: "more work in the future", "affect future opportunities".
- scopeCreepRisk (0 to Context Max): Adding tasks without clarifying payment terms.
- dependencyPressure (0 to Context Max): Making user seem critical: "I need someone dependable", "trusting you".
- boundaryErosion (0 to Context Max): Pushing for flexibility: "finish first, payment later".
- manipulationIntensity (0 to Context Max): Overall stacking of manipulation tactics.
- transparencySignals (0 to Context Max): Signs of clear intent (higher = cleaner/lower risk).

PART 5: SCORING RULES
1) Score each micro-feature as an integer.
2) Add small deltas for: repeated urgency, multiple pressure tactics, stacked tactics, scope without payment.
3) Total risk score = (Sum of first 9 features - transparencySignals). Include small deltas.
4) Normalize this total value to a 0-100 range. (100 is extremely risky; 0 is perfectly safe).
5) Do NOT output intermediate mathematical formulas. Save the normalized calculation result in 'heuristicRiskRating'.

PART 6: ANOMALY LABELS MUST MATCH THE MESSAGE EXACTLY (CRITICAL OVERRIDE)
Do NOT use generic or old canned explanations. Always map detected issues to direct message snippets.
Forbidden OLD pattern labels (NEVER use these unless the text explicitly states transfer apps, deposits, escrow, off-platform payment):
- "Direct Monetary Urgency Flag"
- "personal payment transfer conduits or deposits"
- "Atypical/Unsecured financial arrangement proposal"
- "Artificially Accelerated Timeline Pressure" (ONLY use if message says "today", "immediately", "urgent", "right now")

New mapping patterns (ALWAYS use these if the message mentions or implies these concepts):
- "Deferred Compensation Pressure" -> when the message text has cues like "pending payment", "before we finalize", "sort out payments", or requests work before money.
- "Sunk-Cost Leverage" -> when the message text has cues like "we've come this far", "effort you've put in", "invested a lot", "this far", "long way".
- "Future-Opportunity Framing" -> when the message text has cues like "more work in the future", "affect future opportunities", "future jobs".
- "Scope Creep Without Payment Terms" -> when the message text has cues like "additional items", "more tasks", "I've added changes", "quick favor".
- "Dependency / Trust Pressure" -> when the message text has cues like "I'm counting on you", "I need someone dependable", "I'm trusting you", "need someone I can trust".
- "Ambiguous Commitment" -> when the message text has cues like "pieces of the puzzle", "next chapter", "final stretch", "finish it up" without clear milestones/hours/payment terms.

Each anomaly entry must contain:
1. Category: One of the string keys above (matching the text exactly) or a highly specific message-grounded name.
2. Severity: "LOW", "MEDIUM", "HIGH", or "CRITICAL".
3. Rationale: A 1-line explanation of why this specific phrase is manipulative or risky.
4. Evidence snippet: The FULL exact quote/wording from the message itself containing the cue.

PART 7: REPLY GENERATIVE FORGE (FIXED - NO EMPTY REPLIES)
Generate 3 distinct assertive responses:
1) "Professional": 1 sentence acknowledgment, 1 sentence setting boundary, 1 sentence offering next step. Calm, diplomatic, formal. Must be non-empty (10-20 words minimum).
2) "Bold": 1 sentence acknowledgment, 1 sentence setting boundary, 1 sentence offering next step. Direct, assertive, protecting interests. Must be non-empty (10-20 words minimum).
3) "Supportive": 1 sentence acknowledgment, 1 sentence setting boundary, 1 sentence offering next step. Warm yet firm, maintaining positive alignment. Must be non-empty (10-20 words minimum).

CRITICAL RULES FOR REPLIES:
- EVERY reply MUST be non-empty (minimum 10-20 words, never empty strings like "").
- Every reply must follow the 3-sentence structure perfectly.
- All replies must be COMPLETELY DIFFERENT from each other in phrasing and tone.
- If struggling to generate, reuse standard assertive frameworks matching the sender's industry.

You must return a raw JSON object complying with the following schema. Wrap your entire output in a JSON object. Ensure the 'replies' field is populated with professional, bold, and supportive fields, each containing non-empty 3-sentence replies.`;

    const userPrompt = `Analyze the following message. Reply Generative Forge is designated as ${enableReplyForge ? "Active" : "Inactive"}.
    
Message to analyze:
"""
${message}
"""`;

    const modelsToTry = Array.from(new Set([
      modelName,
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3-flash-preview",
      "gemini-3.1-pro-preview"
    ])).filter(Boolean).filter(m => m.includes("-3"));

    let response: any = null;
    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      try {
        logEvent("INFO", `Attempting analyze message with model: ${currentModel}`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.1,
            responseSchema: {
              type: Type.OBJECT,
              required: [
                "heuristicRiskRating",
                "transparencyProbability",
                "calculationConfidence",
                "contextDetected",
                "strategicScanTarget",
                "executiveSummary",
                "microFeatures",
                "microFeatureMaxes",
                "significantTonalAnomalies",
                "stylisticSubtextIndicators",
                "suggestedBoundariesPlan",
                "diligenceSafeguardsRecommended",
                "uncertaintiesAndNuances",
                "replyForgeStatus",
                "replies"
              ],
              properties: {
                heuristicRiskRating: {
                  type: Type.INTEGER,
                  description: "The calculated risk score normalized from 0 to 100."
                },
                transparencyProbability: {
                  type: Type.INTEGER,
                  description: "Estimated probability of genuine, transparent intent, from 0 to 100."
                },
                calculationConfidence: {
                  type: Type.STRING,
                  description: "Confidence scoring strength level: LOW, MEDIUM, or HIGH"
                },
                contextDetected: {
                  type: Type.STRING,
                  description: "Identified sender scenario, e.g. HR / Recruiter / Hiring Team, Freelance Client / Project Owner, Buyer / Seller / Marketplace Lead, etc."
                },
                strategicScanTarget: {
                  type: Type.STRING,
                  description: "Targeted receiver persona exactly, e.g., Worker / Freelancer / Vendor, Job Candidate, Tenant / Renter, Seller, Buyer, etc."
                },
                executiveSummary: {
                  type: Type.STRING,
                  description: "2-3 sentences explaining risk, safer/riskier elements, and who is targeted."
                },
                microFeatures: {
                  type: Type.OBJECT,
                  properties: {
                    deferredPaymentRisk: { type: Type.INTEGER },
                    urgencyPressure: { type: Type.INTEGER },
                    guiltPressure: { type: Type.INTEGER },
                    sunkCostPressure: { type: Type.INTEGER },
                    futureOpportunityBait: { type: Type.INTEGER },
                    scopeCreepRisk: { type: Type.INTEGER },
                    dependencyPressure: { type: Type.INTEGER },
                    boundaryErosion: { type: Type.INTEGER },
                    manipulationIntensity: { type: Type.INTEGER },
                    transparencySignals: { type: Type.INTEGER }
                  },
                  required: [
                    "deferredPaymentRisk",
                    "urgencyPressure",
                    "guiltPressure",
                    "sunkCostPressure",
                    "futureOpportunityBait",
                    "scopeCreepRisk",
                    "dependencyPressure",
                    "boundaryErosion",
                    "manipulationIntensity",
                    "transparencySignals"
                  ]
                },
                microFeatureMaxes: {
                  type: Type.OBJECT,
                  properties: {
                    deferredPaymentRisk: { type: Type.INTEGER },
                    urgencyPressure: { type: Type.INTEGER },
                    guiltPressure: { type: Type.INTEGER },
                    sunkCostPressure: { type: Type.INTEGER },
                    futureOpportunityBait: { type: Type.INTEGER },
                    scopeCreepRisk: { type: Type.INTEGER },
                    dependencyPressure: { type: Type.INTEGER },
                    boundaryErosion: { type: Type.INTEGER },
                    manipulationIntensity: { type: Type.INTEGER },
                    transparencySignals: { type: Type.INTEGER }
                  },
                  required: [
                    "deferredPaymentRisk",
                    "urgencyPressure",
                    "guiltPressure",
                    "sunkCostPressure",
                    "futureOpportunityBait",
                    "scopeCreepRisk",
                    "dependencyPressure",
                    "boundaryErosion",
                    "manipulationIntensity",
                    "transparencySignals"
                  ]
                },
                significantTonalAnomalies: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["category", "severity", "rationale", "evidenceSnippet"],
                    properties: {
                      category: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      rationale: { type: Type.STRING },
                      evidenceSnippet: { type: Type.STRING }
                    }
                  }
                },
                stylisticSubtextIndicators: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["hint", "whyItMatters"],
                    properties: {
                      hint: { type: Type.STRING },
                      whyItMatters: { type: Type.STRING }
                    }
                  }
                },
                suggestedBoundariesPlan: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                diligenceSafeguardsRecommended: {
                  type: Type.STRING
                },
                uncertaintiesAndNuances: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                replyForgeStatus: {
                  type: Type.STRING,
                  description: "Active if Reply Forge was turned on, otherwise Inactive"
                },
                replies: {
                  type: Type.OBJECT,
                  required: ["professional", "bold", "supportive"],
                  properties: {
                    professional: { type: Type.STRING },
                    bold: { type: Type.STRING },
                    supportive: { type: Type.STRING }
                  }
                }
              }
            }
          }
        });
        if (response && response.text) {
          logEvent("INFO", `Analyze message succeeded with model: ${currentModel}`);
          break;
        }
      } catch (err: any) {
        logEvent("WARN", `Model ${currentModel} failed in analyzeMessage: ${err.message || err}`);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("All Gemini models failed to generate content.");
    }


    const result = JSON.parse(response.text.trim());
    return res.json(result);

  } catch (error: any) {
    console.error("Vetting pipeline failed:", error);

    // Rollback / Refund limits decrement on failure
    if (isSupabaseConfiguredBackend() && !isGuest && req.user.id !== "00000000-0000-0000-0000-000000000000") {
      try {
        if (isUsageIncremented) {
          const { data: usage } = await supabaseAdmin
            .from("usage")
            .select("analyses_today")
            .eq("user_id", req.user.id)
            .single();
          if (usage && usage.analyses_today > 0) {
            await supabaseAdmin
              .from("usage")
              .update({ analyses_today: usage.analyses_today - 1 })
              .eq("user_id", req.user.id);
          }
        } else if (isCreditDecremented && packIdToRefund) {
          const { data: pack } = await supabaseAdmin
            .from("credit_packs")
            .select("remaining_credits")
            .eq("id", packIdToRefund)
            .single();
          if (pack) {
            await supabaseAdmin
              .from("credit_packs")
              .update({ remaining_credits: pack.remaining_credits + 1 })
              .eq("id", packIdToRefund);

            await supabaseAdmin.from("credit_transactions").insert({
              user_id: req.user.id,
              amount: 1,
              type: "REFUND",
              metadata: { description: "Refund for failed scan", packId: packIdToRefund }
            });
          }
        }
      } catch (refundErr: any) {
        logEvent("ERROR", "Usage refund failed after analysis exception", { userId: req.user.id, error: refundErr.message });
      }
    }

    if (isGuest && isGuestIncremented) {
      const record = guestUsage.get(clientIp);
      if (record && record.count > 0) {
        record.count--;
      }
    }

    res.status(500).json({
      error: "Vetting pipeline failed",
      details: error.message || String(error)
    });
  }
}

export async function translateText(req: AuthenticatedRequest, res: Response) {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "Text is required and must be a string." });
    }
    if (!targetLanguage || typeof targetLanguage !== "string" || targetLanguage.trim() === "") {
      return res.status(400).json({ error: "Target language is required and must be a string." });
    }

    const ai = getAiClient();
    const systemInstruction = `You are a professional translator and tone-rephraser.
Translate or rephrase the given text into: "${targetLanguage}".
Keep the tone, format, and meaning (including any bullet points or newlines) identical.
Return ONLY the translated/rephrased text. Do not include any introductory sentences, quotes, explanations, or markdown wrappers.`;

    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const modelsToTry = Array.from(new Set([
      modelName,
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3-flash-preview",
      "gemini-3.1-pro-preview"
    ])).filter(Boolean).filter(m => m.includes("-3"));

    let response: any = null;
    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      try {
        logEvent("INFO", `Attempting translation with model: ${currentModel}`);
        response = await ai.models.generateContent({
          model: currentModel,
          contents: text,
          config: {
            systemInstruction,
            temperature: 0.2
          }
        });
        if (response && response.text) {
          logEvent("INFO", `Translation succeeded with model: ${currentModel}`);
          break;
        }
      } catch (err: any) {
        logEvent("WARN", `Model ${currentModel} failed in translateText: ${err.message || err}`);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("All Gemini models failed translation.");
    }


    return res.json({ translatedText: response.text.trim() });
  } catch (error: any) {
    console.error("Translation pipeline failed:", error);
    return res.status(500).json({
      error: "Translation failed",
      details: error.message || String(error)
    });
  }
}

