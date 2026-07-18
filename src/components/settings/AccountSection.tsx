import React from "react";
import { User, AlertCircle, ShieldCheck } from "lucide-react";
import { PlanType, UserProfile, PLAN_ENTITLEMENTS } from "../../plans/subscription";

interface AccountSectionProps {
  theme: "light" | "dark";
  user: UserProfile | null;
  usageCount: number;
  usageLimit: number;
  localHistoryCount: number;
  showImportPrompt: boolean;
  onImportHistory: () => void;
  onSkipImport: () => void;
}

export function AccountSection({
  theme,
  user,
  usageCount,
  usageLimit,
  localHistoryCount,
  showImportPrompt,
  onImportHistory,
  onSkipImport
}: AccountSectionProps) {
  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl"
    : "bg-white border border-slate-200 shadow-md";

  return (
    <div className={`p-6 rounded-2xl space-y-4.5 ${bgCardClass}`} id="account_sync_sub_card">
      <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200 dark:border-slate-800">
        <User className="w-4.5 h-4.5 text-orange-500" />
        <h3 className="text-xs font-sans font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
          Account Profile & Usage
        </h3>
      </div>

      {!user ? (
        <div className="space-y-4 text-left">
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            You are currently exploring Dogesh Signal as a <strong>Guest</strong>. Your message scans are kept locally on this device.
          </p>
          <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-2">
            <span className="text-[10px] font-mono font-bold text-orange-500 block uppercase tracking-wider">Guest Session Benefits</span>
            <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-1">
              <li>Up to {PLAN_ENTITLEMENTS[PlanType.SNIFF].limits["analysis.daily"]} scans per day</li>
              <li>Local history logging</li>
              <li>Draft boundaries & replies</li>
            </ul>
          </div>
          <p className="text-[10px] text-slate-500">
            To sync your history permanently to the cloud, access plans and upgrade to premium, sign in or register an account.
          </p>
          <button
            onClick={() => {
              const el = document.getElementById("navbar_profile_container");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                const btn = el.querySelector("button");
                if (btn) btn.click();
              }
            }}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer border-none text-center shadow-md flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Open Profile / Sign In Menu</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-left">
          {/* Daily Limit Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-400 font-sans">Daily Vetting Quota:</span>
              <span className="font-bold text-slate-650 dark:text-slate-300 font-mono">
                {usageCount} / {usageLimit === Infinity ? "Unlimited" : usageLimit} scans
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usageLimit === Infinity
                    ? "bg-emerald-500"
                    : usageCount >= usageLimit
                    ? "bg-rose-500 animate-pulse"
                    : usageCount > usageLimit * 0.75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${usageLimit === Infinity ? 0 : Math.min((usageCount / usageLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Guest to Account Sync/Import Prompt */}
          {showImportPrompt && localHistoryCount > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2.5">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-355">
                  <strong>Unsynced Data:</strong> You have <strong>{localHistoryCount}</strong> local scans. Import them to your cloud account?
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onSkipImport}
                  className="px-2.5 py-1 text-[9px] font-mono uppercase font-bold text-slate-400 hover:text-slate-300 bg-transparent border-none cursor-pointer"
                >
                  Skip
                </button>
                <button
                  onClick={onImportHistory}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-450 text-slate-950 text-[9.5px] font-mono font-bold uppercase rounded-lg border-none cursor-pointer"
                >
                  Import
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
