import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Copy, Check, FileText } from "lucide-react";
import { AnalysisResult } from "../types/analysis";
import { useAuth } from "../context/AuthContext";
import { PlanType, PLAN_ENTITLEMENTS } from "../plans/subscription";
import { exportAnalysisToPDF } from "../utils/pdfExporter";
import { RiskCard } from "./dashboard/RiskCard";
import { ReplyForgeCard } from "./dashboard/ReplyForgeCard";
import { SummaryCard } from "./dashboard/SummaryCard";

interface ResultsDashboardProps {
  theme: "light" | "dark";
  result: AnalysisResult;
  onScanAnother: () => void;
  onCopyAllResults: () => void;
  isAllCopied: boolean;
}

export function ResultsDashboard({
  theme,
  result,
  onScanAnother,
  onCopyAllResults,
  isAllCopied
}: ResultsDashboardProps) {
  const { user } = useAuth();
  const activePlan = user ? user.plan : PlanType.SNIFF;
  const entitlements = PLAN_ENTITLEMENTS[activePlan];

  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl transition-all duration-200"
    : "bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md";

  const handleExportPDF = () => {
    exportAnalysisToPDF(result, entitlements.features["export.summary"]);
  };

  return (
    <div className="space-y-10 my-4 text-left" id="results_dashboard_root">
      
      {/* ACTION HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-4" id="results_header_actions">
        <button
          onClick={onScanAnother}
          className={`px-4 py-2 bg-transparent hover:bg-slate-500/5 text-xs font-semibold rounded-lg border transition-all duration-155 transform active:scale-98 flex items-center gap-1.5 cursor-pointer font-sans ${
            theme === "dark" ? "border-slate-800 text-slate-400 hover:text-slate-200" : "border-slate-200 text-slate-600 hover:text-slate-950"
          }`}
          id="results_btn_back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to analyzer</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-sans text-slate-400 dark:text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Private analysis</span>
        </div>
      </div>

      {/* 1. RISK LEVEL AND METRICS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <RiskCard theme={theme} result={result} />
      </motion.div>

      {/* 2. MAIN SYMMETRICAL COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="results_primary_decision_area">
        
        {/* LEFT COLUMN: Explanation & Signals */}
        <div className="lg:col-span-7 space-y-6">
          <SummaryCard theme={theme} result={result} />
        </div>

        {/* RIGHT COLUMN: Suggested reply & Boundary Tips */}
        <div className="lg:col-span-5 space-y-6">
          <ReplyForgeCard
            theme={theme}
            result={result}
            advancedRepliesAllowed={entitlements.features["reply.smart"] || entitlements.features["reply.premium"]}
          />
        </div>

      </div>

      {/* 3. SUMMARY ACTION BAR */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
        className={`p-6 sm:p-7 rounded-2xl text-center space-y-4 ${bgCardClass}`}
        id="card_reply_options"
      >
        <div className="space-y-1 font-sans">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Actions
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Copy the result or run another analysis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onCopyAllResults}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-xs cursor-pointer transition-all border shrink-0 flex items-center justify-center gap-1.5 bg-transparent duration-150 transform active:scale-98 ${
              isAllCopied 
                ? "border-emerald-500/20 text-emerald-500" 
                : theme === "dark" 
                ? "border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850" 
                : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {isAllCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isAllCopied ? "Copied" : "Copy full result"}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-xs cursor-pointer transition-all border shrink-0 flex items-center justify-center gap-1.5 bg-transparent duration-150 transform active:scale-98 ${
              theme === "dark" 
                ? "border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850" 
                : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {entitlements.features["export.summary"] ? (
              <FileText className="w-3.5 h-3.5 text-orange-500" />
            ) : (
              <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-400">🔒</span>
            )}
            <span>Export PDF {!entitlements.features["export.summary"] && "(Premium)"}</span>
          </button>

          <button
            onClick={onScanAnother}
            className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-sans font-semibold text-xs rounded-lg cursor-pointer transition-all duration-150 transform active:scale-98 hover:scale-[1.01] shadow-sm flex items-center justify-center gap-1.5 border-none"
          >
            <span>Analyze another message</span>
          </button>
        </div>
      </motion.div>

    </div>
  );
}
