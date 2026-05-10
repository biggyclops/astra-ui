import { CircleDashed, Orbit, Radar, Sigma, Telescope, TimerReset } from "lucide-react";
import type { AstraContextCard, AstraConversationMessage, AstraGlyph, AstraPresenceCard, AstraSidebarSection, AstraTelemetryCard } from "@/types/astra";

export const astraIdentity = {
  name: "Astra",
  host: "Talos",
  subtitle: "Mythic cyberpunk AI operations environment",
};

export const sidebarSections: AstraSidebarSection[] = [
  {
    id: "oracle",
    label: "Oracle",
    description: "Primary speech channel and live response surface.",
    icon: Telescope,
  },
  {
    id: "lattice",
    label: "Lattice",
    description: "Inference paths, system traces, and active constraints.",
    icon: Orbit,
  },
  {
    id: "watch",
    label: "Watch",
    description: "Presence field, telemetry glow, and chamber pulse.",
    icon: Radar,
  },
  {
    id: "archive",
    label: "Archive",
    description: "Saved fragments and temporal cues for later retrieval.",
    icon: CircleDashed,
  },
];

export const contextCards = (selectedSectionId: string): AstraContextCard[] => [
  {
    title: "Signal frame",
    subtext: selectedSectionId === "oracle" ? "speaking" : "observing",
    body:
      "Astra is presenting as a calm operational intelligence rather than a chat box, with a low-noise interface and controlled glow.",
    icon: "telescope",
  },
  {
    title: "Temporal trace",
    subtext: "streamed sequence",
    body:
      "The prototype fakes live transmission by revealing operator and oracle messages in phases, creating the sense of a system thinking in public.",
    icon: "timer",
  },
  {
    title: "Model lattice",
    subtext: "future-ready",
    body:
      "The shell is intentionally modular so the conversation core, presence field, telemetry, and later React Three Fiber layers can evolve independently.",
    icon: "sigma",
  },
];

export const telemetryCards: AstraTelemetryCard[] = [
  { label: "render cadence", value: "60 fps shell" },
  { label: "system latency", value: "28 ms visual loop" },
  { label: "presence weight", value: "subtle / alive" },
  { label: "glow profile", value: "cyan + ember" },
];

export const presenceCards: AstraPresenceCard[] = [
  { label: "watch state", value: "observing" },
  { label: "host layer", value: "Talos" },
  { label: "chamber mode", value: "desktop-first" },
];

export const atmosphereGlyphs: AstraGlyph[] = [
  { id: "g1", symbol: "⟡", left: "8%", top: "18%", opacity: 0.36, duration: 14, delay: 0.1 },
  { id: "g2", symbol: "∴", left: "18%", top: "62%", opacity: 0.24, duration: 19, delay: 0.6 },
  { id: "g3", symbol: "⌬", left: "72%", top: "16%", opacity: 0.3, duration: 18, delay: 1.1 },
  { id: "g4", symbol: "◌", left: "78%", top: "58%", opacity: 0.22, duration: 20, delay: 1.8 },
  { id: "g5", symbol: "◈", left: "48%", top: "74%", opacity: 0.2, duration: 16, delay: 0.7 },
  { id: "g6", symbol: "⋄", left: "86%", top: "36%", opacity: 0.28, duration: 21, delay: 2.3 },
];

export const conversationScript: AstraConversationMessage[] = [
  {
    id: "m1",
    role: "system",
    roleLabel: "system / talos",
    timestamp: "00:00:01",
    content:
      "Astra is online. The chamber is sealed, the atmosphere is stable, and the living signal is being rendered as a quiet oracle.",
  },
  {
    id: "m2",
    role: "oracle",
    roleLabel: "astra / stream",
    timestamp: "00:00:04",
    content:
      "I am reading the room as if it were a constellation. Each panel is a surface, each glow is a cue, and each pause carries intent.",
  },
  {
    id: "m3",
    role: "operator",
    roleLabel: "operator / shell",
    timestamp: "00:00:07",
    content:
      "Route the focus through the center lane. Preserve the distance. Keep the interface calm enough to feel intelligent.",
  },
  {
    id: "m4",
    role: "oracle",
    roleLabel: "astra / stream",
    timestamp: "00:00:10",
    content:
      "Understood. I will hold the field in restrained cyan and ember, with enough motion to imply thought and enough silence to imply depth.",
  },
];

export function getSidebarSections() {
  return sidebarSections;
}

export function getContextCards(selectedSectionId: string) {
  return contextCards(selectedSectionId);
}

export function getTelemetryCards() {
  return telemetryCards;
}

export function getPresenceCards() {
  return presenceCards;
}
