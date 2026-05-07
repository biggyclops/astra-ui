import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { ASTRA_LOGIN_IMAGE } from "./astra-assets";
import { ASTRA_VISUAL_PANEL_MOTION } from "./astra-motion";
import "./astra-visual-panel.css";

type AstraVisualPanelProps = {
  className?: string;
};

const monitorCards = [
  {
    label: "node feed",
    value: "12 ONLINE",
    width: "w-[56%]",
    delay: 0,
  },
  {
    label: "latency",
    value: "18 MS",
    width: "w-[68%]",
    delay: 1.8,
  },
  {
    label: "sync",
    value: "SEALED",
    width: "w-[47%]",
    delay: 3.4,
  },
];

const panelMotion = {
  portrait: {
    y: [0, -2, 0],
    x: [0, 0.5, 0],
    scale: [1, 1.003, 1],
  },
  shimmer: {
    x: ["-28%", "42%"],
    opacity: [0, 0.07, 0],
  },
  pulse: {
    opacity: [0.1, 0.14, 0.1],
    scale: [1, 1.01, 1],
  },
  grain: {
    opacity: [0.018, 0.03, 0.018],
    x: [0, 1, 0],
    y: [0, -1, 0],
  },
  scan: {
    opacity: [0.02, 0.045, 0.02],
    y: [0, 2, 0],
  },
};

export function AstraVisualPanel({ className }: AstraVisualPanelProps) {
  const reducedMotion = useReducedMotion();
  const motionEnabled = !reducedMotion;
  const rootStyle = {
    "--astra-visual-panel-portrait-duration": `${ASTRA_VISUAL_PANEL_MOTION.portrait}s`,
    "--astra-visual-panel-image-duration": `${ASTRA_VISUAL_PANEL_MOTION.image}s`,
    "--astra-visual-panel-pulse-duration": `${ASTRA_VISUAL_PANEL_MOTION.pulse}s`,
    "--astra-visual-panel-grain-duration": `${ASTRA_VISUAL_PANEL_MOTION.grain}s`,
    "--astra-visual-panel-scan-duration": `${ASTRA_VISUAL_PANEL_MOTION.scan}s`,
    "--astra-visual-panel-shimmer-duration": `${ASTRA_VISUAL_PANEL_MOTION.shimmer}s`,
    "--astra-visual-panel-badge-duration": `${ASTRA_VISUAL_PANEL_MOTION.badge}s`,
    "--astra-visual-panel-card-base-duration": `${ASTRA_VISUAL_PANEL_MOTION.cardBase}s`,
    "--astra-visual-panel-card-step-duration": `${ASTRA_VISUAL_PANEL_MOTION.cardStep}s`,
    "--astra-visual-panel-signal-duration": `${ASTRA_VISUAL_PANEL_MOTION.signal}s`,
    "--astra-visual-panel-telemetry-duration": `${ASTRA_VISUAL_PANEL_MOTION.telemetry}s`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "astra-visual-panel relative h-full overflow-hidden rounded-[1.35rem] border border-cyan-300/10 bg-[rgba(2,6,23,0.64)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className
      )}
      style={rootStyle}
    >
      <motion.div
        className="absolute inset-0"
        animate={motionEnabled ? panelMotion.portrait : { y: 0, x: 0, scale: 1 }}
        transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.portrait, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.img
          src={ASTRA_LOGIN_IMAGE}
          alt="Astra visual system panel"
          className="astra-visual-panel__image absolute inset-0 h-full w-full object-cover object-[82%_center] sm:object-[86%_center] lg:object-[90%_center]"
          animate={motionEnabled ? { y: [0, -3, 0], scale: [1, 1.006, 1] } : { y: 0, scale: 1 }}
          transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.image, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={motionEnabled ? panelMotion.pulse : { opacity: 0.12, scale: 1 }}
        transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.pulse, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle at 42% 26%, rgba(34,211,238,0.12), transparent 24%), radial-gradient(circle at 78% 22%, rgba(59,130,246,0.09), transparent 18%), radial-gradient(circle at 64% 62%, rgba(125,211,252,0.05), transparent 28%)",
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.05)_0%,rgba(2,6,23,0.18)_34%,rgba(2,6,23,0.5)_70%,rgba(2,6,23,0.84)_100%)]" />
      <div className="absolute inset-y-0 left-0 w-[46%] bg-gradient-to-r from-[#020712] via-[#020712] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_24%,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_78%_24%,rgba(59,130,246,0.08),transparent_20%)]" />

      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="astra-visual-panel__grain absolute inset-0 mix-blend-screen"
          animate={motionEnabled ? panelMotion.grain : { opacity: 0.02 }}
          transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.grain, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="astra-visual-panel__scan absolute inset-0"
          animate={motionEnabled ? panelMotion.scan : { opacity: 0.02 }}
          transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.scan, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="absolute inset-0 bg-[linear-gradient(120deg,transparent_42%,rgba(125,211,252,0.1)_50%,transparent_58%)]"
        animate={motionEnabled ? panelMotion.shimmer : { opacity: 0.025, x: 0 }}
        transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.shimmer, repeat: Infinity, ease: "easeInOut" }}
        style={{
          mixBlendMode: "screen",
        }}
      />

      <motion.div
        className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/14 bg-slate-950/55 px-3 py-2 backdrop-blur-xl"
        animate={motionEnabled ? { opacity: [0.78, 0.92, 0.78] } : { opacity: 0.85 }}
        transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.badge, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-4 w-4 text-cyan-200" />
        <span className="astra-ui-label text-[0.65rem] text-cyan-100/70">Astra visual system</span>
      </motion.div>

      <div className="absolute right-4 top-4 flex w-[9.5rem] flex-col gap-2">
        {monitorCards.map((card, index) => (
          <motion.div
            key={card.label}
            className="rounded-2xl border border-cyan-300/10 bg-slate-950/42 px-3 py-2 backdrop-blur-xl"
            animate={
              motionEnabled
                ? {
                    opacity: [0.22 + index * 0.03, 0.34 + index * 0.03, 0.22 + index * 0.03],
                    y: [0, -1, 0],
                  }
                : { opacity: 0.28 }
            }
            transition={{
              duration: ASTRA_VISUAL_PANEL_MOTION.cardBase + index * ASTRA_VISUAL_PANEL_MOTION.cardStep,
              delay: card.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="astra-ui-label text-[0.58rem] text-cyan-100/40">{card.label}</span>
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.55)]"
                animate={motionEnabled ? { opacity: [0.35, 0.92, 0.35], scale: [0.92, 1.12, 0.92] } : { opacity: 0.7, scale: 1 }}
                transition={{ duration: 7.5 + index * 1.7, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="mt-1 text-[0.78rem] text-cyan-50/84">{card.value}</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className={cn("h-full rounded-full bg-cyan-300/55", card.width)}
                animate={motionEnabled ? { opacity: [0.42, 0.82, 0.42], x: [0, 1, 0] } : { opacity: 0.7 }}
                transition={{ duration: 12 + index * 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-x-4 bottom-4 grid gap-2 sm:grid-cols-2">
        <motion.div
          className="rounded-2xl border border-cyan-300/10 bg-slate-950/58 px-3 py-2 backdrop-blur-xl"
          animate={motionEnabled ? { opacity: [0.72, 0.9, 0.72] } : { opacity: 0.82 }}
          transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.signal, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="astra-ui-label text-[0.62rem] text-cyan-100/45">Signal</span>
            <motion.span
              className="h-3.5 w-3.5 rounded-full border border-cyan-200/30 bg-cyan-300/35"
              animate={motionEnabled ? { opacity: [0.32, 0.72, 0.32], scale: [0.94, 1.08, 0.94] } : { opacity: 0.55, scale: 1 }}
              transition={{ duration: 6.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="mt-1 text-sm text-cyan-50/82">Quiet, continuous, and readable.</p>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-cyan-300/10 bg-slate-950/58 px-3 py-2 backdrop-blur-xl"
          animate={motionEnabled ? { opacity: [0.72, 0.9, 0.72] } : { opacity: 0.82 }}
          transition={{ duration: ASTRA_VISUAL_PANEL_MOTION.telemetry, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="astra-ui-label text-[0.62rem] text-cyan-100/45">Telemetry</span>
            <motion.span
              className="h-3.5 w-3.5 rounded-full border border-cyan-200/30 bg-cyan-300/30"
              animate={motionEnabled ? { opacity: [0.28, 0.68, 0.28], scale: [0.94, 1.1, 0.94] } : { opacity: 0.5, scale: 1 }}
              transition={{ duration: 7.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="mt-1 text-sm text-cyan-50/82">Session checks complete.</p>
        </motion.div>
      </div>
    </div>
  );
}

export default AstraVisualPanel;
