/**
 * IPTV Land TV control (iptv-land v1.7.0 recorder on Mini-Beast).
 * The recorder token lives only here (env IPTV_RECORDER_TOKEN); browsers and AstraPhone call /api/tv/* behind astra_session.
 */
import type { Express, Request, Response } from "express";
import { Readable } from "node:stream";

export interface TvProgramme { title: string; start: number; stop: number }
export interface TvResult { channelId: string; name: string; group: string; num?: number; match: "channel" | "now" | "upcoming"; programme: TvProgramme | null; now: TvProgramme | null; next: TvProgramme | null }
export interface TvConfig { url: string; token: string }
type FetchResponse = { ok: boolean; status: number; headers?: { get(name: string): string | null }; body?: any; json(): Promise<any> };
type Fetch = (url: string, init?: any) => Promise<FetchResponse>;

export class TvError extends Error { constructor(message: string, public status = 502) { super(message); } }

export function tvConfig(env: NodeJS.ProcessEnv = process.env): TvConfig | null {
  const url = (env.IPTV_RECORDER_URL || "").trim().replace(/\/+$/, "");
  const token = (env.IPTV_RECORDER_TOKEN || "").trim();
  return url && token ? { url, token } : null;
}

export class TvClient {
  constructor(private cfg: TvConfig, private f: Fetch = (u, i) => fetch(u, i), private timeoutMs = 5000) {}
  private async call(path: string, body?: unknown): Promise<any> {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), this.timeoutMs);
    let r;
    try {
      r = await this.f(this.cfg.url + path, { method: body ? "POST" : "GET", signal: ctl.signal,
        headers: { "X-Recorder-Token": this.cfg.token, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    } catch { throw new TvError("Can't reach the IPTV Land recorder", 502); } finally { clearTimeout(t); }
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) throw new TvError("Recorder rejected Astra's token", 502);
    if (!r.ok) throw new TvError(j.error || `Recorder error ${r.status}`, r.status === 404 || r.status === 400 || r.status === 503 ? r.status : 502);
    return j;
  }
  /** Adult channels are never returned to Astra (no PIN is ever sent). */
  async findChannel(query: string, limit = 8): Promise<TvResult[]> {
    const q = String(query || "").trim().slice(0, 200); if (!q) throw new TvError("query required", 400);
    const j = await this.call(`/guide/search?q=${encodeURIComponent(q)}&limit=${Math.min(20, Math.max(1, limit | 0))}`);
    return Array.isArray(j.results) ? j.results : [];
  }
  async tune(channelId: string) {
    const id = String(channelId || "").trim(); if (!id) throw new TvError("channelId required", 400);
    return this.call("/remote", { action: "tune", channelId: id });
  }
  async searchOnTv(query: string) {
    const q = String(query || "").trim().slice(0, 200); if (!q) throw new TvError("query required", 400);
    return this.call("/remote", { action: "search", query: q });
  }
  async openLiveStream(channelId: string, signal?: AbortSignal): Promise<FetchResponse> {
    const id = String(channelId || "").trim(); if (!id) throw new TvError("channelId required", 400);
    let r: FetchResponse;
    try {
      r = await this.f(`${this.cfg.url}/live/${encodeURIComponent(id)}/mp4`, { method: "GET", signal,
        headers: { "X-Recorder-Token": this.cfg.token } });
    } catch { throw new TvError("Can't reach the IPTV Land recorder", 502); }
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) throw new TvError("Recorder rejected Astra's token", 502);
      throw new TvError(j.error || `Recorder error ${r.status}`, r.status === 400 || r.status === 404 || r.status === 503 ? r.status : 502);
    }
    return r;
  }
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: process.env.TZ || "America/New_York" });
/** Compact text for the LLM. */
export const describeResults = (rs: TvResult[]) => rs.length ? rs.map(r => `${r.channelId} | ${r.name}${r.num ? ` (ch ${r.num})` : ""} | now: ${r.now ? r.now.title : "—"}${r.next ? ` | next ${clock(r.next.start)}: ${r.next.title}` : ""}${r.match === "upcoming" && r.programme ? ` | matched upcoming ${clock(r.programme.start)}: ${r.programme.title}` : ""}`).join("\n") : "No matching channels.";

export const TV_TOOLS = [
  { type: "function", function: { name: "find_channel", description: "Search the living-room TV's IPTV channels by channel name or by what is on now/soon (e.g. 'Celtics', 'CBS News'). Returns channelId, name, now and next.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Words to search for, e.g. 'celtics' or 'cbs news'" } }, required: ["query"] } } },
  { type: "function", function: { name: "tune", description: "Switch the TV (IPTV Land app) to a channel. Call find_channel first and pass its channelId.",
    parameters: { type: "object", properties: { channelId: { type: "string", description: "channelId from find_channel" } }, required: ["channelId"] } } },
];

/** Run one tool call from the model; always returns text for a role:"tool" message. */
export async function runTvTool(client: TvClient, name: string, args: any): Promise<string> {
  const a = typeof args === "string" ? (() => { try { return JSON.parse(args); } catch { return {}; } })() : args || {};
  try {
    if (name === "find_channel") return describeResults(await client.findChannel(a.query));
    if (name === "tune") { const c = await client.tune(a.channelId); return `Tuned the TV to ${c.name || a.channelId}. (If it is an adult channel the TV asks for its PIN.)`; }
    return `Unknown tool ${name}`;
  } catch (e) { return `TV error: ${(e as Error).message}`; }
}

type ChatMsg = { role: string; content: string; tool_calls?: any[] };
/**
 * Ollama /api/chat with the TV tools. Up to 3 tool rounds, then the final text.
 * Without TV config this is a plain single call (unchanged behaviour).
 */
export async function chatWithTvTools(ollamaUrl: string, payload: { model: string; messages: ChatMsg[]; stream: boolean }, client: TvClient | null, f: Fetch = (u, i) => fetch(u, i)): Promise<string> {
  const msgs = [...payload.messages];
  for (let round = 0; round < 4; round++) {
    const body: any = { ...payload, messages: msgs }; if (client && round < 3) body.tools = TV_TOOLS;
    const r = await f(`${ollamaUrl}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); const m = data.message || {};
    const calls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
    if (!client || !calls.length) return m.content || "Sorry, I couldn't generate a response.";
    msgs.push({ role: "assistant", content: m.content || "", tool_calls: calls });
    for (const c of calls) msgs.push({ role: "tool", content: await runTvTool(client, c.function?.name, c.function?.arguments) });
  }
  return "Sorry, I couldn't finish that TV request.";
}

const fail = (res: Response, e: unknown) => { const err = e as TvError; res.status(err.status && err.status < 600 ? err.status : 502).json({ error: err.message || "TV error" }); };

/** Register after the astra_session gate. */
export function registerTvRoutes(app: Express, getClient: () => TvClient | null = () => { const c = tvConfig(); return c ? new TvClient(c) : null; }) {
  const need = (res: Response) => { const c = getClient(); if (!c) res.status(503).json({ error: "TV control is not configured (IPTV_RECORDER_URL / IPTV_RECORDER_TOKEN)" }); return c; };
  app.get("/api/tv/search", async (req: Request, res: Response) => { const c = need(res); if (!c) return;
    try { res.json({ results: await c.findChannel(String(req.query.q || ""), Number(req.query.limit) || 12) }); } catch (e) { fail(res, e); } });
  app.post("/api/tv/tune", async (req: Request, res: Response) => { const c = need(res); if (!c) return;
    try { const r = await c.tune(req.body?.channelId); res.json({ ok: true, channelId: r.channelId, name: r.name }); } catch (e) { fail(res, e); } });
  app.post("/api/tv/search-on-tv", async (req: Request, res: Response) => { const c = need(res); if (!c) return;
    try { const r = await c.searchOnTv(req.body?.query); res.json({ ok: true, query: r.query }); } catch (e) { fail(res, e); } });
  app.get("/api/tv/stream/:channelId", async (req: Request, res: Response) => { const c = need(res); if (!c) return;
    const ctl = new AbortController(); req.on("aborted", () => ctl.abort());
    try {
      const upstream = await c.openLiveStream(String(req.params.channelId || ""), ctl.signal);
      res.status(200); res.setHeader("Content-Type", upstream.headers?.get("content-type") || "video/mp4");
      res.setHeader("Cache-Control", "no-store"); res.setHeader("X-Content-Type-Options", "nosniff");
      if (!upstream.body) return res.end();
      const stream = Readable.fromWeb(upstream.body as any); res.on("close", () => stream.destroy()); stream.on("error", () => res.destroy()); stream.pipe(res);
    } catch (e) { if (!res.headersSent) fail(res, e); else res.destroy(); }
  });
}
