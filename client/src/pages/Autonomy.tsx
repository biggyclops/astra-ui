import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Check,
  CheckCircle2,
  Clapperboard,
  Code2,
  Pause,
  Play,
  Send,
  Sparkles,
  Tv,
  Wrench,
  X,
  Eye,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAutonomySnapshot, type AutonomyJob } from "@/hooks/use-autonomy";

type AutonomyMode = "off" | "suggest" | "ask" | "auto";
type TaskState = "queued" | "running" | "completed";

type QueueItem = {
  id: string;
  title: string;
  detail: string;
  computer: string;
  gpu?: string;
  state: TaskState;
  progress?: number;
  eta?: string;
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

const COMMAND_CHIPS = [
  "Create a 10-minute episode",
  "Generate 10 Astra images",
  "Work on DeskFault",
  "Check my systems",
];

function formatEta(seconds: number | null | undefined) {
  if (seconds == null) return undefined;
  if (seconds < 60) return `~${seconds}s remaining`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `~${m}m ${s}s remaining` : `~${m} min remaining`;
}

function jobToQueueItem(job: AutonomyJob, state: TaskState): QueueItem {
  return {
    id: job.id,
    title: job.title,
    detail: job.type,
    computer: job.node || "HADES",
    state,
    progress: job.progress,
    eta: formatEta(job.etaSeconds),
  };
}

/** Phone-style HUD label: mono + wide tracking (matches AstraPhone OrbitalCoreView readout). */
function hudClass(extra?: string) {
  return cn(
    "font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300",
    extra,
  );
}

function SectionLabel({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={cn(hudClass("mb-3 flex items-center gap-2 text-cyan-200/85"))}>
      {icon}
      {children}
    </div>
  );
}

function PreviewLocalBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-amber-100",
        hudClass("text-[10px] tracking-[0.16em]"),
        className,
      )}
    >
      Preview / Local
    </span>
  );
}

const PREVIEW_LOCAL_TITLE = "Preview / Local — not connected in Phase 1";

/** Continuous timebase — ports Swift TimelineView(.animation). */
function useOrbitalTime() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/**
 * Desktop port of AstraPhone `OrbitalCoreView` + `AstraCoreLogo`.
 * Source: AstraPhone/ContentView.swift (OrbitalCoreView / centerCore / orbitalField).
 * Larger scale for desktop; same motion language (ellipses, ticks, arc, spinning A).
 */
function AstraPhoneOrb({ active, thinking }: { active: boolean; thinking?: boolean }) {
  const time = useOrbitalTime();
  const appearActive = active;
  const isThinking = Boolean(thinking && active);
  const thinkPulse = isThinking ? 0.5 + 0.5 * Math.sin(time * 5.2) : 0;
  const thinkScale = isThinking ? 1 + 0.045 * Math.sin(time * 5.2) : 1;
  const spinMul = isThinking ? 110 : appearActive ? 55 : 14;
  const logoSpin = appearActive ? time * (isThinking ? 42 : 28) : 0;
  // Optical field ~ larger; mark itself carries brand weight (no CSS "ball")
  const scale = 1.35;

  return (
    <div
      className="relative mx-auto shrink-0"
      style={{ width: 320 * scale, height: 300 * scale }}
      aria-hidden
    >
      {/* Soft starfield */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
        style={{
          width: 360 * scale,
          height: 360 * scale,
          background:
            "radial-gradient(circle at 50% 45%, rgba(0,242,255,0.08) 0%, rgba(2,6,18,0.2) 42%, transparent 68%)",
        }}
      >
        {Array.from({ length: 56 }).map((_, i) => {
          const x = (Math.sin(i * 12.9898 + 0.5) * 0.5 + 0.5) * 100;
          const y = (Math.cos(i * 78.233 + 0.25) * 0.5 + 0.5) * 100;
          const driftX = Math.sin(time * 0.12 + i) * 1.4;
          const driftY = Math.cos(time * 0.09 + i * 0.7) * 1.4;
          const r = ((i % 4) + 1) * 0.6;
          return (
            <span
              key={i}
              className="absolute rounded-full bg-cyan-50"
              style={{
                left: `calc(${x}% + ${driftX}px)`,
                top: `calc(${y}% + ${driftY}px)`,
                width: r,
                height: r,
                opacity: 0.2 + (i % 6) * 0.08,
                boxShadow: `0 0 ${3 + (i % 3) * 2}px rgba(0,242,255,${0.3 + (i % 4) * 0.12})`,
              }}
            />
          );
        })}
      </div>

      {/* Orbital ellipses */}
      {[0, 1, 2, 3].map((index) => {
        const w = (200 + index * 36) * scale;
        const h = (96 + index * 20) * scale;
        const deg = index * 48 + time * (appearActive ? 16 : 5);
        return (
          <div
            key={`ell-${index}`}
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              width: w,
              height: h,
              marginLeft: -w / 2,
              marginTop: -h / 2,
              transform: `rotate(${deg}deg)`,
              borderRadius: "50%",
              border: `${index === 0 ? 2 : 1.15}px solid transparent`,
              borderTopColor: "rgba(0,242,255,0.9)",
              borderRightColor: "rgba(59,130,246,0.35)",
              borderBottomColor: "transparent",
              borderLeftColor: "rgba(168,85,247,0.2)",
              boxShadow: `0 0 12px rgba(0,242,255,${appearActive ? 0.55 : 0.22})`,
              opacity: 0.95 - index * 0.12,
            }}
          />
        );
      })}

      {/* Tick capsules */}
      {Array.from({ length: 28 }).map((_, tick) => {
        const deg = tick * (360 / 28) + time * (appearActive ? 9 : 2.5);
        const len = (tick % 3 === 0 ? 16 : 7) * scale;
        return (
          <div
            key={`tick-${tick}`}
            className="pointer-events-none absolute left-1/2 top-1/2 origin-center"
            style={{
              width: 148 * scale * 2,
              height: 2,
              marginLeft: -148 * scale,
              marginTop: -1,
              transform: `rotate(${deg}deg)`,
            }}
          >
            <span
              className="absolute right-0 top-0 rounded-full bg-[#00f2ff]"
              style={{
                width: len,
                height: 1.6,
                opacity: tick % 3 === 0 ? 0.7 : 0.22,
              }}
            />
          </div>
        );
      })}

      {/* Outer guide rings */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-white/[0.07]"
        style={{
          width: 310 * scale,
          height: 310 * scale,
          marginLeft: -155 * scale,
          marginTop: -155 * scale,
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-dashed border-[#00f2ff]/25"
        style={{
          width: 268 * scale,
          height: 268 * scale,
          marginLeft: -134 * scale,
          marginTop: -134 * scale,
          transform: `rotate(${-time * 7}deg)`,
        }}
      />

      {isThinking &&
        [0, 1].map((ring) => (
          <div
            key={`think-${ring}`}
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-[#00f2ff]/50"
            style={{
              width: (150 + ring * 36) * scale * (1 + thinkPulse * 0.08),
              height: (150 + ring * 36) * scale * (1 + thinkPulse * 0.08),
              marginLeft: (-(150 + ring * 36) * scale * (1 + thinkPulse * 0.08)) / 2,
              marginTop: (-(150 + ring * 36) * scale * (1 + thinkPulse * 0.08)) / 2,
              opacity: 0.55 - ring * 0.18,
            }}
          />
        ))}

      {/* Soft glow halo only — brand mark is the core, not a filled sphere */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 168 * scale,
          height: 168 * scale,
          marginLeft: (-168 * scale) / 2,
          marginTop: (-168 * scale) / 2,
          background:
            "radial-gradient(circle, rgba(0,242,255,0.28) 0%, rgba(37,99,235,0.12) 42%, transparent 70%)",
          filter: "blur(2px)",
          opacity: appearActive ? 1 : 0.35,
          transform: `scale(${thinkScale})`,
        }}
      />

      {/* Spinning arc around mark */}
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2"
        width={150 * scale}
        height={150 * scale}
        style={{
          marginLeft: (-150 * scale) / 2,
          marginTop: (-150 * scale) / 2,
          transform: `rotate(${time * spinMul}deg)`,
        }}
        viewBox="0 0 150 150"
      >
        <circle
          cx="75"
          cy="75"
          r="62"
          fill="none"
          stroke="rgba(0,242,255,0.55)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={`${0.42 * 2 * Math.PI * 62} ${2 * Math.PI * 62}`}
        />
      </svg>

      {/* Real Astra core logo asset */}
      <img
        src="/astra-core-logo.png"
        alt="Astra"
        className="absolute left-1/2 top-1/2 object-contain select-none"
        style={{
          width: 132 * scale,
          height: 132 * scale,
          marginLeft: (-132 * scale) / 2,
          marginTop: (-132 * scale) / 2,
          filter: appearActive
            ? "drop-shadow(0 0 18px rgba(0,242,255,0.95)) drop-shadow(0 0 42px rgba(0,242,255,0.45))"
            : "brightness(0.35) saturate(0.3) opacity(0.5)",
          transform: appearActive
            ? `scale(${thinkScale}) rotate3d(0.12, 1, 0, ${logoSpin}deg)`
            : "scale(1)",
          willChange: "transform",
        }}
        draggable={false}
      />
    </div>
  );
}

export default function Autonomy() {
  // Phase 1 policy is Ask First. Mode chips are display-only until a mutating API exists.
  const phase1Mode: AutonomyMode = "ask";
  const { data: snapshot, isLoading } = useAutonomySnapshot();

  const liveTasks = useMemo(() => {
    const items: QueueItem[] = [];
    if (snapshot?.working) items.push(jobToQueueItem(snapshot.working, "running"));
    for (const job of snapshot?.queue ?? []) {
      if (snapshot?.working && job.id === snapshot.working.id) continue;
      items.push(jobToQueueItem(job, job.status === "running" ? "running" : "queued"));
    }
    return items;
  }, [snapshot]);

  const activity = useMemo<ActivityItem[]>(() => {
    return (snapshot?.history ?? []).map((job) => ({
      id: job.id,
      title: job.title,
      computer: job.node || "HADES",
      finishedAt: job.status,
      resultLabel: job.status === "done" ? "View Results" : job.status,
    }));
  }, [snapshot]);

  const liveSuggestions = useMemo<Suggestion[]>(() => {
    const rows: Suggestion[] = [];
    if (snapshot?.advisor.topRecommendation) {
      rows.push({
        id: "top",
        title: "Recommendation",
        detail: snapshot.advisor.topRecommendation,
      });
    }
    (snapshot?.advisor.currentAdvisories ?? []).forEach((text, i) => {
      if (text === snapshot?.advisor.topRecommendation) return;
      rows.push({ id: `adv-${i}`, title: "Advisory", detail: text });
    });
    return rows;
  }, [snapshot]);

  const primary = useMemo(
    () => liveTasks.find((t) => t.state === "running") ?? null,
    [liveTasks],
  );
  const doing = useMemo(() => liveTasks.filter((t) => t.state === "running"), [liveTasks]);
  const next = useMemo(() => liveTasks.filter((t) => t.state === "queued"), [liveTasks]);
  const suggestions = liveSuggestions;

  const hadesReachable = snapshot?.hadesReachable ?? false;
  const working = snapshot?.orbState === "working";

  return (
    <div className="relative min-h-full overflow-hidden bg-[#05070f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.12),transparent_50%),radial-gradient(ellipse_at_80%_40%,rgba(147,51,234,0.1),transparent_45%),radial-gradient(ellipse_at_20%_70%,rgba(59,130,246,0.08),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-4 py-5 pb-14 md:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-[#00f2ff]/20 bg-black/40 p-5 shadow-[0_0_60px_rgba(0,242,255,0.12)] backdrop-blur-sm md:p-7">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-600/10" />

          <div className="relative mb-3 flex items-center justify-between gap-3">
            <span
              className={cn(
                "rounded-full border px-3 py-1 shadow-[0_0_16px_rgba(0,242,255,0.2)]",
                hudClass(
                  working
                    ? "border-[#00f2ff]/55 bg-[#00f2ff]/15 text-[#00f2ff]"
                    : "border-amber-400/35 bg-amber-500/10 text-amber-100",
                ),
              )}
            >
              {working ? "Autonomy Active" : "Astra Idle"}
            </span>
            <span
              className={cn(
                "rounded-full border border-purple-400/35 bg-purple-500/10 px-3 py-1",
                hudClass("text-purple-100"),
              )}
            >
              {isLoading
                ? "Syncing"
                : !snapshot
                  ? "No snapshot"
                  : hadesReachable
                    ? "Hades live"
                    : "Hades unavailable"}
            </span>
          </div>

          <div className="relative grid items-center gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-8">
            <div className="flex justify-center md:justify-start">
              <AstraPhoneOrb active={working} thinking={working} />
            </div>

            <div className="min-w-0 text-center md:text-left">
              <p className={cn(hudClass("text-[#00f2ff] tracking-[0.35em]"))}>
                {working ? "Astra is working" : !hadesReachable && snapshot ? "Hades unavailable" : "Astra is idle"}
              </p>

              {!primary && (
                <div className="mt-3 space-y-1">
                  <h1 className="font-sans text-2xl font-semibold tracking-tight text-white md:text-[1.85rem]">
                    ASTRA IS IDLE
                  </h1>
                  <p className="mt-1 font-sans text-base text-cyan-100/85">No active jobs</p>
                </div>
              )}

              {primary && (
                <div className="mt-3 space-y-3">
                  <div>
                    <h1 className="font-sans text-2xl font-semibold tracking-tight text-white md:text-[1.85rem]">
                      {primary.title}
                    </h1>
                    <p className="mt-1 font-sans text-base text-cyan-100/85">{primary.detail}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 md:justify-start">
                    <p className={hudClass("text-purple-200/90")}>
                      {primary.computer}
                      {primary.gpu ? ` • ${primary.gpu}` : ""}
                    </p>
                    <p className={hudClass("text-[#00f2ff]/90")}>
                      {doing.length} Active Task{doing.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {typeof primary.progress === "number" && (
                    <div className="w-full max-w-md mx-auto md:mx-0">
                      <div className={cn(hudClass("mb-2 flex items-center justify-between text-cyan-200/90"))}>
                        <span>{primary.progress}% complete</span>
                        <span>{primary.eta ?? "—"}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#00f2ff] via-cyan-400 to-purple-500 shadow-[0_0_18px_rgba(0,242,255,0.65)]"
                          initial={false}
                          animate={{ width: `${primary.progress}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 20 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                {/* TODO(autonomy): wire Pause/Resume to a mutating control API when Product + CTO approve beyond read-only. */}
                {working ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    aria-disabled="true"
                    title={PREVIEW_LOCAL_TITLE}
                    className={cn(
                      "gap-1.5 rounded-full border-amber-400/35 bg-transparent text-amber-50",
                      hudClass("normal-case tracking-[0.18em]"),
                    )}
                  >
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    aria-disabled="true"
                    title={PREVIEW_LOCAL_TITLE}
                    className={cn(
                      "gap-1.5 rounded-full border-[#00f2ff]/40 bg-transparent text-[#00f2ff]",
                      hudClass("normal-case tracking-[0.18em]"),
                    )}
                  >
                    <Play className="h-3.5 w-3.5" /> Resume
                  </Button>
                )}
                <PreviewLocalBadge />
              </div>
            </div>
          </div>
        </section>

        {/* Command */}
        {/* TODO(autonomy): wire command dispatch to a mutating Autonomy API when Product + CTO approve beyond read-only. */}
        <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-black/50 to-purple-600/10 p-5 shadow-[0_0_40px_rgba(34,211,238,0.1)] md:p-6">
          <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />}>
            What should I work on?
            <PreviewLocalBadge />
          </SectionLabel>

          <div className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-black/50 p-2 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
            <input
              disabled
              readOnly
              aria-disabled="true"
              title={PREVIEW_LOCAL_TITLE}
              placeholder="Tell Astra what you want accomplished while your computers are idle..."
              className="min-w-0 flex-1 cursor-not-allowed bg-transparent px-3 py-3 font-sans text-sm text-cyan-50 placeholder:text-slate-500 outline-none disabled:opacity-60"
            />
            <Button
              size="icon"
              disabled
              aria-disabled="true"
              title={PREVIEW_LOCAL_TITLE}
              className="h-11 w-11 shrink-0 rounded-xl border border-cyan-300/40 bg-cyan-500/25 text-cyan-50"
              aria-label="Send to Astra (Preview / Local)"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {COMMAND_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled
                aria-disabled="true"
                title={PREVIEW_LOCAL_TITLE}
                className={cn(
                  "cursor-not-allowed rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1.5 text-purple-100 opacity-60",
                  hudClass("normal-case tracking-[0.12em] text-[10px]"),
                )}
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section>
          <SectionLabel>
            What I can work on
            <PreviewLocalBadge />
          </SectionLabel>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                key: "studios",
                title: "Studios",
                blurb: "Images • Video • Episodes",
                action: "Create an Episode",
                icon: <Clapperboard className="h-5 w-5 text-cyan-300" />,
                accent: "from-cyan-500/15 to-blue-600/10 border-cyan-400/25",
              },
              {
                key: "dev",
                title: "Developer",
                blurb: "Apps • Code • Testing",
                action: "Build an App",
                icon: <Code2 className="h-5 w-5 text-blue-300" />,
                accent: "from-blue-500/15 to-indigo-600/10 border-blue-400/25",
              },
              {
                key: "ops",
                title: "Ops",
                blurb: "Systems • Maintenance • Monitoring",
                action: "Check Systems",
                icon: <Wrench className="h-5 w-5 text-purple-300" />,
                accent: "from-purple-500/15 to-fuchsia-600/10 border-purple-400/25",
              },
            ].map((card) => (
              <motion.button
                key={card.key}
                type="button"
                disabled
                aria-disabled="true"
                title={PREVIEW_LOCAL_TITLE}
                className={cn(
                  "group cursor-not-allowed rounded-3xl border bg-gradient-to-br p-5 text-left opacity-70 shadow-[0_0_30px_rgba(0,0,0,0.25)]",
                  card.accent,
                )}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5">{card.icon}</div>
                  <ArrowRight className="h-4 w-4 text-white/30 transition group-hover:text-cyan-300" />
                </div>
                <h3 className={hudClass("text-sm text-white tracking-[0.16em]")}>{card.title}</h3>
                <p className="mt-1 font-sans text-sm text-slate-300/90">{card.blurb}</p>
                <p className={cn(hudClass("mt-4 text-cyan-200/90 tracking-[0.16em]"))}>{card.action}</p>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Activity columns */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-cyan-400/15 bg-black/40 p-5 backdrop-blur-sm">
            <SectionLabel icon={<Activity className="h-3.5 w-3.5" />}>What I&apos;m working on</SectionLabel>
            <div className="space-y-3">
              {doing.length === 0 && (
                <p className="font-sans text-sm text-slate-500">Nothing running right now.</p>
              )}
              {doing.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3"
                >
                  <p className="font-sans text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 font-sans text-xs text-cyan-200/80">{item.detail}</p>
                  <p className={cn(hudClass("mt-2 text-purple-200/80 tracking-[0.14em]"))}>
                    {item.computer}
                    {item.gpu ? ` • ${item.gpu}` : ""}
                  </p>
                  {typeof item.progress === "number" && (
                    <div className="mt-2">
                      <div className={cn(hudClass("mb-1 flex justify-between text-[10px] text-cyan-200/70"))}>
                        <span>{item.progress}%</span>
                        <span>{item.eta}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-purple-400/15 bg-black/40 p-5 backdrop-blur-sm">
            <SectionLabel icon={<Tv className="h-3.5 w-3.5 text-purple-300" />}>What&apos;s next</SectionLabel>
            <div className="space-y-3">
              {next.length === 0 && (
                <p className="font-sans text-sm text-slate-500">Queue is clear.</p>
              )}
              {next.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-purple-400/20 bg-purple-500/5 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-sans text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 font-sans text-xs text-slate-400">{item.detail}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border border-purple-400/30 bg-purple-500/10 px-2 py-0.5 text-purple-200",
                        hudClass("text-[10px]"),
                      )}
                    >
                      Queued
                    </span>
                  </div>
                  <p className={cn(hudClass("mt-2 text-purple-200/70 tracking-[0.14em]"))}>
                    {item.computer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-fuchsia-400/15 bg-black/40 p-5 backdrop-blur-sm">
            <SectionLabel icon={<Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />}>
              What I suggest
              <PreviewLocalBadge />
            </SectionLabel>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {suggestions.length === 0 && (
                  <p className="font-sans text-sm text-slate-500">No suggestions right now.</p>
                )}
                {suggestions.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/5 p-3"
                  >
                    <p className="font-sans text-sm leading-relaxed text-slate-100">{s.detail}</p>
                    {/* TODO(autonomy): wire Approve / Not Now to a mutating advisor API when Product + CTO approve beyond read-only. */}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        aria-disabled="true"
                        title={PREVIEW_LOCAL_TITLE}
                        className={cn(
                          "flex-1 gap-1 rounded-full border-[#00f2ff]/55 bg-transparent text-[#00f2ff]",
                          hudClass("normal-case tracking-[0.16em]"),
                        )}
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        aria-disabled="true"
                        title={PREVIEW_LOCAL_TITLE}
                        className={cn(
                          "flex-1 gap-1 rounded-full border-white/25 bg-transparent text-slate-200",
                          hudClass("normal-case tracking-[0.16em]"),
                        )}
                      >
                        <X className="h-3.5 w-3.5" /> Not Now
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <SectionLabel icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}>
            What I&apos;m doing
            <PreviewLocalBadge />
          </SectionLabel>
          <div className="space-y-2">
            {activity.length === 0 && (
              <p className="font-sans text-sm text-slate-500">No recent jobs</p>
            )}
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
              >
                <div>
                  <p className="font-sans text-sm text-slate-200">{item.title}</p>
                  <p className="font-sans text-[11px] text-slate-500">
                    <span className="font-mono font-bold uppercase tracking-[0.14em] text-cyan-300/80">
                      {item.computer}
                    </span>{" "}
                    · {item.finishedAt}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled
                  aria-disabled="true"
                  title={PREVIEW_LOCAL_TITLE}
                  className={cn("gap-1.5 text-cyan-200/80", hudClass("normal-case tracking-[0.14em]"))}
                >
                  <Eye className="h-3.5 w-3.5" /> {item.resultLabel}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* TODO(autonomy): persist mode via a mutating settings API when Product + CTO approve beyond read-only. Auto remains forbidden until explicitly approved. */}
        <section className="rounded-3xl border border-white/10 bg-black/40 p-5 md:p-6">
          <SectionLabel>
            Autonomy settings
            <PreviewLocalBadge />
          </SectionLabel>
          <p className="mb-4 max-w-2xl font-sans text-sm text-slate-400">
            Phase 1 is read-only. Ask First is the displayed policy. Mode controls are
            Preview / Local and are not connected.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled
                aria-disabled="true"
                aria-pressed={opt.id === phase1Mode}
                title={PREVIEW_LOCAL_TITLE}
                className={cn(
                  "cursor-not-allowed rounded-2xl border px-4 py-3 text-left opacity-70",
                  opt.id === phase1Mode
                    ? "border-cyan-400/45 bg-cyan-500/15 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/[0.02]",
                  opt.id === "auto" && "opacity-40",
                )}
              >
                <p className={cn(hudClass(opt.id === phase1Mode ? "text-cyan-100" : "text-white"))}>
                  {opt.label}
                </p>
                <p className="mt-1 font-sans text-[11px] text-slate-500">{opt.hint}</p>
              </button>
            ))}
          </div>
        </section>

        <p className="text-center font-mono text-[11px] uppercase tracking-[0.16em] text-slate-600">
          /autonomy · read-only snapshot{snapshot?.generatedAt ? ` · ${new Date(snapshot.generatedAt).toLocaleTimeString()}` : ""}
        </p>
      </div>
    </div>
  );
}
