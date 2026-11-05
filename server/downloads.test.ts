// Run: npx tsx --test server/downloads.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { downloadsConfig, registerDownloadsRoutes, torrentDownloadDir, TransmissionClient } from "./downloads";

test("config: torrents root from TORRENTS_DOWNLOAD_DIR, keys only from env", () => {
  const c = downloadsConfig({});
  assert.equal(c.downloadRoot, "/mnt/hermes/torrents");
  assert.equal(c.radarr.apiKey, null); assert.equal(c.sonarr.url, "http://127.0.0.1:8989");
  assert.equal(downloadsConfig({ TORRENTS_DOWNLOAD_DIR: "/x" }).downloadRoot, "/x");
  assert.equal(downloadsConfig({ TRANSMISSION_DOWNLOAD_ROOT: "/legacy" }).downloadRoot, "/legacy");
});

test("torrentDownloadDir only allows simple subfolders", () => {
  assert.equal(torrentDownloadDir("/mnt/hermes/torrents", ""), "/mnt/hermes/torrents");
  assert.equal(torrentDownloadDir("/mnt/hermes/torrents", "Movies"), "/mnt/hermes/torrents/Movies");
  assert.throws(() => torrentDownloadDir("/mnt/hermes/torrents", "../etc"));
  assert.throws(() => torrentDownloadDir("/mnt/hermes/torrents", "a/b"));
});

test("RPC: 409 session handshake, add sends download-dir under the torrents root", async () => {
  const calls: any[] = [];
  const rpc = http.createServer((req, res) => { let d = ""; req.on("data", (c) => d += c); req.on("end", () => {
    if (req.headers["x-transmission-session-id"] !== "sid") { res.writeHead(409, { "X-Transmission-Session-Id": "sid" }); return res.end(); }
    const body = JSON.parse(d); calls.push(body);
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ result: "success", arguments: { "torrent-added": { id: 1 } } }));
  }); });
  await new Promise<void>((ok) => rpc.listen(0, "127.0.0.1", () => ok()));
  const cfg = downloadsConfig({ TRANSMISSION_RPC_URL: `http://127.0.0.1:${(rpc.address() as any).port}/transmission/rpc`, TORRENTS_DOWNLOAD_DIR: "/mnt/hermes/torrents" });
  const app = express(); app.use(express.json()); registerDownloadsRoutes(app, cfg, new TransmissionClient(cfg));
  const srv = http.createServer(app); await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", () => ok()));
  const u = `http://127.0.0.1:${(srv.address() as any).port}`;
  try {
    const r = await fetch(`${u}/api/transmission/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "magnet:?xt=urn:btih:abc", folder: "Movies" }) });
    assert.equal(r.status, 200);
    assert.equal(calls[0].arguments["download-dir"], "/mnt/hermes/torrents/Movies");
    const bad = await fetch(`${u}/api/transmission/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "file:///etc/passwd" }) });
    assert.equal(bad.status, 400);
    const arr = await (await fetch(`${u}/api/arr/status`)).json();
    assert.equal(arr.radarr.configured, false);
  } finally { srv.close(); rpc.close(); }
});
