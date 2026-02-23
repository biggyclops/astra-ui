// server/routes.ts
import type { Express, Request, Response } from "express";
import { execFile, execSync } from "node:child_process";
import { promisify } from "node:util";
import { Readable } from "node:stream";
import fs from "node:fs";
import pathModule from "node:path";
import { log } from "./logger";

const execFileAsync = promisify(execFile);

type NodeState = "online" | "degraded" | "unreachable" | "offline" | "unknown";

type NodeCheck =
  | {
      kind: "tailscale";
      target: string;
      ok: boolean;
      latencyMs?: number;
      error?: string;
    }
  | {
      kind: "http";
      target: string;
      ok: boolean;
      latencyMs?: number;
      statusCode?: number;
      error?: string;
    };

type ApiNodeStatus = {
  name: string;
  status: "online" | "offline" | "unknown";
  details?: Record<string, any>;
};

type NodeStatus = {
  name: string;
  state: NodeState;
  reason?: string;
  checkedAt: string;
  checks: NodeCheck[];
  details?: Record<string, any>;
};

// -------------------------
// Tunables
// -------------------------
const TAILSCALE_TIMEOUT_MS = 1600;
const HTTP_TIMEOUT_MS = 1500;

// If a node has NO checks configured, it will show "unknown"
const NODE_TARGETS: Array<{
  name: string;
  // what to tailscale ping (MagicDNS name or tailnet IP)
  ts?: string;
  // optional HTTP health endpoint (if you have one)
  http?: string;
}> = [
  { name: "Kratos", ts: "kratos-z440" },
  { name: "Hades", ts: "hades-z370-windows11" },
  { name: "Hermes", ts: "hermes" },
  { name: "Phobos", ts: "phobos" },
];

// -------------------------
// Helpers
// -------------------------
function nowIso() {
  return new Date().toISOString();
}

async function tailscalePing(target: string): Promise<NodeCheck> {
  const start = Date.now();
  try {
    // `tailscale ping -c 1 <target>`
    // Works on Linux + Windows (but this runs on minibeast = Linux).
    await execFileAsync(
      "tailscale",
      ["ping", "-c", "1", target],
      { timeout: TAILSCALE_TIMEOUT_MS }
    );

    return {
      kind: "tailscale",
      target,
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (e: any) {
    return {
      kind: "tailscale",
      target,
      ok: false,
      latencyMs: Date.now() - start,
      error:
        e?.killed || e?.signal
          ? "timeout"
          : (e?.stderr?.toString?.() || e?.message || "tailscale ping failed").trim(),
    };
  }
}

async function httpProbe(url: string): Promise<NodeCheck> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);

    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return {
        kind: "http",
        target: url,
        ok: false,
        latencyMs,
        statusCode: res.status,
        error: `HTTP ${res.status}`,
      };
    }

    return {
      kind: "http",
      target: url,
      ok: true,
      latencyMs,
      statusCode: res.status,
    };
  } catch (e: any) {
    return {
      kind: "http",
      target: url,
      ok: false,
      latencyMs: Date.now() - start,
      error: e?.name === "AbortError" ? "timeout" : (e?.message ?? "request failed"),
    };
  }
}

function computeState(checks: NodeCheck[]): { state: NodeState; reason?: string } {
  if (checks.length === 0) return { state: "unknown", reason: "no checks configured" };

  const ts = checks.find((c) => c.kind === "tailscale") as NodeCheck | undefined;
  const http = checks.find((c) => c.kind === "http") as NodeCheck | undefined;

  // If tailscale ping exists and fails -> OFFLINE (unmistakable)
  if (ts && !ts.ok) return { state: "offline", reason: ts.error || "tailscale ping failed" };

  // If tailscale ping is ok, but http check exists and fails -> DEGRADED/UNREACHABLE
  if (http && !http.ok) {
    // if it's a clean refusal/404/etc it's "degraded", if it's timeout/network it's "unreachable"
    const err = (http.error || "").toLowerCase();
    const unreachable =
      err.includes("timeout") ||
      err.includes("fetch") ||
      err.includes("network") ||
      err.includes("econn") ||
      err.includes("enotfound");
    return { state: unreachable ? "unreachable" : "degraded", reason: http.error || "http failed" };
  }

  // If we got here, either tailscale ok or http ok => ONLINE
  return { state: "online" };
}

function stateToUiStatus(state: NodeState): ApiNodeStatus["status"] {
  if (state === "online") return "online";
  if (state === "unknown") return "unknown";
  return "offline";
}

// -------------------------
// Minimal in-memory data used by the UI
// (You can swap to DB later; this keeps you moving now.)
// -------------------------
type Message = {
  id: number;
  role: "system" | "user" | "assistant";
  content: string;
  type: "text" | "node_status" | "job";
  metadata: any;
  createdAt: string;
};

type Job = {
  id: number;
  type: string;
  title: string;
  status: "queued" | "running" | "done" | "failed";
  node: string;
  progress: number;
  inputs: any[];
  outputs: any[];
  logs: string[];
  createdAt: string;
  updatedAt: string;
};

type NodeRow = {
  id: number;
  name: string;
  type: string;
  status: "online" | "degraded" | "offline";
  metrics: { cpu: number; memory: number };
  createdAt: string;
};

const boot = nowIso();

let messages: Message[] = [
  { id: 1, role: "system", content: "Welcome to Astra UI console.", type: "text", metadata: null, createdAt: boot },
  { id: 2, role: "assistant", content: "Node status report:", type: "node_status", metadata: { name: "Node Alpha", nodeId: 1, status: "online" }, createdAt: boot },
  { id: 3, role: "user", content: "What is the status of the training job?", type: "text", metadata: null, createdAt: boot },
  { id: 4, role: "assistant", content: "Here is the latest job status.", type: "job", metadata: { name: "Train Model V2", jobId: 1, status: "running" }, createdAt: boot },
];

let jobs: Job[] = [
  {
    id: 1,
    type: "comfyui.image",
    title: "Nebula Render Pipeline",
    status: "done",
    node: "Kratos",
    progress: 100,
    inputs: [],
    outputs: [
      {
        id: "out-1",
        url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600",
        type: "image",
        thumb_url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200",
      },
    ],
    logs: ["Job completed successfully."],
    createdAt: boot,
    updatedAt: boot,
  },
  {
    id: 2,
    type: "comfyui.video",
    title: "Orbit Simulation v3",
    status: "running",
    node: "Hades",
    progress: 45,
    inputs: [],
    outputs: [],
    logs: ["Initializing...", "Processing frames..."],
    createdAt: boot,
    updatedAt: boot,
  },
  {
    id: 3,
    type: "media.describe",
    title: "Deep Field Analysis",
    status: "failed",
    node: "Hermes",
    progress: 33,
    inputs: [],
    outputs: [],
    logs: ["Started analysis...", "ERROR: Node connection timeout"],
    createdAt: boot,
    updatedAt: boot,
  },
];

let nodes: NodeRow[] = [
  { id: 1, name: "Node Alpha", type: "Kratos", status: "online", metrics: { cpu: 45, memory: 60 }, createdAt: boot },
  { id: 2, name: "Node Beta", type: "Hades", status: "degraded", metrics: { cpu: 85, memory: 90 }, createdAt: boot },
  { id: 3, name: "Node Gamma", type: "Hermes", status: "offline", metrics: { cpu: 0, memory: 0 }, createdAt: boot },
];

function bumpJob(id: number, patch: Partial<Job>) {
  const i = jobs.findIndex((j) => j.id === id);
  if (i === -1) return null;
  jobs[i] = { ...jobs[i], ...patch, updatedAt: nowIso() };
  return jobs[i];
}

// -------------------------
// Routes
// -------------------------
export async function registerRoutes(app: Express) {
  // STATUS: now uses tailscale ping so OFFLINE is undeniable
  app.get("/api/status", async (_req: Request, res: Response) => {
    const checkedAt = nowIso();

    const rich: NodeStatus[] = await Promise.all(
      NODE_TARGETS.map(async (t) => {
        const checks: NodeCheck[] = [];
        if (t.ts) checks.push(await tailscalePing(t.ts));
        if (t.http) checks.push(await httpProbe(t.http));

        const { state, reason } = computeState(checks);

        // Map to the *UI’s existing shape* (name/status/details)
        const status: ApiNodeStatus = {
          name: t.name,
          status: stateToUiStatus(state),
          details: {
            state,
            reason,
            checks,
          },
        };

        return {
          name: t.name,
          state,
          reason,
          checkedAt,
          checks,
          details: status.details,
        };
      })
    );

    // Also return the simple shape your UI already logged earlier
    const nodesSimple: ApiNodeStatus[] = rich.map((n) => ({
      name: n.name,
      status: stateToUiStatus(n.state),
      details: n.details ?? {},
    }));

    res.json({ nodes: nodesSimple, checkedAt });
  });

  // Existing UI calls these:
  app.get("/api/nodes", (_req: Request, res: Response) => {
    res.json(nodes);
  });

  app.get("/api/messages", (_req: Request, res: Response) => {
    res.json(messages);
  });

  app.get("/api/jobs", (_req: Request, res: Response) => {
    res.json(jobs);
  });

  // Hermes media source: fetch directory listing, parse HTML, return normalized JSON
  const HERMES_BASE_URL = (process.env.HERMES_BASE_URL || "http://100.120.145.15:8080").replace(/\/$/, "");
  const HERMES_LOCAL_PATH = process.env.HERMES_LOCAL_PATH; // e.g. /mnt/hermes when Samba is mounted
  const HERMES_AUTH = process.env.HERMES_AUTH; // "user:password" for File Browser API
  const HERMES_FETCH_TIMEOUT_MS = 15000;
  const HERMES_DEBUG = process.env.HERMES_DEBUG === "1" || process.env.HERMES_DEBUG === "true";
  let hermesJwtCache: { token: string; expires: number } | null = null;
  const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
  const VIDEO_EXT = new Set(["mp4", "webm", "mov", "mkv"]);
  const MEDIA_EXT = new Set([...Array.from(IMAGE_EXT), ...Array.from(VIDEO_EXT)]);

  const CT_MAP: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };

  function normalizeHermesPath(raw: string): string | null {
    const p = raw.trim().replace(/\/+/g, "/");
    if (!p.startsWith("/")) return "/" + p;
    if (!p.startsWith("/files/")) return null;
    if (p.includes("..")) return null;
    return p;
  }

  /** Extract hrefs from <a href="..."> and <a href='...'> */
  function parseHtmlLinks(html: string): string[] {
    const hrefs: string[] = [];
    const doubleQuoteRe = /<a\s+[^>]*href\s*=\s*"([^"]*)"/gi;
    const singleQuoteRe = /<a\s+[^>]*href\s*=\s*'([^']*)'/gi;
    let m: RegExpExecArray | null;
    while ((m = doubleQuoteRe.exec(html)) !== null) hrefs.push(m[1]);
    while ((m = singleQuoteRe.exec(html)) !== null) hrefs.push(m[1]);
    return hrefs;
  }

  function getMediaType(filename: string): "image" | "video" | null {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext) return null;
    if (IMAGE_EXT.has(ext)) return "image";
    if (VIDEO_EXT.has(ext)) return "video";
    return null;
  }

  app.get("/api/media/hermes", async (req: Request, res: Response) => {
    let rawPath = req.query.path as string | undefined;
    if (!rawPath || typeof rawPath !== "string") {
      return res.status(400).json({ message: "Path required" });
    }
    try {
      rawPath = decodeURIComponent(rawPath);
    } catch {
      /* keep raw if invalid encoding */
    }
    const path = normalizeHermesPath(rawPath);
    if (!path) {
      return res.status(400).json({ message: "Path must start with /files/ and cannot contain .." });
    }

    const basePath = path.endsWith("/") ? path : `${path}/`;
    const hermesUrl = `${HERMES_BASE_URL}${basePath}`.replace(/([^/])\/+/g, "$1/");
    const includeDirs = req.query.includeDirs === "true";
    const debugFlag = req.query.debug === "1" || req.query.debug === "true" || HERMES_DEBUG;

    const debugInfo: Record<string, unknown> = {};
    if (debugFlag) debugInfo.fetchedUrl = hermesUrl;

    // Try local filesystem FIRST when HERMES_LOCAL_PATH is set
    if (HERMES_LOCAL_PATH) {
      const localDir = pathModule.join(HERMES_LOCAL_PATH, path.replace(/^\/+/, ""));
      if (HERMES_DEBUG) log(`[hermes] trying local path (first): ${localDir}`);
      if (debugFlag) (debugInfo as any).localPath = localDir;

      try {
        const entries = fs.readdirSync(localDir, { withFileTypes: true });
        const hrefs: string[] = entries.map((e) => (e.isDirectory() ? e.name + "/" : e.name));
        if (HERMES_DEBUG) log(`[hermes] local linksFound=${hrefs.length} first10=${JSON.stringify(hrefs.slice(0, 10))}`);
        if (debugFlag) (debugInfo as any).linksFound = hrefs.length;

        const basePathNormalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
        const items: Array<{ id: string; type: "image" | "video"; url: string; thumb_url: string; path: string; filename: string; mtime: string | null; size: string | null }> = [];
        const filteredOut: Record<string, number> = { parent: 0, dir: 0, ext: 0, query: 0, other: 0 };
        let mediaCandidates = 0;

        for (const href of hrefs) {
          if (href === "../" || href.startsWith("../")) {
            filteredOut.parent++;
            continue;
          }
          if (href === "?" || href.startsWith("?")) {
            filteredOut.query++;
            continue;
          }
          const isDir = href.endsWith("/");
          if (isDir) {
            if (!includeDirs) {
              filteredOut.dir++;
              continue;
            }
          }
          const filename = href.replace(/\/$/, "");
          if (filename.startsWith(".") && (filename === ".DS_Store" || filename.startsWith("._"))) continue;
          const type = getMediaType(filename);
          if (!type) {
            const ext = filename.split(".").pop()?.toLowerCase();
            if (ext && !MEDIA_EXT.has(ext)) filteredOut.ext++;
            else filteredOut.other++;
            continue;
          }
          mediaCandidates++;
          const rel = `${basePathNormalized}${filename}`.replace(/([^/])\/+/g, "$1/");
          const itemPath = rel.startsWith("/") ? rel : `/${rel}`;
          const stableId = Buffer.from(itemPath).toString("base64url");
          let mtime: string | null = null;
          let size: string | null = null;
          try {
            const stat = fs.statSync(pathModule.join(localDir, filename));
            mtime = stat.mtime.toISOString();
            size = String(stat.size);
          } catch {}
          items.push({ id: stableId, type, url: itemPath, thumb_url: itemPath, path: itemPath, filename, mtime, size });
        }

        if (debugFlag) {
          (debugInfo as any).mediaCandidates = mediaCandidates;
          (debugInfo as any).filteredOut = filteredOut;
          (debugInfo as any).source = "local";
        }
        return res.json({
          source: "hermes",
          path,
          items,
          ...(items.length === 0 && { message: "No media found" }),
          ...(items.length === 0 && debugFlag && { debug: debugInfo }),
        });
      } catch (localErr: any) {
        if (HERMES_DEBUG) log(`[hermes] local read failed: ${localErr?.message}`);
        if (debugFlag) (debugInfo as any).localError = localErr?.message;
        // Fall through to File Browser API / HTML fetch
      }
    }

    async function getFileBrowserToken(): Promise<string | null> {
      if (!HERMES_AUTH) return null;
      if (!HERMES_AUTH.includes(":")) return HERMES_AUTH;
      if (hermesJwtCache && hermesJwtCache.expires > Date.now() + 60000) return hermesJwtCache.token;
      const [user, pass] = HERMES_AUTH.split(":", 2);
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(`${HERMES_BASE_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user, password: pass }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (!res.ok) return null;
        const token = await res.text();
        if (!token || token.length < 20) return null;
        hermesJwtCache = { token, expires: Date.now() + 3600000 };
        return token;
      } catch {
        return null;
      }
    }

    if (HERMES_AUTH) {
      const apiPath = path.replace(/^\/+/, "");
      const apiUrl = `${HERMES_BASE_URL}/api/resources?path=${encodeURIComponent(apiPath)}`;
      if (debugFlag) (debugInfo as any).apiUrl = apiUrl;
      const token = await getFileBrowserToken();
      if (token) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), HERMES_FETCH_TIMEOUT_MS);
          const apiRes = await fetch(apiUrl, {
            headers: { "X-Auth": token },
            signal: ctrl.signal,
          });
          clearTimeout(t);
          const apiBody = await apiRes.text();
          if (HERMES_DEBUG) {
            log(`[hermes] File Browser API status=${apiRes.status} path=${apiPath}`);
          }
          if (apiRes.ok) {
            try {
              const data = JSON.parse(apiBody);
              const rawItems = data?.items || [];
              const dirPath = apiPath ? `${apiPath.replace(/\/$/, "")}/` : "";
              const items: Array<{ id: string; type: "image" | "video"; url: string; thumb_url: string; path: string; filename: string; mtime: string | null; size: string | null }> = [];
              for (const it of rawItems) {
                if (it.isDir) continue;
                const name = it.name || it.path || "";
                if (name.startsWith(".") && (name === ".DS_Store" || name.startsWith("._"))) continue;
                const type = it.type === "video" || it.type === "image" ? (it.type as "image" | "video") : getMediaType(name);
                if (!type) continue;
                const relPath = (it.path || name).replace(/^\//, "");
                const itemPath = relPath.includes("/") ? relPath : `${dirPath}${relPath}`;
                const fbPath = `/${itemPath}`;
                const stableId = Buffer.from(fbPath).toString("base64url");
                items.push({
                  id: stableId,
                  type,
                  url: fbPath,
                  thumb_url: fbPath,
                  path: fbPath,
                  filename: name,
                  mtime: it.modified || null,
                  size: it.size != null ? String(it.size) : null,
                });
              }
              if (debugFlag) {
                (debugInfo as any).source = "filebrowser";
                (debugInfo as any).linksFound = rawItems?.length ?? 0;
              }
              return res.json({
                source: "hermes",
                path,
                items,
                ...(items.length === 0 && { message: "No media found" }),
                ...(items.length === 0 && debugFlag && { debug: debugInfo }),
              });
            } catch {
              /* fall through to HTML */
            }
          }
        } catch (e: any) {
          if (HERMES_DEBUG) log(`[hermes] File Browser API error: ${e?.message}`);
        }
      }
      if (!token && !HERMES_LOCAL_PATH) {
        if (process.env.NODE_ENV !== "production") log("[hermes] HERMES_AUTH not set or login failed");
        return res.status(500).json({ message: "HERMES_AUTH not set" });
      }
    }

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), HERMES_FETCH_TIMEOUT_MS);
      const fetchRes = await fetch(hermesUrl, { signal: ctrl.signal });
      clearTimeout(t);

      const contentType = fetchRes.headers.get("content-type") || "";
      const body = await fetchRes.text();

      if (HERMES_DEBUG) {
        log(`[hermes] URL=${hermesUrl} status=${fetchRes.status} content-type=${contentType}`);
        log(`[hermes] body preview (300 chars): ${body.slice(0, 300).replace(/\s+/g, " ")}`);
      }

      if (!fetchRes.ok) {
        if (fetchRes.status === 404) {
          return res.json({ source: "hermes", path, items: [], message: "No media found", ...(debugFlag && { debug: { ...debugInfo, linksFound: 0 } }) });
        }
        return res.status(502).json({ message: "Hermes unreachable" });
      }

      let hrefs: string[] = [];
      if (contentType.includes("application/json")) {
        try {
          const json = JSON.parse(body);
          if (Array.isArray(json)) {
            hrefs = json;
          } else if (json?.items && Array.isArray(json.items)) {
            hrefs = json.items.map((i: any) => i.href ?? i.url ?? i.name ?? String(i));
          } else {
            hrefs = [];
          }
        } catch {
          hrefs = parseHtmlLinks(body);
        }
      } else {
        hrefs = parseHtmlLinks(body);
      }

      if (HERMES_DEBUG) {
        log(`[hermes] linksFound=${hrefs.length} first10=${JSON.stringify(hrefs.slice(0, 10))}`);
      }
      if (debugFlag) debugInfo.linksFound = hrefs.length;

      const basePathNormalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
      const items: Array<{
        id: string;
        type: "image" | "video";
        url: string;
        thumb_url: string;
        filename: string;
        mtime: string | null;
        size: string | null;
      }> = [];
      const filteredOut: Record<string, number> = { parent: 0, dir: 0, ext: 0, query: 0, other: 0 };
      let mediaCandidates = 0;

      for (const href of hrefs) {
        if (href === "../" || href.startsWith("../")) {
          filteredOut.parent++;
          continue;
        }
        if (href === "?" || href.startsWith("?")) {
          filteredOut.query++;
          continue;
        }
        const isDir = href.endsWith("/");
        if (isDir) {
          if (!includeDirs) {
            filteredOut.dir++;
            continue;
          }
        }
        const rawFilename = href.replace(/\/$/, "");
        const filename = decodeURIComponent(rawFilename);
        const type = getMediaType(filename);
        if (!type) {
          const ext = filename.split(".").pop()?.toLowerCase();
          if (ext && !MEDIA_EXT.has(ext)) filteredOut.ext++;
          else filteredOut.other++;
          continue;
        }
        mediaCandidates++;

        let itemUrl: string;
        if (href.startsWith("http://") || href.startsWith("https://")) {
          if (!href.startsWith(HERMES_BASE_URL)) continue;
          itemUrl = href;
        } else {
          const rel = href.startsWith("/") ? href : `${basePathNormalized}${href}`.replace(/([^/])\/+/g, "$1/");
          itemUrl = `${HERMES_BASE_URL}${rel}`.replace(/([^/])\/+/g, "$1/");
        }

        const stableId = Buffer.from(itemUrl).toString("base64url");

        items.push({
          id: stableId,
          type,
          url: itemUrl,
          thumb_url: itemUrl,
          filename,
          mtime: null,
          size: null,
        });
      }

      if (debugFlag) {
        debugInfo.mediaCandidates = mediaCandidates;
        debugInfo.filteredOut = filteredOut;
      }
      if (HERMES_DEBUG && items.length === 0) {
        log(`[hermes] filteredOut=${JSON.stringify(filteredOut)} mediaCandidates=${mediaCandidates}`);
      }

      return res.json({
        source: "hermes",
        path,
        items,
        ...(items.length === 0 && { message: "No media found" }),
        ...(items.length === 0 && debugFlag && { debug: debugInfo }),
      });
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (HERMES_DEBUG) {
        log(`[hermes] fetch error: ${msg}`);
      }
      const unreachable =
        e?.name === "AbortError" ||
        e?.cause?.name === "AbortError" ||
        msg.toLowerCase().includes("fetch") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("econnrefused") ||
        msg.toLowerCase().includes("enotfound") ||
        msg.toLowerCase().includes("etimedout");
      const json: Record<string, unknown> = { message: unreachable ? "Hermes unreachable" : "Hermes request failed" };
      if (debugFlag) json.debug = { ...debugInfo, fetchError: msg };
      return res.status(502).json(json);
    }
  });

  // Proxy media files from Hermes by path (File Browser /api/raw)
  app.get("/api/media/proxy", async (req: Request, res: Response) => {
    if (req.query.url) {
      return res.status(400).json({ message: "Use path param, not url" });
    }
    let rawPath = req.query.path as string | undefined;
    if (!rawPath || typeof rawPath !== "string") {
      return res.status(400).json({ message: "path required" });
    }
    try {
      rawPath = decodeURIComponent(rawPath);
    } catch {
      /* keep raw if invalid encoding */
    }
    const fbPath = normalizeHermesPath(rawPath);
    if (!fbPath) {
      return res.status(400).json({ message: "Path must start with /files/ and cannot contain .." });
    }
    const allowHttpFallback = req.query.allowHttpFallback === "1" || req.query.allowHttpFallback === "true";

    // Local-first: stream from filesystem when HERMES_LOCAL_PATH is set (real mp4 bytes, Range 206)
    if (HERMES_LOCAL_PATH) {
      const localFile = pathModule.join(HERMES_LOCAL_PATH, fbPath.replace(/^\/+/, ""));
      const resolvedLocal = pathModule.resolve(localFile);
      if (process.env.NODE_ENV !== "production") {
        const exists = fs.existsSync(resolvedLocal);
        log(`[proxy] HERMES_LOCAL_PATH=${HERMES_LOCAL_PATH} resolvedLocal=${resolvedLocal} exists=${exists}`);
      }
      const resolvedBase = pathModule.resolve(HERMES_LOCAL_PATH);
      if (!resolvedLocal.startsWith(resolvedBase)) {
        return res.status(400).json({ message: "Path traversal not allowed" });
      }
      try {
        const stat = fs.statSync(resolvedLocal);
        if (stat.isDirectory()) {
          return res.status(400).json({ message: "Path is a directory" });
        }
        const fileSize = stat.size;
        const ext = pathModule.extname(resolvedLocal).slice(1).toLowerCase();
        const contentType = CT_MAP[ext] ?? "application/octet-stream";

        const rangeHeader = req.get("Range");
        let start = 0;
        let end = fileSize - 1;
        let useRange = false;

        if (rangeHeader && rangeHeader.startsWith("bytes=")) {
          const parts = rangeHeader.slice(6).split("-");
          const parsedStart = parts[0] ? parseInt(parts[0], 10) : 0;
          const parsedEnd = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          if (!Number.isNaN(parsedStart) && parsedStart >= 0) {
            start = parsedStart;
            end = Number.isNaN(parsedEnd) || parsedEnd >= fileSize ? fileSize - 1 : parsedEnd;
            if (start <= end) {
              useRange = true;
            }
          }
        }
        if (useRange && (start > end || start >= fileSize)) {
          res.setHeader("Content-Range", `bytes */${fileSize}`);
          return res.status(416).json({ message: "Range not satisfiable" });
        }

        const chunkSize = useRange ? end - start + 1 : fileSize;
        res.setHeader("Content-Type", contentType);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "public, max-age=300");
        res.setHeader("X-Hermes-Source", "local");
        if (useRange) {
          res.status(206);
          res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
          res.setHeader("Content-Length", String(chunkSize));
        } else {
          res.status(200);
          res.setHeader("Content-Length", String(fileSize));
        }

        const stream = fs.createReadStream(resolvedLocal, { start: useRange ? start : undefined, end: useRange ? end : undefined });
        stream.pipe(res);
        return;
      } catch (localErr: any) {
        if (localErr?.code === "ENOENT") {
          if (allowHttpFallback) {
            if (process.env.NODE_ENV !== "production") {
              log(`[proxy] Local file not found, allowHttpFallback=1, falling back to Hermes HTTP`);
            }
          } else {
            if (process.env.NODE_ENV !== "production") {
              log(`[proxy] HERMES_LOCAL_PATH set but file not found (allowHttpFallback not set): ${resolvedLocal}`);
            }
            return res.status(404).json({
              message: "Local file not found",
              resolvedLocalFile: resolvedLocal,
              normalizedPath: fbPath,
            });
          }
        } else {
          if (HERMES_DEBUG) log(`[proxy] local read error: ${localErr?.message}`);
          return res.status(500).json({ message: "Local file read failed" });
        }
      }
    }

    let token: string | null = hermesJwtCache?.token ?? null;
    if (!token || !hermesJwtCache || hermesJwtCache.expires <= Date.now() + 60000) {
      if (!HERMES_AUTH) {
        return res.status(500).json({ message: "HERMES_AUTH not set" });
      }
      if (!HERMES_AUTH.includes(":")) {
        token = HERMES_AUTH;
        hermesJwtCache = { token, expires: Date.now() + 3600000 };
      } else {
        const [user, pass] = HERMES_AUTH.split(":", 2);
        try {
          const loginRes = await fetch(`${HERMES_BASE_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass }),
          });
          if (!loginRes.ok) return res.status(502).json({ message: "Hermes unreachable" });
          token = await loginRes.text();
          if (!token) return res.status(502).json({ message: "Hermes unreachable" });
          hermesJwtCache = { token, expires: Date.now() + 3600000 };
        } catch {
          return res.status(502).json({ message: "Hermes unreachable" });
        }
      }
    }

    const u = new URL(HERMES_BASE_URL);
    const apiRawPath = "/api/raw" + fbPath;
    u.pathname = "/" + apiRawPath.split("/").filter(Boolean).map(encodeURIComponent).join("/").replaceAll("%2F", "/");
    u.search = "";
    const targetUrl = u.toString();
    const headers: Record<string, string> = { "X-Auth": token! };
    const rangeHeader = req.get("Range");
    if (rangeHeader) headers["Range"] = rangeHeader;

    if (process.env.NODE_ENV !== "production") {
      log(`[proxy] GET ${targetUrl}`);
    }

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), HERMES_FETCH_TIMEOUT_MS);
      const fetchRes = await fetch(targetUrl, {
        method: "GET",
        signal: ctrl.signal,
        headers,
      });
      clearTimeout(t);

      if (!fetchRes.ok) {
        return res.status(fetchRes.status).json({ message: "Hermes unreachable" });
      }

      const contentType = fetchRes.headers.get("content-type") || "";
      const contentDisp = fetchRes.headers.get("content-disposition") || "";
      if (contentType.includes("application/zip") || contentDisp.includes("hermes_storage.zip")) {
        return res.status(400).json({ message: "Path resolved to directory (zip). Check path." });
      }

      res.status(fetchRes.status);
      const fwdHeaders = ["content-type", "content-length", "accept-ranges", "content-range"];
      for (const h of fwdHeaders) {
        const val = fetchRes.headers.get(h);
        if (val) res.setHeader(h, val);
      }
      res.setHeader("Cache-Control", "public, max-age=300");
      res.setHeader("X-Hermes-Source", "http");

      const body = fetchRes.body;
      if (body) {
        Readable.fromWeb(body as any).pipe(res);
      } else {
        res.end();
      }
    } catch (e: any) {
      return res.status(502).json({ message: "Hermes unreachable" });
    }
  });

  // Media health: hermes local path status (kept for backward compat)
  app.get("/api/media/health", (req: Request, res: Response) => {
    const pathParam = req.query.path as string | undefined;
    const redirect = `/api/media/hermes/health${pathParam ? `?path=${encodeURIComponent(pathParam)}` : ""}`;
    res.redirect(302, redirect);
  });

  // Hermes health: single source of truth — always returns JSON, never HTML
  app.get("/api/media/hermes/health", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    let pathParam = req.query.path as string | undefined;
    if (pathParam) {
      try {
        pathParam = decodeURIComponent(pathParam);
      } catch {
        /* keep raw */
      }
    }
    const lastProxyMode = HERMES_LOCAL_PATH ? "local" : "http";
    const result: Record<string, unknown> = {
      hermesBaseUrl: HERMES_BASE_URL,
      hermesLocalPath: HERMES_LOCAL_PATH ?? null,
      normalizedPath: pathParam ?? null,
      lastProxyMode,
      mode: lastProxyMode,
      hermesLocalPathSet: !!HERMES_LOCAL_PATH,
    };
    if (pathParam) {
      const fbPath = normalizeHermesPath(pathParam);
      result.normalizedPath = fbPath;
      if (fbPath && HERMES_LOCAL_PATH) {
        const localFile = pathModule.join(HERMES_LOCAL_PATH, fbPath.replace(/^\/+/, ""));
        const resolvedLocal = pathModule.resolve(localFile);
        const resolvedBase = pathModule.resolve(HERMES_LOCAL_PATH);
        result.resolvedLocalFile = resolvedLocal;
        let exists = false;
        let isFile = false;
        let isDir = false;
        let size: number | null = null;
        if (resolvedLocal.startsWith(resolvedBase)) {
          try {
            const stat = fs.statSync(resolvedLocal);
            exists = true;
            isFile = stat.isFile();
            isDir = stat.isDirectory();
            size = stat.size;
          } catch {}
        }
        result.exists = exists;
        result.isFile = isFile;
        result.isDir = isDir;
        result.size = size;
        result.usingLocal = exists && isFile;
      } else {
        result.resolvedLocalFile = null;
        result.exists = false;
        result.isFile = false;
        result.isDir = false;
        result.size = null;
        result.usingLocal = false;
        result.error = !fbPath ? "Invalid path (must start with /files/ and no ..)" : "HERMES_LOCAL_PATH not set";
      }
    }
    // Mount info (best effort)
    const mountPath = HERMES_LOCAL_PATH || "/mnt/hermes/storage";
    try {
      const mountOut = execSync(`mount | grep "${mountPath}"`, { encoding: "utf8", maxBuffer: 2048 });
      result.mountInfo = mountOut.trim();
    } catch {
      result.mountInfo = null;
    }
    try {
      const dfOut = execSync(`df -h "${mountPath}"`, { encoding: "utf8", maxBuffer: 1024 });
      result.dfInfo = dfOut.trim();
    } catch {
      result.dfInfo = null;
    }
    if (HERMES_LOCAL_PATH) {
      try {
        const stat = fs.statSync(HERMES_LOCAL_PATH);
        result.mountAccessible = stat.isDirectory();
      } catch {
        result.mountAccessible = false;
      }
    }
    res.json(result);
  });

  // Your UI is hitting /api/media/mock
  app.get("/api/media/mock", (_req: Request, res: Response) => {
    // keep it stable/deterministic
    res.json({ items: [] });
  });

  // Your logs show PATCH /api/jobs/2 is being called
  app.patch("/api/jobs/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid job id" });

    const patch = req.body as Partial<Job>;
    const updated = bumpJob(id, patch);
    if (!updated) return res.status(404).json({ message: "Job not found" });

    res.json(updated);
  });

  // Optional: add a quick message endpoint so you can talk in UI
  app.post("/api/messages", (req: Request, res: Response) => {
    const { role, content } = req.body ?? {};
    if (!role || !content) return res.status(400).json({ message: "role and content required" });

    const msg: Message = {
      id: (messages[messages.length - 1]?.id ?? 0) + 1,
      role,
      content,
      type: "text",
      metadata: null,
      createdAt: nowIso(),
    };
    messages = [...messages, msg];
    res.json(msg);
  });
}
