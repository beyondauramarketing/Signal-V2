import React from "react";
import { motion } from "motion/react";
import { 
  Search, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Clock,
  Shield,
  FileText,
  Filter,
  CheckCircle,
  HelpCircle,
  FolderOpen
} from "lucide-react";
import { AnalysisResult } from "../types/analysis";

interface HistoryScreenProps {
  theme: "light" | "dark";
  history: AnalysisResult[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  historyFilter: string;
  setHistoryFilter: (filter: string) => void;
  onOpenScan: (scan: AnalysisResult) => void;
  onDeleteScan: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  onScanCTA?: () => void;
}

export function HistoryScreen({
  theme,
  history,
  searchQuery,
  setSearchQuery,
  historyFilter,
  setHistoryFilter,
  onOpenScan,
  onDeleteScan,
  onClearAll,
  onScanCTA
}: HistoryScreenProps) {
  const bgCardClass = theme === "dark"
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl"
    : "bg-white border border-slate-200 shadow-md";
  const titleClass = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const mutedClass = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const labelClass = "text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase";

  // Derive unique contexts dynamically to list as filter pills
  const uniqueDetectedContexts = Array.from(
    new Set(history.map((h) => h.contextDetected))
  ).filter(Boolean);

  // Apply filtering rules
  const filteredHistoryItems = history.filter((item) => {
    const textSearch = (item.messageText || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (item.executiveSummary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (item.contextDetected || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (historyFilter === "ALL") return textSearch;
    return textSearch && item.contextDetected === historyFilter;
  });

  const getRiskBadgeColor = (score: number) => {
    if (score > 70) return "text-rose-500 bg-rose-500/10 border border-rose-500/20";
    if (score > 40) return "text-amber-500 bg-amber-500/10 border border-amber-500/20";
    return "text-orange-555 bg-orange-500/10 border border-orange-500/20";
  };

  const totalScans = history.length;
  const averageRisk = totalScans > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.heuristicRiskRating, 0) / totalScans)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 my-2 text-left" 
      id="history_dashboard_view"
    >
      
      {/* Onboarding Hint: Privacy explanation */}
      <div className={`p-4 rounded-xl flex items-start gap-3 border ${
        theme === "dark" ? "bg-orange-950/10 border-orange-500/10" : "bg-orange-50/50 border-orange-200/50"
      }`}>
        <FolderOpen className="w-4.5 h-4.5 text-orange-550 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          <strong>Privacy Hint:</strong> All your analyzed messages are saved locally in your browser's private storage. You can delete your history at any time.
        </p>
      </div>

      {/* 1. Header block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-5">
        <div>
          <h2 className={`text-xl font-extrabold tracking-tight ${titleClass}`}>History</h2>
          <p className={`text-xs ${mutedClass} mt-1 leading-relaxed max-w-2xl`}>
            Reopen previously analyzed messages on this device. Use history to review previous recommendations and suggested replies.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-505/15 text-rose-500 rounded-xl text-xs font-bold tracking-wide border border-rose-500/10 transition-colors cursor-pointer"
            id="clear_history_trigger"
          >
            Clear all logs
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-6 ${bgCardClass}`} id="history_empty_state">
          <div className="relative flex items-center justify-center my-2">
            <span className="absolute inset-0 rounded-full bg-orange-500/5 scale-[2.2] animate-ping opacity-25 pointer-events-none" />
            <span className="absolute inset-2 rounded-full bg-amber-500/5 scale-[1.5] animate-pulse opacity-30 pointer-events-none" />
            <FolderOpen className="w-10 h-10 text-orange-500/80 relative" />
          </div>
          <div className="space-y-2 text-center max-w-sm mx-auto">
            <h3 className={`font-extrabold text-sm ${titleClass}`}>History</h3>
            <p className={`text-xs ${mutedClass} leading-relaxed`}>
              You haven't analyzed any messages yet. All calculations are performed inside your browser, keeping your data confidential by default.
            </p>
          </div>
          {onScanCTA && (
            <button
              onClick={onScanCTA}
              className="px-5 py-3 bg-orange-500 hover:bg-orange-450 text-slate-950 font-black font-mono text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-all border-none shadow-md"
            >
              Analyze a message
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SEARCH & FILTERS ON THE LEFT RAIL */}
          <div className="lg:col-span-4 space-y-5">
            
            <div className={`p-5 rounded-2xl space-y-4 ${bgCardClass}`}>
              <h3 className={labelClass}>Search messages</h3>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query keywords, context..."
                  className={`w-full py-2.5 pl-10 pr-4 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500/35 transition-all ${
                    theme === "dark"
                      ? "bg-slate-950 border-slate-850 text-slate-100 focus:border-orange-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-500 focus:bg-white"
                  }`}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className={`p-5 rounded-2xl space-y-3.5 ${bgCardClass}`}>
              <h3 className={labelClass}>Filter by message type</h3>
              <div className="flex flex-col gap-1.5 font-mono text-[10.5px]">
                <button
                  onClick={() => setHistoryFilter("ALL")}
                  className={`px-3 py-2.5 rounded-xl text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                    historyFilter === "ALL"
                      ? "bg-orange-500 text-slate-950 shadow-xs"
                      : theme === "dark" ? "bg-slate-950/40 text-slate-400 hover:text-slate-100" : "bg-slate-100 text-slate-600 hover:bg-slate-150"
                  }`}
                >
                  <span>ALL DETECTED CONTEXTS</span>
                  <span className="text-[9px] font-mono">({history.length})</span>
                </button>

                {uniqueDetectedContexts.map((context) => {
                  const itemsCount = history.filter((h) => h.contextDetected === context).length;
                  return (
                    <button
                      key={context}
                      onClick={() => setHistoryFilter(context)}
                      className={`px-3 py-2.5 rounded-xl text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                        historyFilter === context
                          ? "bg-orange-500 text-slate-950 shadow-xs"
                          : theme === "dark" ? "bg-slate-950/40 text-slate-400 hover:text-slate-100" : "bg-slate-100 text-slate-600 hover:bg-slate-150"
                      }`}
                    >
                      <span className="truncate pr-4 uppercase">{context}</span>
                      <span className="text-[9px] font-mono">({itemsCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOM SVG CHARTS */}
            <div className={`p-5 rounded-2xl space-y-4 ${bgCardClass}`} id="history_charts_insights">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2.5">
                <h3 className={labelClass}>Risk charts</h3>
                <span className="text-[8.5px] font-mono text-emerald-500 font-extrabold uppercase bg-emerald-500/5 px-1.5 py-0.5 rounded animate-pulse">Active</span>
              </div>

              {/* CHART 1: RISK TREND TIMELINE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-left">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Risk trend over analyses</span>
                  <span className="text-[10px] font-mono font-extrabold text-orange-500">{averageRisk}% avg risk</span>
                </div>
                
                <div className="h-24 w-full bg-slate-950/20 dark:bg-slate-900/40 rounded-xl p-2.5 border border-slate-200/40 dark:border-slate-900/60 relative flex items-center justify-center">
                  {history.length > 0 ? (
                    (() => {
                      const chronologicalHistory = [...history].reverse();
                      const svgWidth = 220;
                      const svgHeight = 65;
                      
                      const points = chronologicalHistory.map((item, idx) => {
                        const x = chronologicalHistory.length > 1 ? (idx / (chronologicalHistory.length - 1)) * svgWidth : svgWidth / 2;
                        const y = svgHeight - 8 - (item.heuristicRiskRating / 100) * (svgHeight - 16);
                        return { x, y, score: item.heuristicRiskRating };
                      });

                      const pathData = points.length > 0 
                        ? `M ${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L ${p.x},${p.y}`).join(" ")
                        : "";

                      const areaPathData = points.length > 0
                        ? `${pathData} L ${points[points.length - 1].x},${svgHeight} L ${points[0].x},${svgHeight} Z`
                        : "";

                      return (
                        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="currentColor" className="text-slate-200/50 dark:text-slate-800/50" strokeDasharray="3,3" />
                          <line x1="0" y1={svgHeight - 4} x2={svgWidth} y2={svgHeight - 4} stroke="currentColor" className="text-slate-200/50 dark:text-slate-800/50" />

                          {/* Area Fill */}
                          {areaPathData && (
                            <path d={areaPathData} fill="url(#chartGradient)" />
                          )}

                          {/* Trend Line Path */}
                          {pathData && (
                            <path d={pathData} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          )}

                          {/* Plot Data Dots */}
                          {points.map((p, index) => (
                            <g key={index}>
                              <circle cx={p.x} cy={p.y} r="3" fill="#f97316" className="animate-pulse" />
                              <circle cx={p.x} cy={p.y} r="6" fill="#f97316" fillOpacity="0.15" className="hover:scale-[1.8] cursor-crosshair transition-transform" />
                            </g>
                          ))}
                        </svg>
                      );
                    })()
                  ) : (
                    <span className="text-[10px] text-slate-400">Analyze messages to see trend</span>
                  )}
                  
                  {/* Subtle axis marks */}
                  <div className="absolute bottom-1 left-2 text-[7.5px] font-mono text-slate-400 select-none">Past Analyses</div>
                  <div className="absolute top-1 right-2 text-[7.5px] font-mono text-slate-400 select-none">Risk limit (100)</div>
                </div>
                <p className="text-[9.5px] text-slate-400 font-mono leading-normal text-left">
                  → Plots overall risk levels. A rising wave indicates eroding dialogue boundaries.
                </p>
              </div>

              {/* CHART 2: SCENARIO CATEGORY PRESSURE DISTRIBUTION */}
              <div className="space-y-2 pt-2.5 border-t border-slate-100 dark:border-slate-900/50">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Pressure Distribution</span>
                
                <div className="space-y-1.5">
                  {(() => {
                    const sortedContexts = Object.entries(
                      history.reduce((acc: Record<string, number>, curr) => {
                        const name = curr.contextDetected || "General";
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {})
                    ).sort((a, b) => b[1] - a[1]);

                    const maxCount = Math.max(...sortedContexts.map(c => c[1]), 1);

                    return sortedContexts.map(([name, count]) => {
                      const sharePct = Math.round((count / history.length) * 100);
                      return (
                        <div key={name} className="space-y-0.5">
                          <div className="flex justify-between items-center text-[9.5px] font-mono">
                            <span className="text-slate-400 text-left truncate max-w-[140px] uppercase font-bold">{name}</span>
                            <span className="text-orange-500 font-extrabold">{sharePct}% ({count})</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                              style={{ width: `${sharePct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <p className="text-[9.5px] text-slate-400 font-mono leading-normal text-left">
                  → Highlights who asserts pressure most frequently. Use to protect high-impact connections.
                </p>
              </div>
            </div>

          </div>

          {/* SCANS ITERATIVE FEED COLUMN */}
          <div className="lg:col-span-8 space-y-4">
            
            {filteredHistoryItems.length === 0 ? (
              <div className={`p-10 text-center rounded-2xl flex flex-col items-center justify-center space-y-4 ${bgCardClass}`} id="history_search_empty_state">
                <div className="relative flex items-center justify-center my-1 select-none">
                  <span className="absolute inset-0 rounded-full bg-slate-400/5 scale-150 animate-ping pointer-events-none" />
                  <FolderOpen className="w-8 h-8 text-slate-400" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className={`font-extrabold text-sm ${titleClass}`}>Filtered Logs</h4>
                  <p className={`text-xs ${mutedClass} leading-relaxed`}>
                    No logs match your current search terms or filter constraints. Your original history items are still safely stored in memory.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setHistoryFilter("ALL");
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-450 text-slate-950 font-black font-mono text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-all border-none shadow-xs"
                >
                  Reset filters and show all
                </button>
              </div>
            ) : (
              filteredHistoryItems.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => onOpenScan(scan)}
                  className={`p-5 rounded-2xl border text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:scale-[1.005] hover:border-orange-500/20 active:scale-[0.995] transition-all cursor-pointer group ${bgCardClass}`}
                >
                  <div className="space-y-1.5 flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10">
                        {scan.contextDetected}
                      </span>
                      {scan.timestamp && (
                        <div className="flex items-center gap-1 text-[9.5px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{scan.timestamp}</span>
                        </div>
                      )}
                    </div>

                    <p className={`text-xs font-semibold leading-relaxed truncate font-sans ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                      {scan.messageText}
                    </p>

                    <p className="text-[11px] text-slate-400 leading-normal line-clamp-1 pr-4">
                      {scan.executiveSummary}
                    </p>
                  </div>

                  {/* Right hand score flag & controls */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-0.5">
                        <span className={`text-base font-black font-sans leading-none ${
                          scan.heuristicRiskRating > 70 
                            ? "text-rose-500" 
                            : scan.heuristicRiskRating > 45 
                            ? "text-amber-500" 
                            : "text-orange-500"
                        }`}>
                          {scan.heuristicRiskRating}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">/100</span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 block uppercase tracking-wide">risk score</span>
                    </div>

                    <button
                      onClick={(e) => onDeleteScan(scan.id || "", e)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                      title="Purge record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" />

                  </div>

                </div>
              ))
            )}

          </div>

        </div>
      )}

    </motion.div>
  );
}
