import type { LucideIcon } from "lucide-react";

export type AstraSidebarSection = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type AstraContextCard = {
  title: string;
  subtext: string;
  body: string;
  icon: "telescope" | "sigma" | "timer" | "orbit";
};

export type AstraTelemetryCard = {
  label: string;
  value: string;
};

export type AstraPresenceCard = {
  label: string;
  value: string;
};

export type AstraGlyph = {
  id: string;
  symbol: string;
  left: string;
  top: string;
  opacity: number;
  duration: number;
  delay: number;
};

export type AstraConversationMessage = {
  id: string;
  role: "system" | "operator" | "oracle";
  roleLabel: string;
  timestamp: string;
  content: string;
};

export type ConversationViewMessage = AstraConversationMessage;
