import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Check,
  CheckCircle2,
  Clapperboard,
  Code2,
  Image as ImageIcon,
  Pause,
  Play,
  Sparkles,
  Tv,
  Video,
  Wrench,
  X,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AutonomyMode = "off" | "suggest" | "ask" | "auto";
type TaskState = "queued" | "running" | "completed";

type QueueItem = {
  id: string;
  title: string;
  detail: string;
  computer: string;
  state: TaskState;
  progress?: number;
};

type ActivityItem = {
  id: string;
  title: string;
  computer: string;
  finishedAt: string;
  resultLabel: string;
};

type Suggestion = {
  id: string;
  title: string;
  detail: string;
};

const MODE_OPTIONS: { id: AutonomyMode; label: string; hint: string }[] = [
  { id: "off", label: "Off", hint: "Autonomy sleeps" },
  { id: "suggest", label: "Suggest Only", hint: "Ideas only — never runs" },
  { id: "ask", label: "Ask First", hint: "Approve each action" },
  { id: "auto", label: "Auto Run Approved", hint: "Run pre-approved work" },
];

const INITIAL_TASKS: QueueItem[] = [
  {
    id: "t1",
    title: "Creating Astra Episode 01",
    detail: "Scene 7 of 24",
    computer: "Hades",
    state: "running",
    progress: 29,
  },
  {
    id: "t2",
    title: "Generating 10 concept images",
    detail: "Style pack · nebula noir",
    computer: "Hades",
    state: "running",
    progress: 73,
  },
  {
    id: "t3",
    title: "Testing DeskFault build",
    detail: "Unit + smoke suite",
    computer: "Chronos",
    state: "queued",
  },
  {
    id: "t4",
    title: "Storyboard Episode 01 act break",
    detail: "Waiting for scene batch",
    computer: "Mini-Beast",
    state: "queued",
  },
  {
    id: "t5",
    title: "Synced voice preview pack",
    detail: "Talos TTS dry-run (mock)",
    computer: "Talos",
    state: "completed",
    progress: 100,
  },
];

const INITIAL_ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    title: "Rendered Episode 01 scenes 1–6",
    computer: "Hades",
    finishedAt: "12m ago",
    resultLabel: "View Results",
  },
  {
    id: "a2",
    title: "DeskFault scaffold generated",
    computer: "Chronos",
    finishedAt: "38m ago",
    resultLabel: "View Results",
  },
  {
    id: "a3",
    title: "Ops health sweep (mock)",
    computer: "Mini-Beast",
    finishedAt: "1h ago",
    resultLabel: "View Results",
  },
];

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    title: "Hades is idle soon",
    detail: "I can render the remaining 14 scenes for Astra Episode 01 while you’re away.",
  },
  {
    id: "s2",
    title: "Queue concept stills overnight",
    detail: "Spin 24 more style variants for Episode 01 after the current image batch finishes.",
  },
  {
    id: "s3",
    title: "Ship DeskFault test report",
    detail: "When Chronos finishes the build, I can summarize failures into a chat note.",
  },
];

function AstraOrb({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center md:h-52 md:w-52">
      <motion.div
        className="absolute inset-0 rounded-full border border-cyan-400/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
      </motion.div>
      <motion.div
        className="absolute inset-3 rounded-full border border-purple-400/25 border-dashed"
        animate={{ rotate: -360 }}
        transition={{ duration: 42, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-8 rounded-full border border-blue-400/15"
        animate={{ scale: active ? [1, 1.04, 1] : 1, opacity: active ? [0.55, 0.9, 0.55] : 0.35 }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cn(
          "relative z-10 flex h-28 w-28 items-center justify-center rounded-full border md:h-32 md:w-32",
          active
            ? "border-cyan-300/40 bg-gradient-to-br from-cyan-400/25 via-blue-600/30 to-purple-700/40 shadow-[0_0_48px_rgba(34,211,238,0.35)]"
            : "border-amber-300/30 bg-gradient-to-br from-amber-500/15 via-slate-800/40 to-purple-900/30 shadow-[0_0_28px_rgba(251,191,36,0.2)]",
        )}
        animate={active ? { boxShadow: ["0 0 28px rgba(34,211,238,0.25)", "0 0 52px rgba(34,211,238,0.45)", "0 0 28px rgba(34,211,238,0.25)"] } : undefined}
        transition={{ duration: 2.8, repeat: Infinity }}
      >
        <span className="font-display text-4xl font-black tracking-tight text-cyan-50 md:text-5xl">A</span>
      </motion.div>
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_62%)]" />
    </div>
  );
}

function RadarBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full border border-cyan-400/10" />
      <div className="absolute -left-10 top-24 h-48 w-48 rounded-full border border-purple-400/10" />
      <div className="absolute right-[-80px] top-40 h-96 w-96 rounded-full border border-blue-400/10" />
      <motion.div
        className="absolute left-8 top-16 h-64 w-64 origin-center rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,0.12) 50deg, transparent 90deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}

export default function Autonomy() {
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState<AutonomyMode>("ask");
  const [tasks] = useState(INITIAL_TASKS);
  const [activity] = useState(INITIAL_ACTIVITY);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);

  const primary = useMemo(() => tasks.find((t) => t.state === "running") ?? tasks[0], [tasks]);
  const runningCount = tasks.filter((t) => t.state === "running").length;

  const studios = [
    {
      id: "images",
      title: "Images",
      blurb: "Concept stills, style packs, upscales",
      icon: ImageIcon,
      meta: "10 in flight · mock",
    },
    {
      id: "video",
      title: "Video",
      blurb: "Scene renders & clip assembly",
      icon: Video,
      meta: "Episode 01 · Scene 7",
    },
    {
      id: "tv",
      title: "TV Episodes",
      blurb: "Boards, beats, episode pipelines",
      icon: Tv,
      meta: "Coming online",
    },
  ];

  const dismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-transparent text-foreground">
      <RadarBackdrop />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-5 p-4 pb-10 md:p-6">
        {/* Hero / orb */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-md md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-600/15" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[220px_1fr]">
            <AstraOrb active={active && mode !== "off"} />

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
                    active && mode !== "off"
                      ? "border-cyan-400/35 bg-cyan-500/15 text-cyan-200"
                      : "border-amber-400/35 bg-amber-500/10 text-amber-200",
                  )}
                >
                  {active && mode !== "off" ? "Autonomy Active" : "Autonomy Paused"}
                </span>
                <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-purple-100">
                  Mock only
                </span>
              </div>

              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                  {active && mode !== "off" ? "ASTRA IS WORKING" : "ASTRA IS WAITING"}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  {active && mode !== "off"
                    ? "Alive while you’re away — queueing creative and ops work across the fleet (display only)."
                    : "Autonomy is paused. Suggestions and history stay visible; nothing runs."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Machine</p>
                  <p className="mt-1 font-display text-lg font-semibold text-cyan-200">{primary?.computer ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:col-span-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Current job</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {primary ? `${primary.title} — ${primary.detail}` : "None"}
                  </p>
                  {typeof primary?.progress === "number" && primary.state === "running" && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-cyan-200/90">
                        <span>{runningCount} active</span>
                        <span className="font-mono">{primary.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_14px_rgba(34,211,238,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${primary.progress}%` }}
                          transition={{ duration: 1.1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setActive((v) => !v)}
                  className="gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/20 text-cyan-50 hover:bg-cyan-500/30"
                >
                  {active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {active ? "Pause" : "Resume"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Mode selector */}
        <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <h2 className="font-display text-sm font-semibold tracking-wide text-white">Autonomy mode</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-left transition-all",
                  mode === opt.id
                    ? "border-cyan-400/45 bg-cyan-500/15 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20",
                )}
              >
                <p className={cn("text-sm font-semibold", mode === opt.id ? "text-cyan-100" : "text-white")}>
                  {opt.label}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{opt.hint}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Tasks */}
          <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-300" />
              <h2 className="font-display text-sm font-semibold tracking-wide text-white">TASKS</h2>
            </div>
            <div className="space-y-2">
              {tasks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.detail}
                        <span className="mx-1.5 opacity-40">·</span>
                        <span className="text-cyan-300/90">{item.computer}</span>
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        item.state === "running" && "border-cyan-400/30 bg-cyan-500/15 text-cyan-200",
                        item.state === "queued" && "border-purple-400/30 bg-purple-500/10 text-purple-200",
                        item.state === "completed" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
                      )}
                    >
                      {item.state === "running" ? (
                        <motion.span
                          className="inline-flex items-center gap-1"
                          animate={{ opacity: [1, 0.55, 1] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                          running
                        </motion.span>
                      ) : (
                        item.state
                      )}
                    </span>
                  </div>
                  {typeof item.progress === "number" && item.state === "running" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Suggestions */}
          <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-300" />
              <h2 className="font-display text-sm font-semibold tracking-wide text-white">ASTRA SUGGESTS</h2>
            </div>
            <AnimatePresence initial={false}>
              {suggestions.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  No suggestions right now.
                </motion.p>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((s) => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 p-4"
                    >
                      <p className="text-sm font-medium text-white">{s.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 rounded-full bg-cyan-500/25 text-cyan-50 hover:bg-cyan-500/35"
                          onClick={() => dismissSuggestion(s.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 rounded-full border-white/15"
                          onClick={() => dismissSuggestion(s.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Not Now
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Studios / Developer / Ops */}
        <div className="grid gap-5 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-5 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Clapperboard className="h-4 w-4 text-cyan-300" />
              <h2 className="font-display text-sm font-semibold tracking-wide text-white">STUDIOS</h2>
            </div>
            <div className="space-y-2">
              {studios.map((studio) => {
                const Icon = studio.icon;
                return (
                  <div key={studio.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{studio.title}</p>
                        <p className="text-[11px] text-muted-foreground">{studio.meta}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{studio.blurb}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-300" />
              <h2 className="font-display text-sm font-semibold tracking-wide text-white">DEVELOPER</h2>
            </div>
            <p className="text-sm text-white">Apps, coding & testing</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              DeskFault build is queued on Chronos. Autonomy can scaffold, test, and report — mock lane only for now.
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-blue-400/25 bg-blue-500/5 px-3 py-4 text-center text-xs text-blue-100/80">
              Testing DeskFault build — queued
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-purple-300" />
              <h2 className="font-display text-sm font-semibold tracking-wide text-white">OPS</h2>
            </div>
            <p className="text-sm text-white">Maintenance & monitoring</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Fleet status probes — mock calm
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Storage watch — deferred (read-only)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> No infra actions from this page
              </li>
            </ul>
          </section>
        </div>

        {/* Recent activity */}
        <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-md md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <h2 className="font-display text-sm font-semibold tracking-wide text-white">Recent Activity</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {activity.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  <span className="text-cyan-300/90">{item.computer}</span>
                  <span className="mx-1.5 opacity-40">·</span>
                  {item.finishedAt}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-1.5 rounded-full border-white/15"
                  disabled
                >
                  <Eye className="h-3.5 w-3.5" />
                  {item.resultLabel}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-[11px] text-muted-foreground/70">
          Standalone <span className="font-mono text-cyan-400/80">/autonomy</span> · no home/nav changes · mock data only ·
          P0–P3 infra stays deferred
        </p>
      </div>
    </div>
  );
}
