// Run: npx tsx --test server/tv.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { TvClient, tvConfig, chatWithTvTools, registerTvRoutes, runTvTool, TV_TOOLS } from "./tv";

const TOKEN = "rec-token-test";
function fakeRecorder() {
  const seen: { path: string; token?: string; body?: any }[] = [];
  const srv = http.createServer((req, res) => { let d = ""; req.on("data", c => d += c); req.on("end", () => {
    const token = req.headers["x-recorder-token"] as string | undefined; seen.push({ path: req.url!, token, body: d ? JSON.parse(d) : undefined });
    const j = (code: number, o: any) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
    if (token !== TOKEN) return j(401, { error: "unauthorized" });
    if (req.url!.startsWith("/guide/search")) return j(200, { results: [{ channelId: "101", name: "NBC Sports Boston", group: "US Sports", num: 12, match: "now", programme: { title: "NBA: Celtics at Knicks", start: 0, stop: 1 },
      now: { title: "NBA: Celtics at Knicks", start: 0, stop: 1 }, next: { title: "Celtics Postgame", start: 1, stop: 2 } }] });
    if (req.url === "/guide/channels") return j(200, { channels: [{ channelId: "101", name: "NBC Sports Boston", group: "US Sports", num: 12, match: "channel", programme: null, now: null, next: null }] });
    if (req.url === "/live/101/mp4") { res.writeHead(200, { "Content-Type": "video/mp4" }); return res.end("LIVE-MP4"); }
    if (req.url === "/remote") { const b = JSON.parse(d); if (b.action === "tune" && b.channelId !== "101") return j(404, { error: "unknown channelId" }); return j(201, { seq: 1, ...b, name: b.channelId === "101" ? "NBC Sports Boston" : undefined }); }
    j(404, { error: "not found" }); }); });
  return new Promise<{ url: string; seen: typeof seen; close: () => void }>(ok => srv.listen(0, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${(srv.address() as any).port}`, seen, close: () => srv.close() })));
}

test("tvConfig needs both env vars", () => {
  assert.equal(tvConfig({}), null); assert.equal(tvConfig({ IPTV_RECORDER_URL: "http://x" }), null);
  assert.deepEqual(tvConfig({ IPTV_RECORDER_URL: "http://mb:5070/", IPTV_RECORDER_TOKEN: "t" }), { url: "http://mb:5070", token: "t" });
});

test("client: find_channel and tune send the token, never a PIN", async () => {
  const r = await fakeRecorder(); try {
    const c = new TvClient({ url: r.url, token: TOKEN });
    const res = await c.findChannel("celtics game"); assert.equal(res[0].channelId, "101");
    assert.match(r.seen[0].path, /^\/guide\/search\?q=celtics%20game&limit=8$/); assert.equal(r.seen[0].token, TOKEN); assert.ok(!/pin=/.test(r.seen[0].path));
    assert.equal((await c.tune("101")).name, "NBC Sports Boston"); assert.deepEqual(r.seen[1].body, { action: "tune", channelId: "101" });
    await assert.rejects(c.tune("999"), (e: any) => e.status === 404);
    await assert.rejects(new TvClient({ url: r.url, token: "wrong" }).findChannel("x"), /rejected/);
    await assert.rejects(new TvClient({ url: "http://127.0.0.1:1", token: TOKEN }).findChannel("x"), /Can't reach/);
    assert.match(await runTvTool(c, "find_channel", JSON.stringify({ query: "celtics" })), /101 \| NBC Sports Boston \(ch 12\) \| now: NBA: Celtics at Knicks/);
    assert.match(await runTvTool(c, "tune", { channelId: "999" }), /TV error: unknown channelId/);
  } finally { r.close(); }
});

test("chat: Ollama tool calls run find_channel then tune, final text returned", async () => {
  const r = await fakeRecorder(); const sent: any[] = [];
  const answers = [
    { message: { content: "", tool_calls: [{ function: { name: "find_channel", arguments: { query: "celtics" } } }] } },
    { message: { content: "", tool_calls: [{ function: { name: "tune", arguments: { channelId: "101" } } }] } },
    { message: { content: "The Celtics game is on NBC Sports Boston. I've put it on." } }];
  const f = async (_u: string, i: any) => { sent.push(JSON.parse(i.body)); return { ok: true, status: 200, json: async () => answers[sent.length - 1] }; };
  try {
    const out = await chatWithTvTools("http://ollama", { model: "m", stream: false, messages: [{ role: "user", content: "Astra, find the Celtics game and put it on" }] }, new TvClient({ url: r.url, token: TOKEN }), f);
    assert.equal(out, "The Celtics game is on NBC Sports Boston. I've put it on.");
    assert.deepEqual(sent[0].tools, TV_TOOLS); assert.equal(sent[1].messages.at(-1).role, "tool"); assert.match(sent[1].messages.at(-1).content, /NBC Sports Boston/);
    assert.match(sent[2].messages.at(-1).content, /Tuned the TV to NBC Sports Boston/); assert.ok(!JSON.stringify(sent).includes(TOKEN), "token never goes to the model");
    const plain = await chatWithTvTools("http://ollama", { model: "m", stream: false, messages: [] }, null, async (_u, i) => { assert.equal(JSON.parse(i.body).tools, undefined); return { ok: true, status: 200, json: async () => ({ message: { content: "hi" } }) }; });
    assert.equal(plain, "hi");
  } finally { r.close(); }
});

test("REST: /api/tv/* behind the session gate; token not in responses", async () => {
  const r = await fakeRecorder(); const app = express(); app.use(express.json());
  app.use("/api", (req, res, next) => req.headers.cookie === "astra_session=ok" ? next() : res.status(401).json({ error: "unauthorized" }));
  registerTvRoutes(app, () => new TvClient({ url: r.url, token: TOKEN }));
  const s = app.listen(0); const b = `http://127.0.0.1:${(s.address() as any).port}`; const C = { cookie: "astra_session=ok", "Content-Type": "application/json" };
  try {
    assert.equal((await fetch(b + "/api/tv/search?q=celtics")).status, 401);
    const sr = await fetch(b + "/api/tv/search?q=celtics", { headers: C }); const txt = await sr.text(); assert.equal(sr.status, 200); assert.ok(!txt.includes(TOKEN)); assert.equal(JSON.parse(txt).results[0].next.title, "Celtics Postgame");
    const br = await fetch(b + "/api/tv/channels", { headers: C }); assert.equal(br.status, 200); assert.equal((await br.json()).channels[0].name, "NBC Sports Boston");
    const tr = await fetch(b + "/api/tv/tune", { method: "POST", headers: C, body: JSON.stringify({ channelId: "101" }) }); assert.deepEqual(await tr.json(), { ok: true, channelId: "101", name: "NBC Sports Boston" });
    assert.equal((await fetch(b + "/api/tv/tune", { method: "POST", headers: C, body: JSON.stringify({ channelId: "999" }) })).status, 404);
    assert.deepEqual(await (await fetch(b + "/api/tv/search-on-tv", { method: "POST", headers: C, body: JSON.stringify({ query: "celtics" }) })).json(), { ok: true, query: "celtics" });
    assert.equal((await fetch(b + "/api/tv/stream/101")).status, 401);
    const stream = await fetch(b + "/api/tv/stream/101", { headers: C }); assert.equal(stream.status, 200); assert.equal(stream.headers.get("content-type"), "video/mp4"); assert.equal(await stream.text(), "LIVE-MP4");
    assert.equal(r.seen.at(-1)?.token, TOKEN); assert.equal(r.seen.at(-1)?.path, "/live/101/mp4");
    assert.equal((await fetch(b + "/api/tv/search?q=", { headers: C })).status, 400);
  } finally { s.close(); r.close(); }
  const app2 = express(); registerTvRoutes(app2, () => null); const s2 = app2.listen(0);
  try { assert.equal((await fetch(`http://127.0.0.1:${(s2.address() as any).port}/api/tv/search?q=x`)).status, 503); } finally { s2.close(); }
});
