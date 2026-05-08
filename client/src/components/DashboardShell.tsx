import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Activity, Bot, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import "./dashboard-shell.css";

type DashboardTone = "accent" | "good" | "warn" | "alert" | "muted";

export type DashboardMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: DashboardTone;
  icon?: LucideIcon;
};

export type DashboardAlert = {
  label: string;
  tone?: DashboardTone;
};

export type DashboardShellProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  narration: string;
  metrics?: DashboardMetric[];
  alerts?: DashboardAlert[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

const toneClass: Record<DashboardTone, string> = {
  accent: "border-cyan-300/20 bg-cyan-300/8 text-cyan-50",
  good: "border-green-400/20 bg-green-400/8 text-green-50",
  warn: "border-amber-400/20 bg-amber-400/8 text-amber-50",
  alert: "border-rose-400/20 bg-rose-400/8 text-rose-50",
  muted: "border-white/10 bg-white/5 text-slate-200",
};

const metricToneClass: Record<DashboardTone, string> = {
  accent: "text-cyan-300",
  good: "text-green-300",
  warn: "text-amber-300",
  alert: "text-rose-300",
  muted: "text-slate-300",
};

function usePersistentToggle(key: string, fallback = false) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored != null) {
        setValue(stored === "1");
      }
    } catch {
      // ignore storage errors
    }
  }, [key]);

  const update = (next: boolean) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, next ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  };

  return [value, update] as const;
}

function speakIfAvailable(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 0.84;
  utterance.volume = 0.7;
  window.speechSynthesis.speak(utterance);
}

export function DashboardShell({ eyebrow = "ASTRA / DASHBOARD", title, subtitle, narration, metrics = [], alerts = [], actions, children, className }: DashboardShellProps) {
  const reducedMotion = useReducedMotion();
  const [startupLine, setStartupLine] = useState(narration);
  const [startupSeen, setStartupSeen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = usePersistentToggle("astra-dashboard-voice", false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const seenKey = "astra-dashboard-startup-seen";
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(seenKey) === "1";
    } catch {
      seen = false;
    }

    setStartupSeen(seen);
    if (seen) {
      setStartupLine(narration);
      return;
    }

    setStartupLine("Astra consciousness online. Synchronizing dashboard.");
    const timer = window.setTimeout(() => {
      setStartupLine(narration);
      try {
        window.sessionStorage.setItem(seenKey, "1");
      } catch {
        // ignore storage errors
      }
      setStartupSeen(true);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [narration]);

  useEffect(() => {
    if (!voiceEnabled) {
      return;
    }
    const timer = window.setTimeout(() => speakIfAvailable(startupLine), startupSeen ? 150 : 700);
    return () => window.clearTimeout(timer);
  }, [startupLine, startupSeen, voiceEnabled]);

  const primaryMetrics = useMemo(() => metrics.slice(0, 4), [metrics]);
  const secondaryMetrics = useMemo(() => metrics.slice(4), [metrics]);

  return (
    <motion.section
      className={cn("astra-dashboard-shell relative min-h-screen overflow-hidden bg-background text-foreground", className)}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div className="astra-dashboard-shell__glow" aria-hidden="true" />
      <div className="astra-dashboard-shell__grid" aria-hidden="true" />
      <div className="astra-dashboard-shell__noise" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-cyan-300/10 bg-[rgba(2,6,18,0.7)] px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/10 bg-slate-950/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                {eyebrow}
              </div>
              <div>
                <h1 className="astra-logo text-2xl text-white sm:text-3xl">{title}</h1>
                <p className="mt-1 max-w-3xl text-sm text-cyan-50/60">{subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={cn(
                  "astra-dashboard-shell__voice inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                  voiceEnabled ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/20 hover:text-cyan-50"
                )}
              >
                <Mic className="h-3.5 w-3.5" />
                Voice hooks
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/10 bg-slate-950/40 px-3 py-2 text-xs text-cyan-50/70">
                <Activity className="h-3.5 w-3.5 text-cyan-200" />
                <span>{startupLine}</span>
              </div>
              {actions}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="space-y-4">
            {primaryMetrics.length > 0 && (
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {primaryMetrics.map((metric) => {
                  const Icon = metric.icon ?? Bot;
                  const tone = metric.tone ?? "muted";
                  return (
                    <motion.div
                      key={metric.label}
                      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.26, ease: "easeOut" }}
                      className="astra-dashboard-panel rounded-[1.35rem] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="astra-ui-label text-[10px] text-cyan-100/45">{metric.label}</p>
                          <p className={cn("mt-1 text-2xl font-semibold tracking-tight", metricToneClass[tone])}>{metric.value}</p>
                          {metric.detail ? <p className="mt-1 text-xs text-cyan-50/50">{metric.detail}</p> : null}
                        </div>
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border", toneClass[tone])}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </section>
            )}

            <section className="astra-dashboard-panel rounded-[1.5rem] p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <p className="astra-ui-label text-[10px] text-cyan-100/40">Context</p>
                  <p className="mt-1 text-sm text-cyan-50/78">{startupLine}</p>
                </div>
                {alerts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {alerts.map((alert) => (
                      <span
                        key={alert.label}
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
                          toneClass[alert.tone ?? "muted"]
                        )}
                      >
                        {alert.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {secondaryMetrics.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {secondaryMetrics.map((metric) => {
                    const Icon = metric.icon ?? Bot;
                    const tone = metric.tone ?? "muted";
                    return (
                      <div key={metric.label} className="rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="astra-ui-label text-[10px] text-cyan-100/40">{metric.label}</p>
                            <p className={cn("mt-1 text-lg font-semibold", metricToneClass[tone])}>{metric.value}</p>
                          </div>
                          <Icon className={cn("h-4 w-4", metricToneClass[tone])} />
                        </div>
                        {metric.detail ? <p className="mt-2 text-xs text-cyan-50/45">{metric.detail}</p> : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="space-y-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </motion.section>
  );
}

export function DashboardPanel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("astra-dashboard-panel rounded-[1.35rem]", className)}>{children}</div>;
}

