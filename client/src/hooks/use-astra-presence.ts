import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { ASTRA_PRESENCE_LOW_POWER_INTENSITY, ASTRA_PRESENCE_MIN_INTENSITY, ASTRA_PRESENCE_REACTIVE_INTENSITY } from "@/components/astra-motion";
import type {
  AstraTelemetrySignals,
} from "@/hooks/astra-telemetry";

export type AstraPresenceState = "idle" | "voice" | "gpu" | "security" | "robotics" | "transfer";

export type AstraPresenceSignals = {
  voiceActive?: boolean;
  gpuActive?: boolean;
  securityAlert?: boolean;
  roboticsActive?: boolean;
  transferActive?: boolean;
  intensityScale?: number;
  reactiveMotionEnabled?: boolean;
} & AstraTelemetrySignals;

export type AstraPresenceConfig = {
  state: AstraPresenceState;
  reducedMotion: boolean;
  lowPowerMode: boolean;
  reactiveMotionEnabled: boolean;
  intensity: number;
  style: CSSProperties;
};

export type AstraPresenceOptions = {
  reactiveMotionEnabled?: boolean;
};

const STATE_THEME: Record<AstraPresenceState, { accent: string; accentSoft: string; secondary: string }> = {
  idle: { accent: "34 211 238", accentSoft: "125 211 252", secondary: "59 130 246" },
  voice: { accent: "56 189 248", accentSoft: "103 232 249", secondary: "34 211 238" },
  gpu: { accent: "245 158 11", accentSoft: "251 191 36", secondary: "251 146 60" },
  security: { accent: "248 113 113", accentSoft: "239 68 68", secondary: "190 18 60" },
  robotics: { accent: "74 222 128", accentSoft: "34 211 238", secondary: "34 197 94" },
  transfer: { accent: "103 232 249", accentSoft: "34 211 238", secondary: "56 189 248" },
};

type AstraPresenceSource = {
  sourceId: string;
  signals: AstraPresenceSignals;
};

const presenceSources = new Map<string, AstraPresenceSource>();
const presenceListeners = new Set<() => void>();
let presenceVersion = 0;

function notifyPresenceListeners() {
  presenceVersion += 1;
  presenceListeners.forEach((listener) => listener());
}

export function publishAstraPresenceSource(sourceId: string, signals: AstraPresenceSignals) {
  presenceSources.set(sourceId, { sourceId, signals });
  notifyPresenceListeners();
}

export function clearAstraPresenceSource(sourceId: string) {
  if (presenceSources.delete(sourceId)) {
    notifyPresenceListeners();
  }
}

function subscribePresenceStore(listener: () => void) {
  presenceListeners.add(listener);
  return () => presenceListeners.delete(listener);
}

function getPresenceSnapshot() {
  return presenceVersion;
}

function usePresenceStoreVersion() {
  return useSyncExternalStore(subscribePresenceStore, getPresenceSnapshot, getPresenceSnapshot);
}

function resolveState(signals: AstraPresenceSignals): AstraPresenceState {
  if (signals.securityAlert || signals.security?.active) return "security";
  if (signals.gpuActive || signals.gpu?.active) return "gpu";
  if (signals.transferActive || signals.transfer?.active) return "transfer";
  if (signals.roboticsActive || signals.robotics?.active) return "robotics";
  if (signals.voiceActive || signals.voice?.active) return "voice";
  return "idle";
}

function isSignalEnabled(signal?: { reactiveMotionEnabled?: boolean } | null) {
  return signal?.reactiveMotionEnabled !== false;
}

function resolveIntensityScale(signals: AstraPresenceSignals) {
  const candidates = [
    signals.intensityScale,
    signals.voice?.intensityScale,
    signals.gpu?.intensityScale,
    signals.robotics?.intensityScale,
    signals.security?.intensityScale,
    signals.transfer?.intensityScale,
  ].filter((value): value is number => typeof value === "number");

  return candidates.length > 0 ? Math.min(...candidates) : 1;
}

function mergeSignals(signals: AstraPresenceSignals = {}): AstraPresenceSignals {
  const merged: AstraPresenceSignals = { ...signals };
  let scale = signals.intensityScale ?? 1;
  const sources = Array.from(presenceSources.values());

  for (const entry of sources) {
    const source = entry.signals;
    merged.voiceActive = merged.voiceActive || source.voiceActive || source.voice?.active;
    merged.gpuActive = merged.gpuActive || source.gpuActive || source.gpu?.active;
    merged.securityAlert = merged.securityAlert || source.securityAlert || source.security?.active;
    merged.roboticsActive = merged.roboticsActive || source.roboticsActive || source.robotics?.active;
    merged.transferActive = merged.transferActive || source.transferActive || source.transfer?.active;
    scale = Math.min(scale, resolveIntensityScale(source));
    if (typeof source.intensityScale === "number") {
      scale = Math.min(scale, source.intensityScale);
    }
  }

  merged.intensityScale = scale;
  merged.reactiveMotionEnabled =
    signals.reactiveMotionEnabled !== false &&
    isSignalEnabled(signals.voice) &&
    isSignalEnabled(signals.gpu) &&
    isSignalEnabled(signals.robotics) &&
    isSignalEnabled(signals.security) &&
    isSignalEnabled(signals.transfer) &&
    sources.every((entry) => entry.signals.reactiveMotionEnabled !== false);
  return merged;
}

export function useAstraPresence(signals: AstraPresenceSignals = {}, options: AstraPresenceOptions = {}): AstraPresenceConfig {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  usePresenceStoreVersion();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeQuery = window.matchMedia("(max-width: 640px)");
    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        addEventListener?: (type: string, listener: () => void) => void;
        removeEventListener?: (type: string, listener: () => void) => void;
      };
    }).connection;

    const updateMotion = () => setReducedMotion(motionQuery.matches);
    const updateLowPower = () => setLowPowerMode(Boolean(connection?.saveData) || sizeQuery.matches);

    updateMotion();
    updateLowPower();

    motionQuery.addEventListener("change", updateMotion);
    sizeQuery.addEventListener("change", updateLowPower);
    connection?.addEventListener?.("change", updateLowPower);

    return () => {
      motionQuery.removeEventListener("change", updateMotion);
      sizeQuery.removeEventListener("change", updateLowPower);
      connection?.removeEventListener?.("change", updateLowPower);
    };
  }, []);

  const resolvedSignals = useMemo(() => mergeSignals(signals), [signals, presenceVersion]);
  const reactiveMotionEnabled = options.reactiveMotionEnabled !== false && resolvedSignals.reactiveMotionEnabled !== false;
  const state = reactiveMotionEnabled ? resolveState(resolvedSignals) : "idle";

  return useMemo(() => {
    const theme = STATE_THEME[state];
    const baseIntensity = reducedMotion || lowPowerMode ? ASTRA_PRESENCE_LOW_POWER_INTENSITY : 1;
    const motionScale = reactiveMotionEnabled ? (resolvedSignals.intensityScale ?? 1) : ASTRA_PRESENCE_REACTIVE_INTENSITY;
    const intensity = Math.max(ASTRA_PRESENCE_MIN_INTENSITY, Math.min(1, baseIntensity * motionScale));

    return {
      state,
      reducedMotion,
      lowPowerMode,
      reactiveMotionEnabled,
      intensity,
      style: {
        "--astra-presence-intensity": String(intensity),
        "--astra-presence-accent": theme.accent,
        "--astra-presence-accent-soft": theme.accentSoft,
        "--astra-presence-secondary": theme.secondary,
        "--astra-presence-breath-duration": "10.5s",
        "--astra-presence-scan-duration": "12.5s",
        "--astra-presence-edge-duration": "12.8s",
        "--astra-presence-sweep-duration": "14s",
        "--astra-presence-grid-duration": "12.2s",
        "--astra-presence-particle-duration": "6.4s",
        "--astra-presence-transfer-duration": "12.5s",
      } as CSSProperties,
    };
  }, [state, reducedMotion, lowPowerMode, resolvedSignals.intensityScale, reactiveMotionEnabled]);
}

export function useAstraPresenceSource(sourceId: string, signals: AstraPresenceSignals, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      clearAstraPresenceSource(sourceId);
      return;
    }

    publishAstraPresenceSource(sourceId, signals);
    return () => clearAstraPresenceSource(sourceId);
  }, [sourceId, enabled, signals]);
}
