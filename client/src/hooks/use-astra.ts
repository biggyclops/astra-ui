import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type MessageResponse } from "@shared/routes";
import { insertMessageSchema, type Message } from "@shared/schema";
import type { z } from "zod";
import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_POLL_INTERVAL = 10000;

function usePageVisible() {
  const [visible, setVisible] = useState(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );
  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return visible;
}

export function useMessages(pollInterval = DEFAULT_POLL_INTERVAL) {
  const queryClient = useQueryClient();
  const pageVisible = usePageVisible();
  const [live, setLive] = useState(true);
  const lastEtagRef = useRef<string | null>(null);
  const maxIdRef = useRef<number>(0);
  const initialLoadDone = useRef(false);

  const query = useQuery<Message[]>({
    queryKey: [api.messages.list.path],
    queryFn: async ({ queryKey }) => {
      const existing = queryClient.getQueryData<Message[]>(queryKey) || [];
      const afterId = initialLoadDone.current ? maxIdRef.current : 0;
      const url = afterId > 0
        ? `${api.messages.list.path}?afterId=${afterId}`
        : api.messages.list.path;

      const headers: Record<string, string> = {};
      if (lastEtagRef.current && afterId > 0) {
        headers["If-None-Match"] = lastEtagRef.current;
      }

      const res = await fetch(url, { headers });

      if (res.status === 304) {
        return existing;
      }

      if (!res.ok) throw new Error("Failed to fetch messages");

      const etag = res.headers.get("etag");
      if (etag) lastEtagRef.current = etag;

      const newMessages: Message[] = await res.json();

      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        if (newMessages.length > 0) {
          maxIdRef.current = Math.max(...newMessages.map(m => m.id));
        }
        return newMessages;
      }

      if (newMessages.length === 0) return existing;

      const newMaxId = Math.max(...newMessages.map(m => m.id));
      if (newMaxId > maxIdRef.current) maxIdRef.current = newMaxId;

      const existingIds = new Set(existing.map(m => m.id));
      const merged = [...existing, ...newMessages.filter(m => !existingIds.has(m.id))];
      return merged;
    },
    refetchInterval: live && pageVisible ? pollInterval : false,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
  }, [queryClient]);

  return { ...query, live, setLive, refresh };
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: z.infer<typeof insertMessageSchema>) => {
      const res = await fetch(api.messages.create.path, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useMedia() {
  return useQuery({
    queryKey: [api.media.list.path],
    queryFn: async () => {
      const res = await fetch(api.media.list.path);
      if (!res.ok) throw new Error("Failed to fetch media");
      return api.media.list.responses[200].parse(await res.json());
    },
  });
}

export type MockMediaItem = {
  id: string;
  type: 'video' | 'image';
  url: string;
  thumb_url?: string;
  mtime: string;
  tags: string[];
  favorite: boolean;
};

export function useMockMedia() {
  return useQuery<{ items: MockMediaItem[] }>({
    queryKey: [api.media.mock.path],
    queryFn: async () => {
      const res = await fetch(api.media.mock.path);
      if (!res.ok) throw new Error("Failed to fetch mock media");
      return await res.json();
    },
  });
}

export function useJobs() {
  return useQuery({
    queryKey: [api.jobs.list.path],
    queryFn: async () => {
      const res = await fetch(api.jobs.list.path);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return await res.json();
    },
    refetchInterval: 2000,
  });
}

export type CreateJobInput = z.infer<typeof api.jobs.create.input>;

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (job: CreateJobInput) => {
      const res = await fetch(api.jobs.create.path, {
        method: api.jobs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      if (!res.ok) throw new Error("Failed to create job");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}

export type UpdateJobInput = z.infer<typeof api.jobs.update.input>;

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: UpdateJobInput & { id: number }) => {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update job");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}

export function useNodes() {
  return useQuery({
    queryKey: [api.nodes.list.path],
    queryFn: async () => {
      const res = await fetch(api.nodes.list.path);
      if (!res.ok) throw new Error("Failed to fetch nodes");
      return api.nodes.list.responses[200].parse(await res.json());
    },
  });
}

export type NodeStatusItem = {
  name: string;
  status: "online" | "offline" | "unknown";
  details: Record<string, string>;
};

export type NodeStatusResponse = {
  nodes: NodeStatusItem[];
  checkedAt: string;
};

export function useNodeStatus() {
  return useQuery<NodeStatusResponse>({
    queryKey: ["/api/status"],
    queryFn: async () => {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      return await res.json();
    },
    refetchInterval: 15000,
  });
}

export type HermesMediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  thumb_url: string;
  path: string;
  filename: string;
  mtime: string | null;
  size: string | null;
};

export type HermesResponse = {
  source: "hermes";
  path: string;
  items: HermesMediaItem[];
  message?: string;
};

export function useHermesMedia(path: string | null) {
  return useQuery<HermesResponse>({
    queryKey: ["/api/media/hermes", path],
    queryFn: async () => {
      const res = await fetch(`/api/media/hermes?path=${encodeURIComponent(path!)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Hermes unreachable" }));
        throw new Error(err.message || `Hermes returned ${res.status}`);
      }
      return await res.json();
    },
    enabled: !!path,
    retry: false,
    staleTime: 30000,
  });
}

export function hermesProxyUrl(path: string): string {
  return `/api/media/proxy?path=${encodeURIComponent(path)}`;
}

export type HermesMediaHealthResponse = {
  hermesLocalPathSet: boolean;
  mode: "local" | "http";
  lastProxyMode?: "local" | "http";
  resolvedPath?: string | null;
  exists?: boolean;
  isFile?: boolean;
  isDir?: boolean;
  mountAccessible?: boolean;
  error?: string;
};

export function useHermesMediaHealth(path?: string | null, enabled = true) {
  const queryPath = path ? `path=${encodeURIComponent(path)}` : "";
  return useQuery<HermesMediaHealthResponse>({
    queryKey: ["/api/media/hermes/health", queryPath],
    queryFn: async () => {
      const res = await fetch(`/api/media/hermes/health${queryPath ? `?${queryPath}` : ""}`);
      if (!res.ok) throw new Error("Health check failed");
      return await res.json();
    },
    staleTime: 30000,
    enabled,
  });
}

export function useRunHealthCheck() {
  const queryClient = useQueryClient();
  return useMutation<NodeStatusResponse>({
    mutationFn: async () => {
      const res = await fetch("/api/status/check", { method: "POST" });
      if (!res.ok) throw new Error("Health check failed");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/status"], data);
    },
  });
}
