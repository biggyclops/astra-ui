import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useAstraPresence, type AstraPresenceSignals, type AstraPresenceState } from "@/hooks/use-astra-presence";
import { ASTRA_DASH_IMAGE, ASTRA_LOGIN_IMAGE } from "./astra-assets";
import { ASTRA_PRESENCE_MOTION } from "./astra-motion";
import "./astra-presence.css";

type AstraPresenceVariant = "login" | "dashboard";

type AstraPresenceProps = {
  variant: AstraPresenceVariant;
  signals?: AstraPresenceSignals;
  reactiveMotionEnabled?: boolean;
  className?: string;
};

const edgeParticles = [
  { top: "10%", left: "11%", size: 1.5, delay: 0 },
  { top: "18%", left: "87%", size: 1.4, delay: 1.1 },
  { top: "68%", left: "9%", size: 1.5, delay: 0.8 },
  { top: "88%", left: "79%", size: 1.3, delay: 1.6 },
];

const dashboardParticles = [
  { top: "14%", left: "12%", size: 1.2, delay: 0.9 },
  { top: "84%", left: "86%", size: 1.1, delay: 2.1 },
];

function stateClass(state: AstraPresenceState) {
  return {
    idle: "astra-presence--idle",
    voice: "astra-presence--voice",
    gpu: "astra-presence--gpu",
    security: "astra-presence--security",
    robotics: "astra-presence--robotics",
    transfer: "astra-presence--transfer",
  }[state];
}

export function AstraPresence({ variant, signals, reactiveMotionEnabled = true, className }: AstraPresenceProps) {
  const presence = useAstraPresence(signals, { reactiveMotionEnabled });
  const isDashboard = variant === "dashboard";
  const timing = isDashboard ? ASTRA_PRESENCE_MOTION.dashboard : ASTRA_PRESENCE_MOTION.login;
  const motionDisabled = !presence.reactiveMotionEnabled;
  const isTransfer = presence.state === "transfer";
  const rootStyle = {
    ...presence.style,
    "--astra-presence-breath-duration": `${timing.image}s`,
    "--astra-presence-scan-duration": `${timing.scan}s`,
    "--astra-presence-edge-duration": `${timing.edge}s`,
    "--astra-presence-sweep-duration": `${timing.sweep}s`,
    "--astra-presence-particle-duration": `${timing.particles}s`,
    "--astra-presence-transfer-duration": `${timing.transfer}s`,
  } as CSSProperties;
  const rootClassName = cn(
    "astra-presence-root",
    stateClass(presence.state),
    isDashboard ? "astra-presence-dashboard pointer-events-none absolute inset-0 z-0 overflow-hidden" : "astra-presence-login relative isolate overflow-hidden rounded-[1rem]",
    className
  );

  const imageClassName = cn(
    "astra-presence-image absolute inset-0 h-full w-full object-center",
    isDashboard ? "object-contain astra-presence-image--dashboard" : "object-cover astra-presence-image--login"
  );

  const imageMotion = presence.reducedMotion
    ? { scale: 1, y: 0, x: 0 }
    : motionDisabled
      ? { scale: 1, y: 0, x: 0 }
      : isDashboard
      ? { scale: [1, 1.004, 1], y: [0, -1, 0], x: [0, 0.4, 0] }
      : { scale: [1, 1.01, 1.015, 1.01, 1], y: [0, -2, -3, -2, 0], x: [0, 0.5, 0, -0.5, 0] };

  const imageFilter = {
    idle: isDashboard ? "saturate(0.9) contrast(1.04) brightness(0.82)" : "saturate(0.92) contrast(1.06) brightness(0.88)",
    voice: isDashboard ? "saturate(0.98) contrast(1.08) brightness(0.88)" : "saturate(0.98) contrast(1.08) brightness(0.92)",
    gpu: isDashboard ? "saturate(0.92) contrast(1.08) brightness(0.86)" : "saturate(0.96) contrast(1.08) brightness(0.88)",
    security: isDashboard ? "saturate(0.84) contrast(1.12) brightness(0.78)" : "saturate(0.9) contrast(1.12) brightness(0.82)",
    robotics: isDashboard ? "saturate(0.94) contrast(1.04) brightness(0.84)" : "saturate(0.92) contrast(1.04) brightness(0.86)",
    transfer: isDashboard ? "saturate(0.92) contrast(1.03) brightness(0.8)" : "saturate(0.92) contrast(1.04) brightness(0.84)",
  }[presence.state];

  return (
    <div className={rootClassName} data-astra-state={presence.state} aria-hidden="true" role="presentation" style={rootStyle}>
      <div className="astra-presence-haze absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_78%_68%,rgba(59,130,246,0.08),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.16)_40%,rgba(2,6,23,0.68)_100%)]" />

      <motion.div
        className={cn(
          "astra-presence-image-wrap absolute inset-0",
          isDashboard ? "hidden md:block" : "block"
        )}
        animate={
          presence.reducedMotion || motionDisabled
            ? undefined
            : isDashboard
              ? { y: [0, -1, 0], scale: [1, 1.001, 1] }
              : { y: [0, -2, 0], scale: [1, 1.002, 1] }
        }
        transition={{ duration: timing.wrapper, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.img
          src={isDashboard ? ASTRA_DASH_IMAGE : ASTRA_LOGIN_IMAGE}
          alt="Astra visual system"
          className={imageClassName}
          animate={imageMotion}
          transition={{ duration: timing.image, repeat: Infinity, ease: "easeInOut" }}
          style={
            {
              filter: imageFilter,
            } as CSSProperties
          }
        />
      </motion.div>

      <div className="astra-presence-depth absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_42%,rgba(2,6,23,0.08)_60%,rgba(2,6,23,0.64)_100%)]" />

      <motion.div
        className="astra-presence-scan absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.03)_1px,transparent_1px)] bg-[length:100%_8px] opacity-20 mix-blend-screen"
        style={{
          WebkitMaskImage: "radial-gradient(circle at center, transparent 48%, black 82%)",
          maskImage: "radial-gradient(circle at center, transparent 48%, black 82%)",
        }}
          animate={
            presence.reducedMotion || motionDisabled
              ? { opacity: 0.05 }
              : isDashboard
                ? { opacity: [0.04, 0.08, 0.04], y: [0, 1, 0] }
              : isTransfer
                ? { opacity: [0.03, 0.06, 0.03], y: [0, 1, 0] }
                : { opacity: [0.06, 0.12, 0.06], y: [0, 2, 0] }
        }
        transition={{ duration: timing.scan, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="astra-presence-edge absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_50%_84%,rgba(34,211,238,0.05),transparent_22%),linear-gradient(180deg,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.04)_26%,rgba(2,6,23,0.42)_100%)]"
        animate={
          presence.reducedMotion || motionDisabled
            ? { opacity: 0.24 }
            : isDashboard
              ? { opacity: [0.12, 0.2, 0.12] }
              : isTransfer
                ? { opacity: [0.08, 0.14, 0.08] }
                : { opacity: [0.18, 0.3, 0.18] }
        }
        transition={{ duration: timing.edge, repeat: Infinity, ease: "easeInOut" }}
      />

      {presence.state === "voice" && (
        <motion.div
          className="astra-presence-wave absolute inset-x-[18%] bottom-[14%] h-8 rounded-full bg-[radial-gradient(circle_at_center,rgba(125,211,252,0.32),transparent_72%)] opacity-0"
          animate={presence.reducedMotion ? { opacity: 0.05 } : { opacity: [0, 0.08, 0], scaleX: [0.96, 1, 0.96] }}
          transition={{ duration: timing.voice, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {presence.state === "gpu" && (
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_78%,rgba(251,146,60,0.12),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(245,158,11,0.1),transparent_18%)]"
          animate={presence.reducedMotion ? { opacity: 0.12 } : { opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: timing.gpu, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {presence.state === "security" && (
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_44%,rgba(248,113,113,0.1)_74%,rgba(127,29,29,0.24)_100%)]"
          animate={presence.reducedMotion ? { opacity: 0.12 } : { opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: timing.security, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {presence.state === "robotics" && (
        <motion.div
          className="astra-presence-grid absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.03)_1px,transparent_1px)] bg-[length:100%_10px,10px_100%]"
          animate={presence.reducedMotion ? { opacity: 0.08 } : { opacity: [0.05, 0.14, 0.05], y: [0, -1, 0] }}
          transition={{ duration: timing.robotics, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="absolute inset-0 overflow-hidden">
        {(isDashboard ? dashboardParticles : edgeParticles).map((particle, index) => (
          <motion.span
            key={`${particle.top}-${particle.left}`}
            className={cn(
              "astra-presence-particle absolute rounded-full bg-cyan-200/70 shadow-[0_0_10px_rgba(34,211,238,0.35)]",
              index % 2 === 0 ? "hidden sm:block" : ""
            )}
            style={
              {
                top: particle.top,
                left: particle.left,
                width: particle.size,
                height: particle.size,
                animationDelay: `${particle.delay}s`,
              } as CSSProperties
            }
            animate={
              presence.reducedMotion || motionDisabled
                ? { opacity: 0.05, scale: 1 }
                : isDashboard
                  ? { opacity: [0.015, 0.08, 0.015], scale: [0.98, 1.04, 0.98], y: [0, -1, 0] }
                  : isTransfer
                    ? { opacity: [0.01, 0.08, 0.01], scale: [0.98, 1.02, 0.98], x: [0, 2, 0], y: [0, -1, 0] }
                    : { opacity: [0.02, 0.18, 0.02], scale: [0.95, 1.12, 0.95], y: [0, -1, 0] }
            }
            transition={{ duration: timing.particles + index * 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {isTransfer && (
        <motion.div
          className="astra-presence-transfer absolute inset-0 bg-[radial-gradient(circle_at_18%_50%,rgba(103,232,249,0.08),transparent_24%),radial-gradient(circle_at_82%_50%,rgba(125,211,252,0.05),transparent_22%)]"
          animate={presence.reducedMotion || motionDisabled ? { opacity: 0.04 } : { opacity: [0.02, 0.08, 0.02], x: [-1, 1, -1] }}
          transition={{ duration: timing.transfer, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {isDashboard ? (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,22,0.14)_0%,rgba(3,8,22,0.08)_34%,rgba(3,8,22,0.24)_68%,rgba(3,8,22,0.64)_100%)]" />
      ) : (
        <motion.div
          className="astra-presence-sweep absolute inset-0 bg-[linear-gradient(120deg,transparent_38%,rgba(125,211,252,0.10)_50%,transparent_62%)] opacity-0"
          animate={
            presence.reducedMotion || motionDisabled
              ? { opacity: 0.03 }
              : isTransfer
                ? { opacity: [0, 0.03, 0], x: ["-2%", "2%", "5%"] }
                : { opacity: [0, 0.05, 0], x: ["-4%", "1%", "5%"] }
          }
          transition={{ duration: timing.sweep, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

export default AstraPresence;
