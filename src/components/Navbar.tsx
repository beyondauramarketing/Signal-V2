import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { DogeshLogo } from "./BrandSystem";
import { 
  Sun, 
  Moon, 
  Menu, 
  X,
  Bell,
  Clock,
  Settings,
  Shield,
  Layers,
  User,
  LogOut,
  AlertCircle,
  CreditCard
} from "lucide-react";
import { SystemNotification } from "../types";
import { UserProfile, PlanType } from "../plans/subscription";
import { useTranslation } from "react-i18next";

interface NavbarProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  notifications: SystemNotification[];
  markAllRead: () => void;
  dismissNotif: (id: string) => void;
  clearAllNotifs: () => void;
  onScanCTA: () => void;
  isAlreadyOnScanScreen: boolean;
  
  // Authentication properties
  user: UserProfile | null;
  onLogin: (email: string, password?: string) => Promise<boolean>;
  onRegister: (name: string, email: string, password?: string) => Promise<boolean>;
  onLogout: () => void;
  onUpgradePlan: (plan: PlanType) => void;
  usageCount: number;
  usageLimit: number;
}

export function Navbar({
  theme,
  toggleTheme,
  activeTab,
  setActiveTab,
  notifications,
  onScanCTA,
  isAlreadyOnScanScreen,
  user,
  onLogin,
  onRegister,
  onLogout,
  onUpgradePlan,
  usageCount,
  usageLimit
}: NavbarProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regTerms, setRegTerms] = useState(false);

  // Status/loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Grouped logically: Marketing/Discover links vs Core Utility App Tasks
  const marketingTabs = [
    { id: "landing", label: t("nav.product") },
    { id: "how-it-works", label: t("nav.howItWorks") }
  ];

  const appTabs = [
    { id: "workspace", label: t("nav.analyzeMessage") },
    { id: "history", label: t("nav.history") },
    { id: "notifications", label: t("nav.notifications") },
    { id: "settings", label: t("nav.settings") }
  ];

  const textTitleClass = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const bgCardClass = theme === "dark"
    ? "bg-slate-900/70 border-slate-800/80"
    : "bg-white border-slate-200 shadow-sm";

  return (
    <header 
      className={`sticky top-0 z-40 transition-colors duration-255 border-b ${
        theme === "dark" 
          ? "bg-slate-950/80 border-slate-900/60 text-slate-100" 
          : "bg-white/95 border-slate-200 text-slate-900 shadow-3xs"
      } backdrop-blur-md`}
      id="app_header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-17 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div 
          onClick={() => {
            setActiveTab("landing");
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
          id="nav_brand"
        >
          <div className="w-9 h-9 flex items-center justify-center group-hover:scale-[1.03] transition-all">
            <DogeshLogo className="w-9 h-9" animate={unreadCount > 0} />
          </div>
          <div className="text-left">
            <span className={`font-sans font-extrabold tracking-tight text-sm sm:text-base leading-none block ${textTitleClass}`}>
              Dogesh Signal
            </span>
            <span className="text-[10px] font-sans font-bold tracking-wider text-orange-500 dark:text-orange-400 block leading-none mt-1 uppercase">
              Instinct Radar
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7">
          
          {/* Discover/Marketing block links */}
          <div className="flex items-center gap-4 border-r border-slate-200 dark:border-slate-800 pr-5">
            {marketingTabs.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`text-xs font-semibold tracking-wide transition-colors cursor-pointer py-1 block ${
                    isActive
                      ? "text-orange-500 font-bold"
                      : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Primary Utility Tabs */}
          <nav className="flex items-center gap-2">
            {appTabs.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border relative ${
                    isActive
                      ? theme === "dark"
                        ? "bg-slate-900 text-orange-500 border-orange-500/20"
                        : "bg-slate-100 text-slate-950 border-slate-200 shadow-3xs"
                      : "bg-transparent border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.id === "notifications" && (
                    <AnimatePresence>
                      {unreadCount > 0 && (
                        <motion.span 
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 450, damping: 20 }}
                          className="bg-rose-500 text-white rounded-full text-[8.5px] font-mono px-1.5 py-0.5 font-bold shrink-0 inline-block"
                        >
                          {unreadCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Right utility panel */}
        <div className="flex items-center gap-2.5">
          
          {/* Primary CTA button matching Solid Signal Orange style list rules */}
          {!isAlreadyOnScanScreen && (
            <button
              onClick={() => {
                onScanCTA();
                setIsMobileMenuOpen(false);
              }}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-sans font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer border-none"
              id="nav_cta_scan_message"
            >
              <span>Analyze message</span>
            </button>
          )}

          {/* Language Toggle option */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "hi" : "en")}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-3xs"
            }`}
            title={t("nav.toggleLanguage")}
            id="language_controller"
          >
            <span className="text-[10px] font-semibold uppercase">{i18n.language === "en" ? "हिं" : "EN"}</span>
          </button>

          {/* Theme Toggle option */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              theme === "dark" 
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850" 
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-3xs"
            }`}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
            id="theme_controller"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Unified Profile/Auth button & dropdown */}
          <div className="relative" id="navbar_profile_container">
            <button
              onClick={() => {
                if (user) {
                  setIsProfileOpen(!isProfileOpen);
                } else {
                  navigate("/login");
                }
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                theme === "dark" 
                  ? "bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-3xs"
              }`}
              title={t("nav.profile")}
            >
              {user ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                    {user.email.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-mono font-bold hidden lg:inline truncate max-w-[80px]">
                    {user.email.split("@")[0]}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[10px] font-sans font-bold hidden lg:inline">{t("nav.signIn")}</span>
                </div>
              )}
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2.5 w-76 sm:w-80 rounded-2xl border p-4 shadow-2xl z-50 text-left ${
                    theme === "dark" 
                      ? "bg-slate-900/95 border-slate-800 text-slate-200 backdrop-blur-lg" 
                      : "bg-white border-slate-200 text-slate-800 shadow-xl"
                  }`}
                >
                  {user ? (
                    // Logged in UI
                    <div className="space-y-4 font-sans text-xs">
                      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <span className="text-[9px] font-mono font-bold text-orange-500 uppercase tracking-wider block">Logged In Profile</span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate mt-0.5" title={user.email}>{user.email}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 inline-block">Plan: {user.plan.toUpperCase()}</span>
                      </div>
                      
                      {/* Daily scan quota progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                          <span>DAILY SCANS</span>
                          <span>{usageCount} / {usageLimit === Infinity ? "∞" : usageLimit}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${usageCount >= usageLimit ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${usageLimit === Infinity ? 0 : Math.min((usageCount / usageLimit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      {/* Upgrade Plan link inside Profile */}
                      {user.plan !== PlanType.SHIELD_MONTHLY && user.plan !== PlanType.SHIELD_ANNUAL && (
                        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                          <button
                            onClick={() => {
                              setActiveTab("settings");
                              setIsProfileOpen(false);
                            }}
                            className="w-full py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-slate-950 hover:text-slate-900 rounded-lg text-[10px] font-mono font-bold cursor-pointer border-none text-center flex items-center justify-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Manage Plan & Billing</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          onLogout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/15 text-rose-500 border border-rose-500/10 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect Account</span>
                      </button>
                    </div>
                  ) : (
                    // Unified Login / Register Form
                    <div className="space-y-4 font-sans text-xs">
                      {/* Tabs */}
                      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850 select-none">
                        <button
                          onClick={() => { setAuthMode("login"); setAuthError(null); }}
                          className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            authMode === "login" 
                              ? "bg-white dark:bg-slate-900 text-slate-905 dark:text-slate-100 border border-slate-200/40 dark:border-slate-800 shadow-3xs" 
                              : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          Login
                        </button>
                        <button
                          onClick={() => { setAuthMode("register"); setAuthError(null); }}
                          className={`flex-1 text-center py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            authMode === "register" 
                              ? "bg-white dark:bg-slate-900 text-slate-905 dark:text-slate-100 border border-slate-200/40 dark:border-slate-800 shadow-3xs" 
                              : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          Register
                        </button>
                      </div>

                      {authError && (
                        <p className="text-rose-550 text-[10px] font-mono leading-relaxed bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg">
                          {authError}
                        </p>
                      )}

                      {authMode === "login" ? (
                        // Login Fields
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                            <input
                              type="email"
                              placeholder="you@domain.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-orange-500/50 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Password</label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-orange-500/50 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <button
                            disabled={isSubmitting}
                            onClick={async () => {
                              const emailVal = loginEmail.trim().toLowerCase();
                              const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (!emailVal || !EMAIL_RE.test(emailVal)) {
                                setAuthError("Please enter a valid email address");
                                return;
                              }
                              if (!loginPassword) {
                                setAuthError("Please enter your password");
                                return;
                              }
                              setIsSubmitting(true);
                              setAuthError(null);
                              const ok = await onLogin(emailVal, loginPassword);
                              setIsSubmitting(false);
                              if (ok) {
                                setIsProfileOpen(false);
                                setLoginPassword("");
                              } else {
                                setAuthError("Invalid credentials");
                              }
                            }}
                            className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-sans font-bold text-xs rounded-xl cursor-pointer border-none transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            {isSubmitting ? "Logging in..." : "Log In"}
                          </button>
                        </div>
                      ) : (
                        // Register Fields
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                            <input
                              type="text"
                              placeholder="Your Name"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-orange-500/50 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                            <input
                              type="email"
                              placeholder="you@domain.com"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-orange-500/50 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Password</label>
                            <input
                              type="password"
                              placeholder="Min. 8 characters"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-orange-500/50 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-orange-500/50 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-[10px] text-slate-500 select-none">
                            <input
                              type="checkbox"
                              checked={regTerms}
                              onChange={(e) => setRegTerms(e.target.checked)}
                              className="accent-orange-500 rounded"
                            />
                            I agree to Terms & Conditions
                          </label>
                          <button
                            disabled={isSubmitting}
                            onClick={async () => {
                              const emailVal = regEmail.trim().toLowerCase();
                              const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (!regName.trim() || !emailVal || !regPassword || !regConfirmPassword) {
                                setAuthError("Please fill all fields");
                                return;
                              }
                              if (!EMAIL_RE.test(emailVal)) {
                                setAuthError("Please enter a valid email address");
                                return;
                              }
                              if (regPassword !== regConfirmPassword) {
                                setAuthError("Passwords do not match");
                                return;
                              }
                              if (regPassword.length < 8) {
                                setAuthError("Password must be at least 8 characters");
                                return;
                              }
                              if (!regTerms) {
                                setAuthError("Must accept Terms & Conditions");
                                return;
                              }
                              setIsSubmitting(true);
                              setAuthError(null);
                              const ok = await onRegister(regName.trim(), emailVal, regPassword);
                              setIsSubmitting(false);
                              if (ok) {
                                setIsProfileOpen(false);
                                setRegName("");
                                setRegEmail("");
                                setRegPassword("");
                                setRegConfirmPassword("");
                                setRegTerms(false);
                              } else {
                                setAuthError("Registration failed");
                              }
                            }}
                            className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-sans font-bold text-xs rounded-xl cursor-pointer border-none transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                          </button>
                        </div>
                      )}
                      
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Try features as guest</span>
                        <button
                          type="button"
                          onClick={() => setIsProfileOpen(false)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-lg text-[9px] font-sans font-bold text-slate-600 dark:text-slate-350 cursor-pointer"
                        >
                          Guest Access
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Secure indicator light */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">Local</span>
          </div>

          {/* Mobile Nav Trigger (Enlarged tap targets, beautiful vector) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2.5 rounded-xl border cursor-pointer flex items-center justify-center ${
              theme === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-200"
                : "bg-white border-slate-200 text-slate-650 shadow-3xs"
            }`}
            id="mobile_menu_trigger"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

        </div>
      </div>

      {/* 2. MOBILE NAVIGATION DROP-DOWN (Large targets, direct plain English) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-t ${
              theme === "dark" ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"
            } px-4 py-5 space-y-4`}
            id="mobile_nav_container"
          >
            {/* Saliant Primary action at top of mobile dropdown */}
            {!isAlreadyOnScanScreen && (
              <button
                onClick={() => {
                  onScanCTA();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-450 text-slate-950 font-bold font-mono text-xs uppercase tracking-widest rounded-xl shadow-md text-center flex items-center justify-center gap-2 border-none transition-colors"
              >
                <span>Analyze message</span>
              </button>
            )}

            {/* Structured responsive links */}
            <div className="space-y-1.5">
              
              <span className="text-[8.5px] font-mono font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase block pl-3 pb-1 pt-2">
                Discover
              </span>
              {marketingTabs.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-slate-100 dark:bg-slate-900 text-orange-500 font-extrabold border border-slate-200 dark:border-slate-800"
                        : "text-slate-400 hover:bg-slate-500/5"
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}

              <span className="text-[8.5px] font-mono font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase block pl-3 pb-1 pt-3">
                Core App Tools
              </span>
              {appTabs.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      isActive
                        ? "bg-orange-500 text-slate-950 font-black shadow-sm"
                        : "text-slate-400 hover:bg-slate-500/5"
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.id === "notifications" && unreadCount > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono font-black ${
                        isActive ? "bg-slate-950 text-orange-500" : "bg-rose-500 text-white"
                      }`}>
                        {unreadCount} NEW
                      </span>
                    )}
                  </button>
                );
              })}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
