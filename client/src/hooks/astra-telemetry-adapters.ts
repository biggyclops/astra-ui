import type {
  AstraGatewayTelemetrySnapshot,
  AstraTelemetrySignals,
  GpuActivitySignal,
  HermesTransferSignal,
  RoboticsHeartbeatSignal,
  SecurityAlertSignal,
  VoiceRecordingSignal,
} from "@/hooks/astra-telemetry";

export type AstraGatewayAdapterInput = {
  gatewayId: string;
  timestamp?: string;
  gpu?: {
    active?: boolean;
    utilization?: number;
    vramUsed?: number;
    vramTotal?: number;
    intensityScale?: number;
  } | null;
  voice?: {
    active?: boolean;
    recording?: boolean;
    transcribing?: boolean;
    durationMs?: number;
    intensityScale?: number;
  } | null;
  robotics?: {
    active?: boolean;
    heartbeatMs?: number;
    latencyMs?: number;
    nodeId?: string;
    intensityScale?: number;
  } | null;
  security?: {
    active?: boolean;
    severity?: "low" | "medium" | "high";
    code?: string;
    intensityScale?: number;
  } | null;
  transfer?: {
    active?: boolean;
    direction?: "upload" | "download" | "sync";
    bytesTransferred?: number;
    bytesTotal?: number;
    transferId?: string;
    intensityScale?: number;
  } | null;
  nodeHealth?: Array<{
    nodeId: string;
    online?: boolean;
    latencyMs?: number | null;
    healthy?: boolean;
  }>;
};

function normalizeGpu(signal?: AstraGatewayAdapterInput["gpu"] | null): GpuActivitySignal | null {
  if (!signal) return null;
  return {
    active: signal.active,
    utilization: signal.utilization,
    vramUsed: signal.vramUsed,
    vramTotal: signal.vramTotal,
    intensityScale: signal.intensityScale,
  };
}

function normalizeVoice(signal?: AstraGatewayAdapterInput["voice"] | null): VoiceRecordingSignal | null {
  if (!signal) return null;
  return {
    active: signal.active,
    recording: signal.recording,
    transcribing: signal.transcribing,
    durationMs: signal.durationMs,
    intensityScale: signal.intensityScale,
  };
}

function normalizeRobotics(signal?: AstraGatewayAdapterInput["robotics"] | null): RoboticsHeartbeatSignal | null {
  if (!signal) return null;
  return {
    active: signal.active,
    heartbeatMs: signal.heartbeatMs,
    latencyMs: signal.latencyMs,
    nodeId: signal.nodeId,
    intensityScale: signal.intensityScale,
  };
}

function normalizeSecurity(signal?: AstraGatewayAdapterInput["security"] | null): SecurityAlertSignal | null {
  if (!signal) return null;
  return {
    active: signal.active,
    severity: signal.severity,
    code: signal.code,
    intensityScale: signal.intensityScale,
  };
}

function normalizeTransfer(signal?: AstraGatewayAdapterInput["transfer"] | null): HermesTransferSignal | null {
  if (!signal) return null;
  return {
    active: signal.active,
    direction: signal.direction,
    bytesTransferred: signal.bytesTransferred,
    bytesTotal: signal.bytesTotal,
    transferId: signal.transferId,
    intensityScale: signal.intensityScale,
  };
}

export function mapGatewayTelemetryToSignals(input: AstraGatewayAdapterInput): AstraGatewayTelemetrySnapshot {
  return {
    gatewayId: input.gatewayId,
    timestamp: input.timestamp,
    gpu: normalizeGpu(input.gpu),
    voice: normalizeVoice(input.voice),
    robotics: normalizeRobotics(input.robotics),
    security: normalizeSecurity(input.security),
    transfer: normalizeTransfer(input.transfer),
    nodeHealth: input.nodeHealth,
  };
}

export function extractOperationalSignals(input: AstraGatewayAdapterInput): AstraTelemetrySignals {
  const snapshot = mapGatewayTelemetryToSignals(input);
  return {
    gpuActive: snapshot.gpu?.active,
    voiceActive: snapshot.voice?.active,
    roboticsActive: snapshot.robotics?.active,
    securityAlert: snapshot.security?.active,
    transferActive: snapshot.transfer?.active,
    intensityScale: Math.min(
      1,
      ...[
        snapshot.gpu?.intensityScale,
        snapshot.voice?.intensityScale,
        snapshot.robotics?.intensityScale,
        snapshot.security?.intensityScale,
        snapshot.transfer?.intensityScale,
      ].filter((value): value is number => typeof value === "number")
    ) || 1,
    gpu: snapshot.gpu ?? undefined,
    voice: snapshot.voice ?? undefined,
    robotics: snapshot.robotics ?? undefined,
    security: snapshot.security ?? undefined,
    transfer: snapshot.transfer ?? undefined,
  };
}
