import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { AnalysisResult, MicroFeatures } from "../../types/analysis";
import { useAuth } from "../../context/AuthContext";

interface RiskCardProps {
  theme: "light" | "dark";
  result: AnalysisResult;
}

function AnimatedScore({ score, className }: { score: number; className: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 750;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress);
      setCurrent(Math.floor(easedProgress * score));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrent(score);
      }
    };

    window.requestAnimationFrame(step);
  }, [score]);

  return <span className={className}>{current}</span>;
}

export function RiskCard({ theme, result }: RiskCardProps) {
  const { entitlements } = useAuth();
  const packCredits = entitlements?.usage.packCreditsRemaining ?? 0;

  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl transition-all duration-200"
    : "bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md";

  const formatFeatureLabel = (key: string) => {
    const customLabels: Record<string, string> = {
      deferredPaymentRisk: "Payment risk",
      urgencyPressure: "Urgency",
      guiltPressure: "Guilt",
      sunkCostPressure: "Sunk cost",
      futureOpportunityBait: "Vague promises",
      scopeCreepRisk: "Scope changes",
      dependencyPressure: "Relationship pressure",
      boundaryErosion: "Boundary requests",
      manipulationIntensity: "Pressure patterns",
      transparencySignals: "Low transparency",
    };
    if (customLabels[key]) return customLabels[key];
    return key
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Risk Level Card */}
      <div className={`p-6 sm:p-7 rounded-2xl ${bgCardClass} relative overflow-hidden text-left`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-2 border-b lg:border-b-0 lg:border-r border-slate-200/60 dark:border-slate-800/80 pb-6 lg:pb-0 lg:pr-8">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">
              Risk level
            </span>
            <div className="flex items-baseline gap-0.5">
              <AnimatedScore 
                score={result.heuristicRiskRating} 
                className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${
                  result.heuristicRiskRating > 70 
                    ? "text-rose-500" 
                    : result.heuristicRiskRating > 45 
                    ? "text-amber-500" 
                    : "text-emerald-500"
                }`}
              />
              <span className="text-slate-500 font-sans text-base">/100</span>
            </div>
            
            <div className="pt-1">
              <span className={`text-[11px] font-sans font-semibold px-3 py-0.5 rounded-full border inline-block ${
                result.heuristicRiskRating > 70 
                  ? "text-rose-500 bg-rose-500/5 border-rose-500/10" 
                  : result.heuristicRiskRating > 45 
                  ? "text-amber-500 bg-amber-500/5 border-amber-500/10" 
                  : "text-emerald-500 bg-emerald-500/5 border-emerald-500/10"
              }`}>
                {result.heuristicRiskRating > 70 ? "High risk" : result.heuristicRiskRating > 45 ? "Moderate risk" : "Low risk"}
              </span>
            </div>

            {packCredits > 0 && (
              <div className="mt-2 text-[11px] font-sans font-medium text-orange-500 bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20 inline-flex items-center gap-1.5 self-center lg:self-start">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                {packCredits} prepaid credits remaining
              </div>
            )}
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 pl-0 lg:pl-3">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block pb-0.5 font-sans">
                Confidence
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  result.calculationConfidence === "HIGH" ? "bg-emerald-500" : result.calculationConfidence === "MEDIUM" ? "bg-amber-500" : "bg-slate-400"
                }`} />
                {result.calculationConfidence}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block leading-none">
                Reliability level
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block pb-0.5 font-sans">
                Clarity
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {result.transparencyProbability}%
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block leading-none">
                Clarity signals
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block pb-0.5 font-sans">
                Context
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate font-sans" title={result.contextDetected}>
                {result.contextDetected || "General"}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block leading-none">
                Target scenario
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block pb-0.5 font-sans">
                Affected side
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate font-sans" title={result.strategicScanTarget}>
                {result.strategicScanTarget || "Recipient"}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block leading-none">
                Who is pressured
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Factors Breakdown Chart */}
      <div className={`p-6 sm:p-7 rounded-2xl ${bgCardClass} space-y-6 text-left`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-sans">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Conversation factors
              </span>
            </div>
            <p className="text-[11px] text-slate-505 dark:text-slate-400 font-sans">
              A simple view of the strongest factors behind this result.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/20 p-6 sm:p-7 rounded-xl border border-slate-200 dark:border-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
            {(Object.keys(result.microFeatures) as Array<keyof MicroFeatures>).map((key) => {
              const val = result.microFeatures[key];
              const maxVal = result.microFeatureMaxes[key] || 10;
              const percentage = Math.min((val / maxVal) * 100, 100);
              const label = formatFeatureLabel(key);

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-sans">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{label}</span>
                    <span className="text-slate-500 font-semibold shrink-0 font-mono">
                      {val} <span className="opacity-50 text-[9px]">/ {maxVal}</span>
                    </span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: percentage > 70 ? "#ef4444" : percentage > 45 ? "#f59e0b" : "#f97316" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
