export type Tone = "calm" | "direct" | "dry" | "friendly";
export type DefaultSort = "newest" | "oldest";
export type DefaultFilter = "all" | "videos" | "images";
export type HistoryRetention = "24h" | "7d" | "30d";

export interface NodeRegistryEntry {
  id: string;
  name: string;
  baseUrl: string;
}

export interface AstraSettings {
  identity: {
    name: string;
    tone: Tone;
    loreMode: boolean;
  };
  nodesNetwork: {
    registry: NodeRegistryEntry[];
    defaultLlmNode: string;
    defaultRenderNode: string;
    defaultStorageNode: string;
    requireApproval: boolean;
  };
  mediaWall: {
    ambientLoop: boolean;
    maxSimultaneousVideos: number;
    autoplayOnHover: boolean;
    showLabels: boolean;
    defaultSort: DefaultSort;
    defaultFilter: DefaultFilter;
  };
  jobs: {
    maxConcurrentJobs: number;
    autoOpenOutput: boolean;
    keepHistory: HistoryRetention;
  };
  voice: {
    pushToTalk: boolean;
    wakeWord: boolean;
    voiceOutput: boolean;
  };
}

export const defaultSettings: AstraSettings = {
  identity: {
    name: "Astra",
    tone: "calm",
    loreMode: true,
  },
  nodesNetwork: {
    registry: [
      { id: "node-kratos", name: "Kratos", baseUrl: "http://localhost:11434" },
      { id: "node-hades", name: "Hades", baseUrl: "http://localhost:8188" },
      { id: "node-hermes", name: "Hermes", baseUrl: "http://localhost:9000" },
    ],
    defaultLlmNode: "node-kratos",
    defaultRenderNode: "node-hades",
    defaultStorageNode: "node-hermes",
    requireApproval: true,
  },
  mediaWall: {
    ambientLoop: false,
    maxSimultaneousVideos: 6,
    autoplayOnHover: true,
    showLabels: true,
    defaultSort: "newest",
    defaultFilter: "all",
  },
  jobs: {
    maxConcurrentJobs: 1,
    autoOpenOutput: true,
    keepHistory: "7d",
  },
  voice: {
    pushToTalk: false,
    wakeWord: false,
    voiceOutput: false,
  },
};

export const SETTINGS_STORAGE_KEY = "astra-settings";
