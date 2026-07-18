import React from "react";
import { Info, ShieldAlert, UserCheck, FileText, AlertTriangle, Eye, Bookmark } from "lucide-react";
import { AnalysisResult } from "../../types/analysis";

interface SummaryCardProps {
  theme: "light" | "dark";
  result: AnalysisResult;
}

export function SummaryCard({ theme, result }: SummaryCardProps) {
  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl transition-all duration-200"
    : "bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md";

  const formatSeverity = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case "LOW": return "Low";
      case "MEDIUM": return "Medium";
      case "HIGH": return "High";
      case "CRITICAL": return "Critical";
      default: return "Medium";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Why it feels off */}
      <div className={`p-6 sm:p-7 rounded-2xl ${bgCardClass} space-y-4`} id="card_why_flagged">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-sans">
          <Info className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            Why it feels off
          </h3>
        </div>
        <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 italic font-sans font-medium">
          "{result.executiveSummary || "This message creates pressure by mixing urgency, unclear expectations, or emotional leverage."}"
        </p>
      </div>

      {/* Signals to notice */}
      <div className={`p-6 sm:p-7 rounded-2xl ${bgCardClass} space-y-4`} id="card_red_flags">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-sans">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            Signals to notice
          </h3>
        </div>

        {result.significantTonalAnomalies && result.significantTonalAnomalies.length > 0 ? (
          <div className="space-y-3.5">
            {result.significantTonalAnomalies.map((anomaly, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all duration-150 ${
                  theme === "dark" ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-50 border-slate-200 shadow-3xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-orange-500 font-sans">
                    {anomaly.category}
                  </span>
                  <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded transition-transform ${
                    anomaly.severity === "HIGH" || anomaly.severity === "CRITICAL"
                      ? "bg-rose-500/5 text-rose-500 border border-rose-500/10"
                      : "bg-amber-500/5 text-amber-500 border border-amber-500/10"
                  }`}>
                    {formatSeverity(anomaly.severity)}
                  </span>
                </div>

                <div className="pl-3 border-l-2 border-orange-500/30 font-sans text-xs text-slate-500 dark:text-slate-400 italic">
                  "{anomaly.evidenceSnippet}"
                </div>

                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
                  {anomaly.rationale}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 font-sans text-xs text-slate-400">
            No strong pressure signals were detected.
          </div>
        )}
      </div>

      {/* Boundary tips */}
      <div className={`p-6 sm:p-7 rounded-2xl ${bgCardClass} space-y-4`} id="card_recommended_boundaries">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-sans">
          <UserCheck className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            Boundary tips
          </h3>
        </div>

        {result.suggestedBoundariesPlan && result.suggestedBoundariesPlan.length > 0 ? (
          <div className="space-y-3 font-sans text-xs text-slate-700 dark:text-slate-350 leading-relaxed text-left">
            {result.suggestedBoundariesPlan.map((plan, index) => (
              <div key={index} className="flex gap-2.5 items-start">
                <span className="text-orange-500 font-semibold shrink-0">{index + 1}.</span>
                <p>{plan}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 font-sans text-xs text-slate-400">
            No extra boundary tips for this message.
          </div>
        )}
      </div>

      {/* Quoted evidence */}
      <div className={`p-6 sm:p-7 rounded-2xl ${bgCardClass} space-y-4`} id="card_evidence_from_message">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-sans">
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          <h3 className="text-xs font-semibold text-slate-850 dark:text-slate-100">
            Quoted evidence
          </h3>
        </div>

        <div className={`p-4 rounded-xl border text-xs leading-relaxed italic ${
          theme === "dark" ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="text-slate-700 dark:text-slate-300 font-sans not-italic">
            "{result.messageText || "No message text available."}"
          </div>
        </div>
      </div>

      {/* Parameters summary columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pressure patterns */}
        <div className={`p-5 rounded-2xl ${bgCardClass} space-y-4`} id="card_hidden_pressure_signals">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 font-sans">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Pressure patterns
            </h3>
          </div>

          {result.stylisticSubtextIndicators && result.stylisticSubtextIndicators.length > 0 ? (
            <div className="space-y-3.5">
              {result.stylisticSubtextIndicators.map((sub, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="font-semibold text-xs text-orange-500 font-sans block text-left">
                    {sub.hint}
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400 font-sans text-left">
                    {sub.whyItMatters}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-sans italic text-left">No clear pressure pattern detected.</p>
          )}
        </div>

        {/* What to verify */}
        <div className={`p-5 rounded-2xl ${bgCardClass} space-y-4`} id="card_what_to_check_next">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 font-sans">
            <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              What to verify
            </h3>
          </div>

          <p className="text-[11.5px] leading-relaxed text-slate-650 dark:text-slate-350 font-sans text-left">
            {result.diligenceSafeguardsRecommended || "Review prior written milestones first. Avoid verbal confirmations."}
          </p>
        </div>

        {/* Nuance */}
        <div className={`p-5 rounded-2xl ${bgCardClass} space-y-4`} id="card_things_to_keep_mind">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 font-sans">
            <Bookmark className="w-4 h-4 text-orange-500 shrink-0" />
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Nuance
            </h3>
          </div>

          {result.uncertaintiesAndNuances && result.uncertaintiesAndNuances.length > 0 ? (
            <div className="space-y-2.5 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400 font-sans text-left">
              {result.uncertaintiesAndNuances.map((item, index) => (
                <div key={index} className="flex gap-2 items-start font-sans">
                  <span className="text-orange-550 shrink-0 font-bold">•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-sans italic text-left">No major nuance noted.</p>
          )}
        </div>

      </div>

    </div>
  );
}
