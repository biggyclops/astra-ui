import { useAstraPresenceSource } from "@/hooks/use-astra-presence";

type AstraSignalFragment = {
  active?: boolean;
  intensityScale?: number;
  reactiveMotionEnabled?: boolean;
};

export type GpuActivitySignal = AstraSignalFragment & {
  utilization?: number;
  vramUsed?: number;
  vramTotal?: number;
};

export type VoiceRecordingSignal = AstraSignalFragment & {
  recording?: boolean;
  transcribing?: boolean;
  durationMs?: number;
};

export type RoboticsHeartbeatSignal = AstraSignalFragment & {
  heartbeatMs?: number;
  latencyMs?: number;
  nodeId?: string;
};

export type SecurityAlertSignal = AstraSignalFragment & {
  severity?: "low" | "medium" | "high";
  code?: string;
};

export type HermesTransferSignal = AstraSignalFragment & {
  direction?: "upload" | "download" | "sync";
  bytesTransferred?: number;
  bytesTotal?: number;
  transferId?: string;
};

export type AstraTelemetrySignals = {
  voiceActive?: boolean;
  gpuActive?: boolean;
  securityAlert?: boolean;
  roboticsActive?: boolean;
  transferActive?: boolean;
  intensityScale?: number;
  reactiveMotionEnabled?: boolean;
  gpu?: GpuActivitySignal;
  voice?: VoiceRecordingSignal;
  robotics?: RoboticsHeartbeatSignal;
  security?: SecurityAlertSignal;
  transfer?: HermesTransferSignal;
};

export type AstraGatewayTelemetrySnapshot = {
  gatewayId: string;
  timestamp?: string;
  gpu?: GpuActivitySignal | null;
  voice?: VoiceRecordingSignal | null;
  robotics?: RoboticsHeartbeatSignal | null;
  security?: SecurityAlertSignal | null;
  transfer?: HermesTransferSignal | null;
  nodeHealth?: Array<{
    nodeId: string;
    online?: boolean;
    latencyMs?: number | null;
    healthy?: boolean;
  }>;
};

function usePublishTelemetrySignal(sourceId: string, signals: AstraTelemetrySignals, enabled = true) {
  useAstraPresenceSource(sourceId, signals, enabled);
}

function mapSnapshotToSignals(snapshot: AstraGatewayTelemetrySnapshot): AstraTelemetrySignals {
  return {
    voiceActive: snapshot.voice?.active,
    gpuActive: snapshot.gpu?.active,
    securityAlert: snapshot.security?.active,
    roboticsActive: snapshot.robotics?.active,
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

export function useGpuActivity(sourceId: string, signal: GpuActivitySignal | null, enabled = true) {
  usePublishTelemetrySignal(sourceId, { gpu: signal ?? undefined, gpuActive: signal?.active, intensityScale: signal?.intensityScale }, enabled);
}

export function useVoiceRecordingState(sourceId: string, signal: VoiceRecordingSignal | null, enabled = true) {
  usePublishTelemetrySignal(sourceId, { voice: signal ?? undefined, voiceActive: signal?.active, intensityScale: signal?.intensityScale }, enabled);
}

export function useRoboticsHeartbeat(sourceId: string, signal: RoboticsHeartbeatSignal | null, enabled = true) {
  usePublishTelemetrySignal(sourceId, { robotics: signal ?? undefined, roboticsActive: signal?.active, intensityScale: signal?.intensityScale }, enabled);
}

export function useSecurityAlert(sourceId: string, signal: SecurityAlertSignal | null, enabled = true) {
  usePublishTelemetrySignal(sourceId, { security: signal ?? undefined, securityAlert: signal?.active, intensityScale: signal?.intensityScale }, enabled);
}

export function useHermesTransferActivity(sourceId: string, signal: HermesTransferSignal | null, enabled = true) {
  usePublishTelemetrySignal(sourceId, { transfer: signal ?? undefined, transferActive: signal?.active, intensityScale: signal?.intensityScale }, enabled);
}

export function useOperationalTelemetrySource(sourceId: string, signals: AstraTelemetrySignals, enabled = true) {
  usePublishTelemetrySignal(sourceId, signals, enabled);
}

export function useAstraGatewayTelemetry(sourceId: string, snapshot: AstraGatewayTelemetrySnapshot | null, enabled = true) {
  usePublishTelemetrySignal(sourceId, snapshot ? mapSnapshotToSignals(snapshot) : {}, enabled);
}

export function toAstraGatewaySignals(snapshot: AstraGatewayTelemetrySnapshot | null): AstraTelemetrySignals {
  return snapshot ? mapSnapshotToSignals(snapshot) : {};
}
