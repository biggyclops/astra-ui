import { useQuery } from "@tanstack/react-query";

export type AutonomyJob = {
  id: string;
  title: string;
  type: string;
  node: string;
  status: "queued" | "running" | "done" | "failed" | "unknown";
  progress: number;
  etaSeconds: number | null;
  source: "status" | "queue" | "history";
  rawStatus?: string;
};

export type AutonomySnapshot = {
  generatedAt: string;
  hadesReachable: boolean;
  hadesError: string | null;
  orbState: "idle" | "working" | "offline";
  working: AutonomyJob | null;
  queue: AutonomyJob[];
  history: AutonomyJob[];
  advisor: {
    topRecommendation: string | null;
    currentAdvisories: string[];
    summary: string | null;
  };
  fleet: {
    nodes: Array<{
      name: string;
      status?: string;
      type?: string;
      servicesUp?: number;
      servicesTotal?: number;
    }>;
    checkedAt: string;
  };
};

export function useAutonomySnapshot() {
  return useQuery<AutonomySnapshot>({
    queryKey: ["/api/autonomy/snapshot"],
    queryFn: async () => {
      const res = await fetch("/api/autonomy/snapshot");
      if (!res.ok) throw new Error("Failed to fetch autonomy snapshot");
      return await res.json();
    },
    refetchInterval: 4000,
    retry: false,
  });
}
