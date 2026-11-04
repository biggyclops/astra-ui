// Run: npx tsx --test server/files.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import express from "express";
import { loadShareConfig, ShareRegistry, SHARE_IDS } from "./hermes-shares";
import { registerFilesRoutes, isMultipartAllowed } from "./files";

function fixture() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "hermes-"));
  for (const id of SHARE_IDS) if (id !== "projects") fs.mkdirSync(path.join(base, id)); // projects left unmounted
  fs.mkdirSync(path.join(base, "astra-drive", "astraphone"));
  fs.writeFileSync(path.join(base, "videos", "clip.mp4"), Buffer.alloc(2048, 7));
  fs.writeFileSync(path.join(base, "videos", "._clip.mp4"), "x");
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "outside-"));
  fs.writeFileSync(path.join(outside, "secret.txt"), "nope");
  fs.symlinkSync(outside, path.join(base, "videos", "escape"));
  const reg = new ShareRegistry(loadShareConfig({ HERMES_SHARES_BASE: base }));
  return { base, outside, reg };
}

async function serve(reg: ShareRegistry) {
  const app = express(); app.use(express.json());
  app.use("/api", (req, res, next) => {
    const ct = String(req.headers["content-type"] || "");
    if (req.method !== "GET" && req.headers["content-length"] && req.headers["content-length"] !== "0"
      && !ct.includes("application/json") && !(ct.startsWith("multipart/form-data") && isMultipartAllowed(req.method, req.originalUrl))) return res.status(415).end();
    next();
  });
  registerFilesRoutes(app, reg);
  const srv = http.createServer(app);
  await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", () => ok()));
  return { url: `http://127.0.0.1:${(srv.address() as any).port}`, close: () => srv.close() };
}

test("defaults map every share under /mnt/hermes and env overrides win", () => {
  const c = loadShareConfig({});
  assert.deepEqual(c.shares.map((s) => s.root), SHARE_IDS.map((id) => `/mnt/hermes/${id}`));
  assert.equal(c.astraDriveUploadDir, "/mnt/hermes/astra-drive/astraphone");
  assert.equal(c.torrentsDownloadDir, "/mnt/hermes/torrents");
  assert.deepEqual(c.shares.filter((s) => s.writable).map((s) => s.id), ["torrents", "astra-drive"]);
  const o = loadShareConfig({ HERMES_SHARE_ASTRA_DRIVE: "/x/drive", HERMES_LOCAL_PATH: "/old/storage", TORRENTS_DOWNLOAD_DIR: "/t" });
  assert.equal(o.shares.find((s) => s.id === "astra-drive")!.root, "/x/drive");
  assert.equal(o.shares.find((s) => s.id === "storage")!.root, "/old/storage");
  assert.equal(o.astraDriveUploadDir, "/x/drive/astraphone");
  assert.equal(o.torrentsDownloadDir, "/t");
});

test("resolve: virtual, legacy /files and legacy /uploads/astraphone", () => {
  const { base, reg } = fixture();
  assert.equal(reg.resolve("/videos/clip.mp4").abs, fs.realpathSync(path.join(base, "videos", "clip.mp4")));
  assert.equal(reg.resolve("/files/").share.id, "storage");
  for (const legacy of ["/uploads/astraphone", "/files/uploads/astraphone/", "uploads/astraphone/sub"]) {
    const r = reg.resolve(legacy, { write: true });
    assert.equal(r.share.id, "astra-drive");
    assert.ok(r.virtual.startsWith("/astra-drive/astraphone"));
  }
});

test("containment: .., symlink escape, read-only shares, unmounted share", () => {
  const { reg } = fixture();
  assert.throws(() => reg.resolve("/videos/../storage"), /traversal/);
  assert.throws(() => reg.resolve("/videos/escape/secret.txt"), /escapes/);
  assert.throws(() => reg.resolve("/videos/escape/new-dir/x", { write: true }), /read-only|escapes/);
  assert.throws(() => reg.resolve("/images/a", { write: true }), /read-only/);
  assert.throws(() => reg.resolve("/projects/"), /not mounted/);
  assert.throws(() => reg.resolve("/nope/"), /Unknown share/);
  assert.equal(reg.resolve("/torrents/new", { write: true }).share.id, "torrents");
});

test("multipart exception is scoped to POST upload routes", () => {
  assert.equal(isMultipartAllowed("POST", "/api/files/upload?path=/astra-drive/"), true);
  assert.equal(isMultipartAllowed("POST", "/api/files/upload-media"), true);
  assert.equal(isMultipartAllowed("PUT", "/api/files/upload"), false);
  assert.equal(isMultipartAllowed("POST", "/api/files/folder"), false);
  assert.equal(isMultipartAllowed("POST", "/api/transmission/add"), false);
});

test("HTTP: shares, listing hides AppleDouble, range stream, upload legacy path, read-only refusal", async () => {
  const { base, reg } = fixture();
  const s = await serve(reg);
  try {
    const shares = await (await fetch(`${s.url}/api/files/shares`)).json();
    assert.equal(shares.shares.length, 8);
    assert.equal(shares.shares.find((x: any) => x.id === "projects").mounted, false);
    assert.equal(shares.astraDriveUploadPath, "/astra-drive/astraphone");

    const list = await (await fetch(`${s.url}/api/files?path=${encodeURIComponent("/videos/")}`)).json();
    assert.deepEqual(list.entries.map((e: any) => e.name).sort(), ["clip.mp4", "escape"]);

    const part = await fetch(`${s.url}/api/files/stream?path=/videos/clip.mp4`, { headers: { Range: "bytes=0-99" } });
    assert.equal(part.status, 206); assert.equal((await part.arrayBuffer()).byteLength, 100);

    const fd = new FormData(); fd.append("files", new Blob(["hello"]), "note.txt");
    const up = await fetch(`${s.url}/api/files/upload?path=${encodeURIComponent("/uploads/astraphone")}`, { method: "POST", body: fd });
    assert.equal(up.status, 201);
    assert.deepEqual((await up.json()).uploaded, ["/astra-drive/astraphone/note.txt"]);
    assert.equal(fs.readFileSync(path.join(base, "astra-drive", "astraphone", "note.txt"), "utf8"), "hello");

    const fd2 = new FormData(); fd2.append("files", new Blob(["x"]), "a.txt");
    const ro = await fetch(`${s.url}/api/files/upload?path=/videos/`, { method: "POST", body: fd2 });
    assert.equal(ro.status, 403);

    const fd3 = new FormData(); fd3.append("files", new Blob(["x"]), "a.txt");
    assert.equal((await fetch(`${s.url}/api/files/folder`, { method: "POST", body: fd3 })).status, 415);

    const del = await fetch(`${s.url}/api/files`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "/astra-drive/" }) });
    assert.equal(del.status, 400);
    const mk = await fetch(`${s.url}/api/files/folder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "/torrents/", name: "Movies" }) });
    assert.equal(mk.status, 201);
    const mv = await fetch(`${s.url}/api/files/move`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paths: ["/astra-drive/astraphone/note.txt"], targetDir: "/torrents/Movies" }) });
    assert.equal(mv.status, 400); // cross-share move refused
  } finally { s.close(); }
});
