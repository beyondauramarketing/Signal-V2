import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Copy, Check, Grid, Palette, Shield } from "lucide-react";

/**
 * 1. BRAND LOGO
 * The official Dogesh Signal shield logo — an orange shield with a
 * stylised D·S monogram and signal arcs representing active sensing.
 */
export function DogeshLogo({ className = "w-8 h-8", animate = true }) {
  return (
    <div
      className={`relative ${className} flex items-center justify-center shrink-0`}
      id="brand_dogesh_logo"
      style={animate ? {
        animation: "logo-pulse 2.4s ease-in-out infinite",
      } : undefined}
    >
      <style>{`
        @keyframes logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px #f9731640); }
          50%       { filter: drop-shadow(0 0 10px #f9731680); }
        }
      `}</style>
      <img
        src="/logo.png"
        alt="Dogesh Signal logo"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

/**
 * 2. SUBTLE CONVERSATION PULSE WAVE
 * Serves as a quiet dialogue divider and transitional feedback.
 */
export function SignalPulseWave({ className = "h-1.5", strength = 3 }) {
  return (
    <div className={`relative w-full ${className} flex items-center justify-center gap-1.5 py-1`} id="brand_pulse_wave">
      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-100 dark:bg-slate-900" />
      <div className="relative flex gap-1.5">
        {Array.from({ length: strength }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-orange-550/80"
            style={{
              animation: "pulse 2.2s infinite ease-in-out",
              animationDelay: `${i * 0.35}s`,
              opacity: 1 - i * 0.25,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 3. MINIMAL GEOMETRIC STATUS COMPANION (SensingMascot refactored)
 * A clean, layout-neutral state companion using natural, human status explanations.
 */
interface MascotProps {
  status: "idle" | "listening" | "analyzing" | "alert" | "empty";
  message?: string;
  onClick?: () => void;
}

export function SensingMascot({ status, message, onClick }: MascotProps) {
  const getStatusText = () => {
    switch (status) {
      case "listening": return "Reading the message";
      case "analyzing": return "Looking for pressure signals";
      case "alert": return "Some pressure signals were found";
      case "empty": return "Start with a message";
      default: return "Ready when you are";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "alert": 
        return "text-amber-600 dark:text-amber-500 border-amber-500/10 bg-amber-500/5";
      case "analyzing": 
        return "text-orange-600 dark:text-orange-500 border-orange-500/10 bg-orange-500/5";
      case "listening": 
        return "text-slate-650 dark:text-slate-350 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40";
      case "empty": 
        return "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/20";
      default: 
        return "text-slate-655 dark:text-slate-350 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/25";
    }
  };

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 text-center select-none cursor-default"
      id="brand_sensing_mascot"
    >
      {/* Sleek geometric container */}
      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
        {/* Light ambient core background */}
        <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${
          status === "alert" ? "bg-amber-500/5" :
          status === "analyzing" ? "bg-orange-500/5 animate-pulse" : "bg-slate-100/50 dark:bg-slate-900/30"
        }`} />
        
        {/* Monoline Outer Circular ring */}
        <div className="absolute inset-0 rounded-full border border-slate-200/60 dark:border-slate-800/80" />
        
        {/* Core dynamic emblem of instinct */}
        <div className="relative z-10">
          <DogeshLogo animate={status === "analyzing" || status === "listening"} className="w-10 h-10" />
        </div>
      </div>

      {/* Human, readable text badge */}
      <div className={`inline-flex px-3 py-1 border rounded-lg text-xs font-semibold tracking-tight mb-2 font-sans ${getStatusColor()}`}>
        {getStatusText()}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
        {message || "Differentiating pressure points, emotional obligation, and boundary gaps in digital conversations."}
      </p>
    </div>
  );
}

/**
 * 4. SYSTEM APP ICON CONCEPT SHOWCASE
 * A clean, minimalist schematic explaining the structural design guidelines of the brand.
 */
export function AppIconConceptShowcase() {
  const [activeTab, setActiveTab] = useState<"spec" | "grid" | "palette">("spec");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colorsList = [
    { name: "Obsidian Base", hex: "#0F172A", tag: "Background canvas" },
    { name: "Signal Orange", hex: "#F97316", tag: "Focal indicators" },
    { name: "Sincere Amber", hex: "#F59E0B", tag: "Boundary accents" },
    { name: "Slate Neutral", hex: "#64748B", tag: "Muted structure" },
  ];

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950 p-6 relative overflow-hidden text-left" id="brand_system_panel">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5 mb-5 shrink-0">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-sans">
            Brand Framework
          </span>
          <h3 className="text-sm font-bold font-sans text-slate-900 dark:text-slate-100 mt-0.5">
            Design Philosophy & Vector Guidelines
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            A secure aesthetic system centered on balance, confidence, and clear communication.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-900 font-sans text-xs select-none h-fit">
          <button
            onClick={() => setActiveTab("spec")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === "spec" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-3xs border border-slate-200/50 dark:border-slate-800" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Aesthetics
          </button>
          <button
            onClick={() => setActiveTab("grid")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === "grid" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-3xs border border-slate-200/50 dark:border-slate-800" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Geometry
          </button>
          <button
            onClick={() => setActiveTab("palette")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === "palette" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-3xs border border-slate-200/50 dark:border-slate-800" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Color swatches
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* LEFT COLUMN: BRAND SYMBOL PREVIEW */}
        <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl min-h-[180px] relative">
          <div className="w-24 h-24 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm relative flex items-center justify-center p-3">
            <DogeshLogo animate={false} className="w-16 h-16" />
          </div>
          <span className="text-[10px] text-slate-400 font-sans mt-3">
            Dogesh Signal Monoline Crest
          </span>
        </div>

        {/* RIGHT COLUMN: REFINED BRAND DETAILS */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeTab === "spec" && (
              <motion.div
                key="spec"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-3 text-xs"
              >
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  The Dogesh Signal crest relies on geometric purity. Symmetric intuition points express alert awareness and natural boundaries, while nested circular lines emphasize calm space and active focus.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-900 text-slate-500 font-sans">
                  Avoid literal canine illustrations, eyes, or gamer neon highlights. The product is elegant and strictly supportive.
                </div>
              </motion.div>
            )}

            {activeTab === "grid" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-3 text-xs font-sans text-slate-600 dark:text-slate-400 leading-relaxed"
              >
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-900">
                  <span>Stroke configuration</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">2.5px Centered vector</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-900">
                  <span>Ear/Wedge balance</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Symmetrical 12° alignment</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Concentric range</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">44px inner margin</span>
                </div>
              </motion.div>
            )}

            {activeTab === "palette" && (
              <motion.div
                key="palette"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {colorsList.map((color) => {
                    const justCopied = copiedColor === color.hex;
                    return (
                      <div
                        key={color.hex}
                        onClick={() => handleCopyColor(color.hex)}
                        className="p-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-900 rounded-lg hover:border-slate-300 dark:hover:border-slate-800 transition-all cursor-pointer flex items-center justify-between group/color"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-slate-200 dark:border-slate-800 shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block leading-tight">{color.name}</span>
                            <span className="text-[10px] text-slate-400 block">{color.hex}</span>
                          </div>
                        </div>

                        <div className="text-slate-300 group-hover/color:text-orange-500 transition-colors">
                          {justCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-900 flex items-start gap-2 text-[10.5px] text-slate-400 font-sans">
        <HelpCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
        <span>
          A premium brand relies on clarity. We combine quiet visual restraint with deep emotional focus to help users feel confident.
        </span>
      </div>
    </div>
  );
}

/**
 * 5. FLOATING SYSTEM PARTICLES BACKGROUND (Muted ambient layout depth)
 */
export function FloatingSystemParticles() {
  const particles = [
    { top: "15%", left: "10%", size: 6, delay: 0, duration: 25 },
    { top: "25%", left: "80%", size: 4, delay: 2, duration: 18 },
    { top: "55%", left: "5%", size: 3, delay: 5, duration: 22 },
    { top: "70%", left: "85%", size: 5, delay: 1, duration: 28 },
    { top: "85%", left: "20%", size: 4, delay: 4, duration: 20 },
    { top: "40%", left: "75%", size: 8, delay: 3, duration: 32 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, idx) => (
        <motion.div
          key={idx}
          className="absolute rounded-full bg-slate-300/10 dark:bg-orange-500/[0.03] backdrop-blur-3xl"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, 0],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * 6. ANIMATED RISK SCORE COUNTER
 */
export function AnimatedRiskScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 1000;
    const stepTime = Math.max(Math.floor(duration / (end || 1)), 10);
    const timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
      {displayValue}
    </span>
  );
}
