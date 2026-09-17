import type { Express, Request, Response } from "express";
import { log } from "./logger";

export type FleetSnapshot = { nodes: any[]; checkedAt: string };

export type AutonomyJob = {
  id: string;
  title: string;
  type: string;
  node: "Hades";
  status: "queued" | "running" | "done" | "failed" | "unknown";
  progress: number;
  etaSeconds: number | null;
  source: "status" | "queue" | "history";
  rawStatus?: string;
};

export type AdvisorSnapshot = {
  topRecommendation: string | null;
  currentAdvisories: string[];
  summary: string | null;
};

export type AutonomySnapshot = {
  generatedAt: string;
  hadesReachable: boolean;
  hadesError: string | null;
  orbState: "idle" | "working" | "offline";
  working: AutonomyJob | null;
  queue: AutonomyJob[];
  history: AutonomyJob[];
  advisor: AdvisorSnapshot;
  fleet: FleetSnapshot;
};

export function hadesCoreBase() {
  // Prefer env. Fallback uses current Tailscale Hades IP from fleet inventory
  // (NODE_TARGETS); do not treat any hardcoded IP as verified core reachability.
  return (
    process.env.HADES_CORE_BASE ||
    process.env.HADES_STATUS_URL ||
    "http://100.98.196.16:5050"
  ).replace(/\/$/, "");
}

function hadesTimeoutMs() {
  return Number(process.env.HADES_FETCH_TIMEOUT_MS || 1500);
}

type TimedJson =
  | { ok: true; data: any; ms: number }
  | { ok: false; error: string; ms: number };

async function fetchJson(url: string, timeoutMs = hadesTimeoutMs()): Promise<TimedJson> {
  const start = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    const ms = Date.now() - start;
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${url}`, ms };
    }
    const text = await res.text();
    if (!text) return { ok: true, data: null, ms };
    try {
      return { ok: true, data: JSON.parse(text), ms };
    } catch {
      return { ok: false, error: `Invalid JSON from ${url}`, ms };
    }
  } catch (e: any) {
    const ms = Date.now() - start;
    const msg =
      e?.name === "AbortError"
        ? `timeout ${timeoutMs}ms ${url}`
        : (e?.message || "request failed");
    return { ok: false, error: msg, ms };
  } finally {
    clearTimeout(timer);
  }
}

export function normalizeProgress(value: unknown): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const pct = n <= 1 && n >= 0 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function normalizeJobStatus(raw: unknown): AutonomyJob["status"] {
  const s = String(raw ?? "").toLowerCase();
  if (!s) return "unknown";
  if (["processing", "running", "active", "in_progress", "in-progress", "working"].includes(s)) {
    return "running";
  }
  if (["queued", "pending", "waiting", "idle_queued"].includes(s)) return "queued";
  if (["completed", "complete", "done", "success", "succeeded"].includes(s)) return "done";
  if (["failed", "error", "cancelled", "canceled"].includes(s)) return "failed";
  return "unknown";
}

function pickString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  for (const key of ["jobs", "queue", "tasks", "items", "history", "advisories", "current_advisories", "recent_advisories"]) {
    if (Array.isArray(obj[key])) return obj[key] as any[];
  }
  return [];
}

export function mapHadesJob(raw: any, source: AutonomyJob["source"]): AutonomyJob | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    return {
      id: raw,
      title: raw,
      type: "system.task",
      node: "Hades",
      status: source === "queue" ? "queued" : "unknown",
      progress: source === "queue" ? 0 : 0,
      etaSeconds: null,
      source,
    };
  }
  if (typeof raw !== "object") return null;

  const id = pickString(
    raw.id,
    raw.task_id,
    raw.job_id,
    raw.uuid,
    raw.filename,
    raw.name,
  ) || `hades-${source}-${Math.random().toString(36).slice(2, 8)}`;

  const title =
    pickString(raw.title, raw.prompt, raw.name, raw.task, raw.description, raw.filename, raw.input) ||
    "Untitled Hades job";

  const type =
    pickString(raw.type, raw.kind, raw.module, raw.job_type, raw.category) || "system.task";

  const etaRaw = raw.eta_seconds ?? raw.etaSeconds ?? raw.eta ?? raw.remaining_seconds;
  const etaNum = etaRaw == null || etaRaw === "" ? null : Number(etaRaw);

  return {
    id: String(id),
    title,
    type,
    node: "Hades",
    status: normalizeJobStatus(raw.status ?? raw.state ?? raw.phase),
    progress: normalizeProgress(raw.progress ?? raw.pct ?? raw.percent),
    etaSeconds: Number.isFinite(etaNum as number) ? Math.max(0, Math.round(etaNum as number)) : null,
    source,
    rawStatus: raw.status ?? raw.state ?? undefined,
  };
}

function extractWorking(statusPayload: any, jobsPayload: any): AutonomyJob | null {
  const statusObj = statusPayload && typeof statusPayload === "object" ? statusPayload : {};
  const candidates = [
    statusObj.current_job,
    statusObj.active_job,
    statusObj.job,
    statusObj.working,
    statusObj.task,
  ].filter(Boolean);

  if (statusObj.task_id || statusObj.prompt || statusObj.progress != null || statusObj.status) {
    const looksLikeJob =
      statusObj.task_id ||
      statusObj.prompt ||
      ["processing", "running", "active", "in_progress"].includes(String(statusObj.status || "").toLowerCase());
    if (looksLikeJob) candidates.unshift(statusObj);
  }

  for (const c of candidates) {
    const mapped = mapHadesJob(c, "status");
    if (mapped && mapped.status === "running") return mapped;
    if (mapped && String(c?.status || c?.state || "").toLowerCase() === "processing") {
      return { ...mapped, status: "running" };
    }
  }

  const jobs = asArray(jobsPayload);
  for (const j of jobs) {
    const mapped = mapHadesJob(j, "history");
    if (mapped && mapped.status === "running") return mapped;
  }
  return null;
}

function extractAdvisor(payload: any, statusPayload: any): AdvisorSnapshot {
  const src = payload && typeof payload === "object" ? payload : {};
  const status = statusPayload && typeof statusPayload === "object" ? statusPayload : {};
  const top =
    pickString(
      src.top_recommendation,
      src.topRecommendation,
      src.recommendation,
      status.advisor_summary,
      status.top_recommendation,
    );
  const rawList = [
    ...asArray(src.current_advisories),
    ...asArray(src.recent_advisories),
    ...asArray(src.advisories),
    ...asArray(status.current_advisories),
  ];
  const currentAdvisories = rawList
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return pickString(item.text, item.message, item.summary, item.title, item.recommendation) || "";
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 8);

  return {
    topRecommendation: top,
    currentAdvisories,
    summary: pickString(src.summary, src.advisor_summary, status.advisor_summary),
  };
}

export function deriveOrbState(hadesReachable: boolean, working: AutonomyJob | null): AutonomySnapshot["orbState"] {
  if (!hadesReachable) return "offline";
  if (working && working.status === "running") return "working";
  return "idle";
}

export async function buildAutonomySnapshot(
  getFleet: () => Promise<FleetSnapshot>,
): Promise<AutonomySnapshot> {
  const generatedAt = new Date().toISOString();

  const [fleetSettled, statusRes, queueRes, jobsRes, advisorRes] = await Promise.all([
    getFleet().catch((e): FleetSnapshot => ({
      nodes: [],
      checkedAt: generatedAt,
    })),
    fetchJson(`${hadesCoreBase()}/api/status`),
    fetchJson(`${hadesCoreBase()}/api/queue`),
    fetchJson(`${hadesCoreBase()}/api/jobs`),
    fetchJson(`${hadesCoreBase()}/api/advisor`),
  ]);

  const fleet = fleetSettled;
  const hadesOk = statusRes.ok || queueRes.ok || jobsRes.ok || advisorRes.ok;
  const errors = [statusRes, queueRes, jobsRes, advisorRes]
    .filter((r): r is Extract<TimedJson, { ok: false }> => !r.ok)
    .map((r) => r.error);

  const working = statusRes.ok || jobsRes.ok
    ? extractWorking(statusRes.ok ? statusRes.data : null, jobsRes.ok ? jobsRes.data : null)
    : null;

  const queue = (queueRes.ok ? asArray(queueRes.data) : [])
    .map((item) => mapHadesJob(item, "queue"))
    .filter((j): j is AutonomyJob => !!j)
    .map((j) => (j.status === "unknown" ? { ...j, status: "queued" as const } : j));

  const history = (jobsRes.ok ? asArray(jobsRes.data) : [])
    .map((item) => mapHadesJob(item, "history"))
    .filter((j): j is AutonomyJob => !!j)
    .slice(0, 20);

  const advisor = extractAdvisor(
    advisorRes.ok ? advisorRes.data : null,
    statusRes.ok ? statusRes.data : null,
  );

  if (!hadesOk) {
    log(`[autonomy] Hades unreachable (${hadesCoreBase()}): ${errors[0] || "no response"}`);
  }

  return {
    generatedAt,
    hadesReachable: hadesOk,
    hadesError: hadesOk ? null : errors[0] || "Hades core unreachable",
    orbState: deriveOrbState(hadesOk, working),
    working: hadesOk ? working : null,
    queue: hadesOk ? queue : [],
    history: hadesOk ? history : [],
    advisor: hadesOk ? advisor : { topRecommendation: null, currentAdvisories: [], summary: null },
    fleet,
  };
}

type AutonomyRouteMount = Pick<Express, "get">;

/**
 * Register GET snapshot.
 * - Express app (PR #2 / Phase 1 baseline): path `/api/autonomy/snapshot`
 * - apiRouter mounted at `/api` (live Mini-Beast shell): path `/autonomy/snapshot`
 *   so the public URL stays `/api/autonomy/snapshot` and session middleware applies.
 */
export function registerAutonomyRoutes(
  mount: AutonomyRouteMount,
  getFleet: () => Promise<FleetSnapshot>,
  routePath: string = "/api/autonomy/snapshot",
) {
  mount.get(routePath, async (_req: Request, res: Response) => {
    try {
      const snapshot = await buildAutonomySnapshot(getFleet);
      res.json(snapshot);
    } catch (e: any) {
      log(`[autonomy] snapshot failed: ${e?.message || e}`);
      const fleet = await getFleet().catch(() => ({ nodes: [], checkedAt: new Date().toISOString() }));
      const fallback: AutonomySnapshot = {
        generatedAt: new Date().toISOString(),
        hadesReachable: false,
        hadesError: e?.message || "snapshot failed",
        orbState: "offline",
        working: null,
        queue: [],
        history: [],
        advisor: { topRecommendation: null, currentAdvisories: [], summary: null },
        fleet,
      };
      res.json(fallback);
    }
  });
}
