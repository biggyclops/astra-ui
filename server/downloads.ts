/**
 * Transmission (via the VPN container) + Radarr/Sonarr status, ported from the pre-cutover prod tree.
 * All routes sit behind the /api session gate and the JSON-only CSRF rule.
 * Secrets come only from env: TRANSMISSION_RPC_USER/TRANSMISSION_RPC_PASSWORD, RADARR_API_KEY, SONARR_API_KEY.
 */
import type { Express, Request, Response } from "express";
import { execFile } from "node:child_process";
import fs from "node:fs";
import pathModule from "node:path";
import { log } from "./logger";

type Env = Record<string, string | undefined>;

export interface DownloadsConfig {
  rpcUrl: string;
  webUrl: string;
  downloadRoot: string;
  timeoutMs: number;
  rpcAuth: string | null;
  vpnContainer: string;
  transmissionContainer: string;
  radarr: { url: string; apiKey: string | null };
  sonarr: { url: string; apiKey: string | null };
}

export function downloadsConfig(env: Env = process.env): DownloadsConfig {
  const user = env.TRANSMISSION_RPC_USER?.trim();
  const pass = env.TRANSMISSION_RPC_PASSWORD ?? "";
  return {
    rpcUrl: (env.TRANSMISSION_RPC_URL || "http://127.0.0.1:9091/transmission/rpc").trim(),
    webUrl: (env.TRANSMISSION_WEB_URL || "http://100.81.216.117:9091/transmission/web/").trim(),
    downloadRoot: pathModule.resolve((env.TORRENTS_DOWNLOAD_DIR || env.TRANSMISSION_DOWNLOAD_ROOT || "/mnt/hermes/torrents").trim()),
    timeoutMs: Number.parseInt(env.TRANSMISSION_RPC_TIMEOUT_MS || "4000", 10) || 4000,
    rpcAuth: user ? `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}` : null,
    vpnContainer: env.TRANSMISSION_VPN_CONTAINER || "gluetun",
    transmissionContainer: env.TRANSMISSION_CONTAINER || "transmission",
    radarr: { url: (env.RADARR_URL || "http://127.0.0.1:7878").replace(/\/+$/, ""), apiKey: env.RADARR_API_KEY?.trim() || null },
    sonarr: { url: (env.SONARR_URL || "http://127.0.0.1:8989").replace(/\/+$/, ""), apiKey: env.SONARR_API_KEY?.trim() || null },
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<globalThis.Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(t); }
}

export class TransmissionClient {
  private sessionId: string | null = null;
  constructor(private cfg: DownloadsConfig) {}

  async rpc<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.sessionId) headers["X-Transmission-Session-Id"] = this.sessionId;
      if (this.cfg.rpcAuth) headers.Authorization = this.cfg.rpcAuth;
      const r = await fetchWithTimeout(this.cfg.rpcUrl, { method: "POST", headers, body: JSON.stringify({ method, arguments: args }) }, this.cfg.timeoutMs);
      if (r.status === 409 && attempt === 0) { this.sessionId = r.headers.get("x-transmission-session-id"); continue; }
      const text = await r.text();
      if (!r.ok) throw new Error(`Transmission RPC ${method} failed (${r.status})`);
      const data = JSON.parse(text) as { result: string; arguments?: T };
      if (data.result !== "success") throw new Error(`Transmission RPC ${method} error: ${data.result}`);
      return (data.arguments ?? {}) as T;
    }
    throw new Error("Transmission RPC session negotiation failed");
  }
}

/** Subfolder under the torrents root; only simple names, never an arbitrary path. */
export function torrentDownloadDir(root: string, folder: unknown): string {
  const value = typeof folder === "string" ? folder.trim() : "";
  if (!value) return root;
  if (!/^[a-zA-Z0-9._ -]+$/.test(value) || value === "." || value === "..") throw new Error("invalid_folder");
  return pathModule.join(root, value);
}

function dockerInspect(name: string): Promise<{ running: boolean; healthy: boolean; status: string }> {
  return new Promise((resolve) => {
    execFile("docker", ["inspect", "-f", "{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}", name], { timeout: 4000 }, (err, stdout) => {
      if (err) return resolve({ running: false, healthy: false, status: "unknown" });
      const [status = "", health = ""] = String(stdout).trim().split("|");
      const running = status === "running";
      resolve({ running, healthy: health === "healthy" || (health === "none" && running), status: status || "unknown" });
    });
  });
}

async function arrStatus(name: "radarr" | "sonarr", svc: { url: string; apiKey: string | null }, timeoutMs: number) {
  if (!svc.apiKey) return { name, configured: false, ok: false, message: `${name.toUpperCase()}_API_KEY is not set` };
  try {
    const headers = { "X-Api-Key": svc.apiKey };
    const [st, q] = await Promise.all([
      fetchWithTimeout(`${svc.url}/api/v3/system/status`, { headers }, timeoutMs),
      fetchWithTimeout(`${svc.url}/api/v3/queue?pageSize=50`, { headers }, timeoutMs),
    ]);
    if (!st.ok) return { name, configured: true, ok: false, message: `status ${st.status}` };
    const status = await st.json() as { version?: string };
    const queue = q.ok ? await q.json() as { totalRecords?: number; records?: Array<Record<string, any>> } : { records: [] };
    return {
      name, configured: true, ok: true, version: status.version,
      queue: (queue.records ?? []).map((r) => ({ id: r.id, title: r.title, status: r.status, size: r.size, sizeleft: r.sizeleft, timeleft: r.timeleft, outputPath: r.outputPath })),
      queueTotal: queue.totalRecords ?? (queue.records ?? []).length,
    };
  } catch (e) {
    return { name, configured: true, ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export function registerDownloadsRoutes(app: Express, cfg: DownloadsConfig = downloadsConfig(), client = new TransmissionClient(cfg)) {
  const fail = (res: Response, route: string, e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    log(`${route} failed: ${message}`);
    if (message === "invalid_folder") return res.status(400).json({ ok: false, error: "bad_request", message: "Folder must be a simple name" });
    res.status(503).json({ ok: false, error: "transmission_unavailable", message });
  };

  app.get("/api/transmission/status", async (_req: Request, res: Response) => {
    try {
      const [vpn, transmission, session, stats, torrents] = await Promise.all([
        dockerInspect(cfg.vpnContainer),
        dockerInspect(cfg.transmissionContainer),
        client.rpc<Record<string, any>>("session-get"),
        client.rpc<Record<string, any>>("session-stats"),
        client.rpc<{ torrents?: Array<Record<string, any>> }>("torrent-get", {
          fields: ["id", "name", "status", "percentDone", "rateDownload", "rateUpload", "eta", "errorString", "totalSize", "downloadedEver", "uploadedEver", "downloadDir"],
        }).then((r) => r.torrents ?? []),
      ]);
      const rootExists = await fs.promises.access(cfg.downloadRoot).then(() => true, () => false);
      const rootWritable = await fs.promises.access(cfg.downloadRoot, fs.constants.W_OK).then(() => true, () => false);
      res.json({
        ok: true,
        webUrl: cfg.webUrl,
        containers: { vpn, transmission },
        session: { version: session.version, downloadDir: session["download-dir"], peerPort: session["peer-port"], portForwardingEnabled: session["port-forwarding-enabled"] },
        stats: { activeTorrentCount: stats.activeTorrentCount, downloadSpeed: stats.downloadSpeed, uploadSpeed: stats.uploadSpeed, pausedTorrentCount: stats.pausedTorrentCount, torrentCount: stats.torrentCount },
        torrents,
        storage: { root: cfg.downloadRoot, exists: rootExists, writable: rootWritable, sessionDirMatches: String(session["download-dir"] || "").replace(/\/+$/, "") === cfg.downloadRoot },
      });
    } catch (e) { fail(res, "GET /api/transmission/status", e); }
  });

  app.post("/api/transmission/add", async (req: Request, res: Response) => {
    try {
      const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
      if (!url) return res.status(400).json({ ok: false, error: "bad_request", message: "url is required" });
      if (!/^(magnet:\?|https?:\/\/)/i.test(url)) return res.status(400).json({ ok: false, error: "bad_request", message: "url must be a magnet link or http(s) .torrent URL" });
      const downloadDir = torrentDownloadDir(cfg.downloadRoot, req.body?.folder);
      const result = await client.rpc<Record<string, any>>("torrent-add", { filename: url, "download-dir": downloadDir });
      res.json({ ok: true, downloadDir, result });
    } catch (e) { fail(res, "POST /api/transmission/add", e); }
  });

  app.delete("/api/transmission/torrents/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: "bad_request", message: "invalid torrent id" });
      const result = await client.rpc<Record<string, any>>("torrent-remove", { ids: [id], "delete-local-data": Boolean(req.body?.deleteLocalData) });
      res.json({ ok: true, result });
    } catch (e) { fail(res, "DELETE /api/transmission/torrents/:id", e); }
  });

  app.post("/api/transmission/torrents/:id/:action", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const method = ({ start: "torrent-start", stop: "torrent-stop", verify: "torrent-verify" } as Record<string, string>)[String(req.params.action)];
      if (!Number.isInteger(id) || !method) return res.status(400).json({ ok: false, error: "bad_request", message: "invalid torrent id or action" });
      res.json({ ok: true, result: await client.rpc<Record<string, any>>(method, { ids: [id] }) });
    } catch (e) { fail(res, "POST /api/transmission/torrents/:id/:action", e); }
  });

  app.get("/api/arr/status", async (_req: Request, res: Response) => {
    const [radarr, sonarr] = await Promise.all([arrStatus("radarr", cfg.radarr, cfg.timeoutMs), arrStatus("sonarr", cfg.sonarr, cfg.timeoutMs)]);
    res.json({ radarr, sonarr });
  });
}
