import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  Copy,
  Users,
  Building,
  Briefcase,
  ShoppingCart,
  MessageSquare,
  Shield,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { DogeshLogo } from "./BrandSystem";
import { useTranslation } from "react-i18next";

interface LandingScreenProps {
  theme: "light" | "dark";
  onLaunchScan: () => void;
  onLaunchExample: (text: string) => void;
}

const USE_CASES = [
  { labelKey: "landing.useCases.recruiter", icon: <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
  { labelKey: "landing.useCases.landlord", icon: <Building className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
  { labelKey: "landing.useCases.freelance", icon: <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
  { labelKey: "landing.useCases.marketplace", icon: <ShoppingCart className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
  { labelKey: "landing.useCases.personal", icon: <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" /> }
];

export function LandingScreen({ theme, onLaunchScan, onLaunchExample }: LandingScreenProps) {
  const { t } = useTranslation();
  const [activeTone, setActiveTone] = useState<"Professional" | "Direct">("Professional");
  const [copiedReview, setCopiedReview] = useState(false);

  // Class Helpers
  const textTitleClass = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const textMutedClass = theme === "dark" ? "text-slate-400" : "text-slate-500";
  
  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl"
    : "bg-white border border-slate-200 shadow-sm";

  const demoMessage = "Hey, before we finalize these payments, I've added a few more adjustments to the workspace. Please finish these additional items today. We have come this far, and I'm counting on you to help us cross this line.";
  
  const replies = {
    Professional: "Thank you for the updates. Let's authorize outstanding payments first so we can transition to organizing these separate adjustments.",
    Direct: "Before starting on new adjustments, let's complete payments on all pending milestones. This keeps our agreed schedule clear."
  };

  const handleCopyDemoReply = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReview(true);
    setTimeout(() => setCopiedReview(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      className="space-y-16 pt-10 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left" 
      id="dogesh_landing_root"
    >
      
      {/* 2. Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4 items-center" id="hero_section">
        
        {/* Left Side: Copy & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <h1 className={`text-4xl sm:text-5xl lg:text-6.5xl font-extrabold tracking-tight leading-[1.1] ${textTitleClass}`}>
            {t("landing.heroTitle").split("pressure").map((part, index, arr) => (
              <React.Fragment key={index}>
                {part}
                {index < arr.length - 1 ? <span className="text-orange-500">pressure</span> : null}
              </React.Fragment>
            ))}
          </h1>

          <p className={`text-base sm:text-lg leading-relaxed max-w-xl font-sans ${textMutedClass}`}>
            {t("landing.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
            <button
              onClick={onLaunchScan}
              className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.99] text-slate-950 font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 border-none"
              id="hero_btn_scan"
            >
              <span>{t("landing.analyzeButton")}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={() => onLaunchExample(demoMessage)}
              className={`w-full sm:w-auto px-6 py-3.5 border rounded-xl font-semibold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 ${
                theme === "dark" 
                  ? "bg-slate-900/50 border-slate-800 text-slate-200 hover:bg-slate-800" 
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
              }`}
              id="hero_btn_example"
            >
              <span>{t("landing.exampleButton")}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-500 flex items-center gap-1.5 select-none font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t("landing.privacyNote")}</span>
          </p>
        </div>

        {/* Right Side: Hero Preview Card */}
        <div className="lg:col-span-6 w-full" id="hero_visual_mockup">
          <div className={`p-6 rounded-2xl ${bgCardClass} border text-left`}>
            
            {/* Top Bar showing example analysis */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800/60 mb-4 select-none">
              <span className="text-xs font-semibold text-slate-400">
                {t("landing.exampleAnalysis")}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-sans">{t("landing.riskLevel")}: </span>
                <span className="text-xs font-semibold text-rose-500">75% — High risk</span>
              </div>
            </div>

            {/* Why it feels off */}
            <div className="space-y-1.5 mb-4 text-left">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight block">
                {t("landing.whyItFeelsOff")}
              </span>
              <p className={`text-xs leading-relaxed ${textMutedClass}`}>
                The message ties extra work to pending payment and uses urgency to make it harder to say no.
              </p>
            </div>

            {/* Suggested reply preview */}
            <div className="space-y-3 pt-2 text-left">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight block">
                {t("landing.suggestedReply")}
              </span>

              {/* Tone Selection Tabs */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-900 font-sans text-xs max-w-xs">
                {(["Professional", "Direct"] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setActiveTone(tone)}
                    className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer font-medium ${
                      activeTone === tone 
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-sm border border-slate-200 dark:border-slate-800/80" 
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>

              {/* Reply copy box */}
              <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-850 relative ${
                theme === "dark" ? "bg-slate-950/60" : "bg-slate-50"
              }`}>
                <p className={`text-[11.5px] leading-relaxed italic pr-8 font-sans ${
                  theme === "dark" ? "text-slate-200" : "text-slate-800"
                }`}>
                  "{replies[activeTone]}"
                </p>
                <button
                  onClick={() => handleCopyDemoReply(replies[activeTone])}
                  className="absolute right-3 top-3.5 p-1.5 text-slate-400 hover:text-orange-500 transition-colors cursor-pointer flex items-center gap-1 font-sans text-xs"
                  title="Copy reply text"
                >
                  {copiedReview ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-slate-400 hover:text-orange-500 text-[10px]">Copy reply</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Use Cases Section */}
      <div className="pt-8 border-t border-slate-100 dark:border-slate-900 space-y-4" id="use_case_strip">
        <div className="space-y-1">
          <h2 className={`text-xl font-extrabold tracking-tight ${textTitleClass}`}>
            {t("landing.whereItHelps")}
          </h2>
          <p className={`text-xs sm:text-sm font-sans ${textMutedClass}`}>
            {t("landing.whereItHelpsSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 pt-1">
          {USE_CASES.map((uc, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                theme === "dark" 
                  ? "bg-slate-950/25 border-slate-900 text-slate-300" 
                  : "bg-slate-50 border-slate-200 text-slate-700 shadow-3xs"
              }`}
            >
              <div className="p-1 shrink-0 bg-slate-500/5 dark:bg-slate-400/5 rounded-lg border border-slate-200/10 dark:border-slate-800">
                {uc.icon}
              </div>
              <span className="font-sans text-xs font-semibold leading-tight">{t(uc.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 3-Step How It Works Section */}
      <div className="pt-8 space-y-8" id="how_it_works_section">
        <div className="space-y-1">
          <h2 className={`text-xl font-extrabold tracking-tight ${textTitleClass}`}>
            {t("landing.howItWorks")}
          </h2>
          <p className={`text-xs sm:text-sm font-sans ${textMutedClass}`}>
            {t("landing.howItWorksSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: t("landing.steps.oneTitle"),
              desc: t("landing.steps.oneDesc")
            },
            {
              step: "02",
              title: t("landing.steps.twoTitle"),
              desc: t("landing.steps.twoDesc")
            },
            {
              step: "03",
              title: t("landing.steps.threeTitle"),
              desc: t("landing.steps.threeDesc")
            }
          ].map((st, i) => (
            <div 
              key={i} 
              className={`p-6 rounded-2xl border flex flex-col justify-between min-h-[140px] ${
                theme === "dark" ? "bg-slate-900/15 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <span className="text-lg font-bold font-sans text-orange-500">
                {st.step}
              </span>
              <div className="space-y-1 pt-3 text-left">
                <h3 className={`font-bold text-sm tracking-tight ${textTitleClass}`}>
                  {st.title}
                </h3>
                <p className={`text-xs leading-relaxed ${textMutedClass}`}>
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. One Compact Trust/Privacy Section */}
      <div className="pt-8 space-y-6" id="trust_privacy_section">
        <div className="space-y-1">
          <h2 className={`text-xl font-extrabold tracking-tight ${textTitleClass}`}>
            {t("landing.whatYouGet")}
          </h2>
          <p className={`text-xs sm:text-sm font-sans ${textMutedClass}`}>
            {t("landing.whatYouGetSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: t("landing.features.risk"),
              desc: t("landing.features.riskDesc")
            },
            {
              title: t("landing.features.whyOff"),
              desc: t("landing.features.whyOffDesc")
            },
            {
              title: t("landing.features.evidence"),
              desc: t("landing.features.evidenceDesc")
            },
            {
              title: t("landing.features.reply"),
              desc: t("landing.features.replyDesc")
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className={`p-5 rounded-xl border space-y-2 text-left ${
                theme === "dark" ? "bg-slate-900/20 border-slate-850" : "bg-slate-50/50 border-slate-200 shadow-3xs"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <h3 className={`font-bold text-xs tracking-tight ${textTitleClass}`}>
                  {item.title}
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${textMutedClass}`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Final CTA Section */}
      <div className="py-12 border-t border-slate-100 dark:border-slate-900 flex flex-col items-center text-center space-y-6" id="final_cta_section">
        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${textTitleClass}`}>
            {t("landing.finalCtaTitle")}
          </h2>
          <p className={`text-xs sm:text-sm font-sans leading-relaxed ${textMutedClass}`}>
            {t("landing.finalCtaSubtitle")}
          </p>
        </div>

        <button
          onClick={onLaunchScan}
          className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 hover:scale-[1.015] active:scale-[0.985] text-slate-950 font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 border-none shadow-md"
        >
          <span>Analyze a message</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>

      {/* 7. Simple Footer */}
      <footer className="pt-12 border-t border-slate-100 dark:border-slate-900 font-sans text-xs text-slate-400 dark:text-slate-500 w-full space-y-4 text-left">
        <div className="space-y-1">
          <span className={`font-bold text-xs tracking-tight block ${textTitleClass}`}>
            Dogesh Signal
          </span>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            {t("landing.footerDescription")}
          </p>
        </div>
        
        <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500/80">
          {t("landing.footerNote")}
        </p>
      </footer>

    </motion.div>
  );
}
