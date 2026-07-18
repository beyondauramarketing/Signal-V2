import React, { useState } from "react";
import { Sliders, Bell, Trash2 } from "lucide-react";

interface PreferencesSectionProps {
  theme: "light" | "dark" | "system";
  toggleTheme: () => void;
  textSize: "sm" | "md" | "lg";
  setTextSize: (size: "sm" | "md" | "lg") => void;
  onClearHistory: () => void;
}

export function PreferencesSection({
  theme,
  toggleTheme,
  textSize,
  setTextSize,
  onClearHistory
}: PreferencesSectionProps) {
  const [allowSoundAlerts, setAllowSoundAlerts] = useState(true);
  const [allowCriticalAdvisories, setAllowCriticalAdvisories] = useState(true);
  const [allowWeeklyDigest, setAllowWeeklyDigest] = useState(false);

  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl"
    : "bg-white border border-slate-200 shadow-md";

  return (
    <div className="space-y-6">
      {/* Theme & Typography Card */}
      <div className={`p-6 rounded-2xl space-y-5 ${bgCardClass}`}>
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <Sliders className="w-4.5 h-4.5 text-orange-500" />
          <h3 className="text-xs font-sans font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
            Personal Preferences
          </h3>
        </div>

        {/* Theme Selector */}
        <div className="flex justify-between items-center py-1">
          <div>
            <h4 className="text-xs font-bold leading-none text-slate-800 dark:text-slate-200">Color appearance</h4>
            <p className="text-[10.5px] text-slate-400 mt-1 font-sans">Choose between light and dark appearance.</p>
          </div>
          
          <button
            onClick={toggleTheme}
            className={`px-3.5 py-2 text-[10px] font-mono font-black rounded-lg border transition-all cursor-pointer uppercase ${
              theme === "dark"
                ? "bg-slate-950 border-slate-850 text-orange-405"
                : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            System: {theme}
          </button>
        </div>

        {/* Text size selection */}
        <div className="flex justify-between items-center py-2.5 border-t border-slate-100 dark:border-slate-900/60">
          <div>
            <h4 className="text-xs font-bold leading-none text-slate-800 dark:text-slate-200">Text size scale</h4>
            <p className="text-[10.5px] text-slate-400 mt-1 font-sans">Adjust text size for comfortable readability.</p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-905 font-mono text-[9px] font-bold h-fit shrink-0 select-none">
            {(["sm", "md", "lg"] as const).map((size) => {
              const isActive = textSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setTextSize(size)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer border-none uppercase ${
                    isActive
                      ? "bg-orange-500 text-slate-950 font-extrabold shadow-md"
                      : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notification Channels Card */}
      <div className={`p-6 rounded-2xl space-y-4 ${bgCardClass}`} id="notification_channel_settings">
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <Bell className="w-4.5 h-4.5 text-orange-500" />
          <h3 className="text-xs font-sans font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
            Advisories & Alerts
          </h3>
        </div>

        <div className="space-y-4.5 py-1">
          <div className="flex justify-between items-start gap-4">
            <div className="text-left">
              <label htmlFor="soundAlertsCheckbox" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                Sound advisories
              </label>
              <p className="text-[10.5px] text-slate-400 mt-0.5 font-sans">Play soft sound triggers on high manipulation risks.</p>
            </div>
            <input
              id="soundAlertsCheckbox"
              type="checkbox"
              checked={allowSoundAlerts}
              onChange={(e) => setAllowSoundAlerts(e.target.checked)}
              className="accent-orange-500 cursor-pointer h-4 w-4 rounded mt-1 border-slate-300 dark:border-slate-800"
            />
          </div>

          <div className="flex justify-between items-start gap-4 pt-4.5 border-t border-slate-100 dark:border-slate-900/60">
            <div className="text-left">
              <label htmlFor="criticalAdvisoriesCheckbox" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                High-priority banners
              </label>
              <p className="text-[10.5px] text-slate-400 mt-0.5 font-sans">Show distinct top alerts during extreme client pressure events.</p>
            </div>
            <input
              id="criticalAdvisoriesCheckbox"
              type="checkbox"
              checked={allowCriticalAdvisories}
              onChange={(e) => setAllowCriticalAdvisories(e.target.checked)}
              className="accent-orange-500 cursor-pointer h-4 w-4 rounded mt-1 border-slate-300 dark:border-slate-800"
            />
          </div>

          <div className="flex justify-between items-start gap-4 pt-4.5 border-t border-slate-100 dark:border-slate-900/60">
            <div className="text-left">
              <label htmlFor="weeklyDigestCheckbox" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                Weekly boundary digest
              </label>
              <p className="text-[10.5px] text-slate-400 mt-0.5 font-sans">Email summary containing cumulative metrics of scanned messages.</p>
            </div>
            <input
              id="weeklyDigestCheckbox"
              type="checkbox"
              checked={allowWeeklyDigest}
              onChange={(e) => setAllowWeeklyDigest(e.target.checked)}
              className="accent-orange-500 cursor-pointer h-4 w-4 rounded mt-1 border-slate-300 dark:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Clear trace options */}
      <div className={`p-6 rounded-2xl space-y-4 ${bgCardClass}`} id="danger_zone_card">
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <Trash2 className="w-4.5 h-4.5 text-rose-500" />
          <h3 className="text-xs font-sans font-bold tracking-wider uppercase text-rose-500">
            Danger Zone
          </h3>
        </div>
        <div className="space-y-1.5 text-left">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Purge local history database</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
            Remove all past message analysis logs. This process cannot be undone.
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-900/40 flex justify-end">
          <button
            onClick={onClearHistory}
            className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white dark:text-slate-950 font-mono text-[10px] uppercase font-black tracking-wider rounded-xl transition-all cursor-pointer border-none shadow-md"
          >
            Clear History Cache
          </button>
        </div>
      </div>
    </div>
  );
}
