import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Sparkles, 
  ArrowRight,
  Info,
  Lock,
  AlertTriangle,
  Check,
  Zap,
  Eye,
  FileText,
  BadgeAlert
} from "lucide-react";
import { SensingMascot, SignalPulseWave } from "./BrandSystem";

interface SampleItem {
  title: string;
  context: string;
  text: string;
  rawType: string;
}

interface ScanScreenProps {
  theme: "light" | "dark";
  messageText: string;
  setMessageText: (text: string) => void;
  selectedContext: string;
  setSelectedContext: (context: string) => void;
  isAnalyzing: boolean;
  activeDogLog: string;
  error: string | null;
  samples: SampleItem[];
  onTriggerScan: () => void;
  onSelectSample: (text: string) => void;
}

const WHAT_DOGESH_LOOKS_FOR = [
  { 
    title: "Urgency cues", 
    desc: "Artificial timelines demanding instant commitment to limit your double-checking." 
  },
  { 
    title: "Vague commitments", 
    desc: "Vague talk of future opportunities or partnerships offered instead of definite specifications." 
  },
  { 
    title: "Guilt patterns", 
    desc: "Emotional leverage or guilt hooks trying to lower your standard boundaries." 
  },
  { 
    title: "Payment detail risks", 
    desc: "Demanding unpaid preliminary tasks or postponing standard payment intervals." 
  },
  { 
    title: "Low clarity", 
    desc: "Reluctance to agree on definite specifications, timelines, or rates." 
  },
  { 
    title: "Pressure points", 
    desc: "Passive-compulsive hurry, artificial friendliness, or emotional debt triggers." 
  }
];

export function ScanScreen({
  theme,
  messageText,
  setMessageText,
  selectedContext,
  setSelectedContext,
  isAnalyzing,
  activeDogLog,
  error,
  onTriggerScan,
  onSelectSample
}: ScanScreenProps) {
  const [loadingIndex, setLoadingIndex] = useState(0);

  const loadingTexts = [
    "Analyzing dialogue style…",
    "Checking for pressure patterns, urgency levels, and vague terms…",
    "Polishing friendly boundary suggestions…"
  ];

  // Rotate human-friendly loading states calmly
  useEffect(() => {
    if (isAnalyzing) {
      const timer = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 2000);
      return () => clearInterval(timer);
    } else {
      setLoadingIndex(0);
    }
  }, [isAnalyzing]);

  const textTitleClass = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const textMutedClass = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const textDescClass = theme === "dark" ? "text-slate-300" : "text-slate-600";
  
  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl"
    : "bg-white border border-slate-200 shadow-md";

  const CONTEXT_OPTIONS = [
    { label: "General", val: "All Contexts" },
    { label: "Recruiter", val: "HR / Recruiter" },
    { label: "Landlord", val: "Landlord" },
    { label: "Freelance client", val: "Freelance Client" },
    { label: "Marketplace", val: "Buyer / Seller" },
    { label: "Dating", val: "Dating" }
  ];

  const SAMPLE_CHIPS = [
    {
      label: "Recruiter (unpaid trial)",
      text: "We are hiring for this key role immediately and need a dependable self-starter today. If you can help us with this preliminary unpaid diagnostic challenge first, it will influence future opportunities positively."
    },
    {
      label: "Client (scope expansion)",
      text: "Hey, before we finalize these payments, I've added a few more adjustments to the workspace. Please finish these additional items today. We have come this far, and I'm counting on you to help us cross this line."
    },
    {
      label: "Landlord (rushed cash lease)",
      text: "I need you to show flexibility on this leasing rule. Finish the repairs today and we'll sort out payments later since I'm trusting you completely. I need to secure this listing by tonight."
    },
    {
      label: "Marketplace (vague push)",
      text: "I have invested a lot of time waiting for this listing. Before we finalize anything, I need some pieces of the puzzle solved right now as I need someone I can trust. Let's finish up."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-5 text-left" 
      id="scan_workspace"
    >
      
      {/* 1. PAGE TITLE & SUBTITLE */}
      <div className="space-y-1 max-w-3xl" id="scan_header">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-orange-500">
          <Shield className="w-3.5 h-3.5" />
          <span>Dogesh Signal</span>
        </div>
        <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${textTitleClass}`}>
          Analyze message
        </h1>
        <p className={`text-sm leading-relaxed ${textDescClass}`}>
          Paste any message, email, or discussion draft to flag pressure tactics, check risk levels, and receive suggestions for boundary-safe replies.
        </p>
      </div>

      {/* Onboarding hint banner */}
      <div className={`p-4 rounded-xl flex items-start gap-3 border transition-colors ${
        theme === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
      }`}>
        <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <strong>Private by default:</strong> Your message text is analyzed securely on the server and is never stored, tracked, or shared.
        </p>
      </div>

      {/* 2. CORE SCANNING WORKSPACE ELEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main interactive form card - Dominant left column */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className={`p-6 sm:p-8 rounded-2xl relative overflow-hidden ${bgCardClass} transition-all duration-200 hover:border-slate-700/50 hover:shadow-orange-500/[0.015]`} id="scan_form_panel">
            
            {/* Status bar depicting Browser Privacy state */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850/60 mb-6 select-none">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[9.5px] tracking-wider text-slate-400 text-bold uppercase">
                  Private Session
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" /> Ready
              </span>
            </div>

            <div className="space-y-6">
              
              {/* Message Input Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="scan_message_input" 
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Message text
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {messageText.length} characters
                  </span>
                </div>
                
                <div className="relative">
                  <textarea
                    id="scan_message_input"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Paste a message, email, or text to analyze."
                    disabled={isAnalyzing}
                    className={`w-full h-72 p-5 text-sm sm:text-base leading-relaxed rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all font-mono resize-none ${
                    theme === "dark"
                      ? "bg-slate-950/80 border-slate-800/80 text-slate-100 placeholder-slate-600 focus:border-orange-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-200 focus:bg-white shadow-inner"
                    }`}
                  />

                  {/* Empty state bottom overlay - reassuring user with safety claims */}
                  {!messageText.trim() && !isAnalyzing && (
                    <div className="absolute bottom-4 right-4 pointer-events-none text-[9.5px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-200/55 dark:bg-slate-950/60 px-2.5 py-1.5 rounded-lg backdrop-blur-md select-none border border-slate-200 dark:border-slate-900/60 transition-opacity">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Private analysis</span>
                    </div>
                  )}

                  {/* HIGH METRICS CALM LOADING PANEL */}
                  <AnimatePresence>
                    {isAnalyzing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center p-6 ${
                          theme === "dark" ? "bg-slate-950/98" : "bg-white/98"
                        } backdrop-blur-sm z-30`}
                      >
                        {/* Custom Sensing Mascot in active state to build trust */}
                        <SensingMascot status="analyzing" message="" />
                        
                        <div className="space-y-2 w-full max-w-sm mt-5 text-center">
                          <p className="text-sm font-extrabold text-orange-500 font-sans tracking-tight animate-pulse flex items-center justify-center gap-1">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span>{loadingTexts[loadingIndex]}</span>
                          </p>
                          <div className="px-4 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg inline-block border border-slate-200/45 dark:border-slate-800/65">
                            <p className="text-[10px] font-mono text-slate-500 font-bold tracking-wider italic">
                              {activeDogLog || "Analyzing message style..."}
                            </p>
                          </div>
                        </div>
                        
                        <div className="w-32 mt-6">
                          <SignalPulseWave strength={3} className="h-1.5" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

              {/* CONTEXT SELECTOR (OPTIONAL) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Context <span className="text-slate-400 font-normal">(optional)</span>
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2" id="context_chips">
                  {CONTEXT_OPTIONS.map((opt) => {
                    const isActive = selectedContext === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setSelectedContext(opt.val)}
                        disabled={isAnalyzing}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 transform active:scale-98 hover:scale-[1.01] cursor-pointer border ${
                          isActive
                            ? "bg-orange-500 text-slate-950 border-orange-500 font-semibold shadow-xs"
                            : theme === "dark"
                            ? "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 shadow-3xs"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTION CALL TO ACTION BAR */}
              <div className="pt-4 border-t border-slate-105 dark:border-slate-850/60 space-y-3">
                <button
                  onClick={onTriggerScan}
                  disabled={isAnalyzing || !messageText.trim()}
                  className="w-full py-3.5 px-6 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-slate-950 bg-orange-500 hover:bg-orange-600 active:scale-99 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 transform hover:scale-[1.005] cursor-pointer flex items-center justify-center gap-2 border-none shadow-sm"
                  id="scan_trigger_button"
                >
                  <Shield className="w-4 h-4 text-slate-950" />
                  <span>Analyze message</span>
                </button>
                
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400 select-none">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Private analysis • Messages are analyzed securely and never saved on external hosts</span>
                </div>
              </div>

              {/* Error indicator representation */}
              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2.5 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

            </div>

          </div>

          {/* DYNAMIC CASE PRESET SAMPLES */}
          <div className="space-y-3" id="scan_samples_area">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <FileText className="w-4 h-4" />
              <span>Try example</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" id="scan_sample_cards">
              {SAMPLE_CHIPS.map((chip, idx) => (
                <button
                   key={idx}
                   onClick={() => onSelectSample(chip.text)}
                   disabled={isAnalyzing}
                   className={`p-4 rounded-xl border text-left transition-all duration-250 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-orange-500/[0.015] hover:border-orange-500/15 ${
                     theme === "dark"
                       ? "bg-slate-900/30 border-slate-800/70 hover:bg-slate-900/50"
                       : "bg-white border-slate-200 hover:bg-slate-50/50 shadow-3xs"
                   }`}
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                      {chip.label}
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-orange-500 shrink-0 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/20 leading-none select-none transition-all hover:bg-orange-500 hover:text-slate-950">
                      Try
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-2 pr-2">
                    "{chip.text}"
                  </p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Support Sidebar (stacks nicely on mobile layouts) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: what dogesh looks for */}
          <div className={`p-6 rounded-2xl space-y-4 ${bgCardClass} transition-all duration-200 hover:border-slate-705/10 hover:shadow-xs`} id="dogesh_criteria_card">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850/80 pb-3">
              <BadgeAlert className="w-4 h-4 text-orange-500 shrink-0" />
              <h3 className="text-xs font-semibold text-slate-820 dark:text-slate-200">
                What we look for
              </h3>
            </div>

            <div className="space-y-4">
              {WHAT_DOGESH_LOOKS_FOR.map((item, idx) => (
                <div key={idx} className="flex gap-2.5 text-left">
                  <span className="text-[10px] font-mono text-orange-500 font-semibold block shrink-0 mt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                      {item.title}
                    </h4>
                    <p className={`text-[11.5px] leading-relaxed font-sans ${textMutedClass}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Informational Prompt Card */}
          <div className={`p-5 rounded-xl border flex gap-3 text-left transition-all duration-200 ${
            theme === "dark" ? "bg-slate-950/40 border-slate-900 focus:border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                How it works
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                Dogesh Signal cross-checks parameters across multiple pressure points, identifying standard conversation risks calmly.
              </p>
            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
