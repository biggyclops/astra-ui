/**
 * /api/files: Hermes share browser, download, upload, folder, delete, move.
 * Ported from the pre-cutover prod tree (single FILES_ROOT) onto the share registry.
 * Registered after the /api session gate; only POST /api/files/upload(-media) may be multipart
 * (see isMultipartAllowed, used by the CSRF middleware in routes.ts).
 */
import type { Express, Request, Response } from "express";
import fs from "node:fs";
import pathModule from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { PathError, ShareRegistry, type Resolved } from "./hermes-shares";
import { log } from "./logger";

export const MULTIPART_PATHS = new Set(["/api/files/upload", "/api/files/upload-media"]);

/** Scoped CSRF exception: multipart is accepted only on POST to the upload endpoints. */
export function isMultipartAllowed(method: string, originalUrl: string): boolean {
  if (method.toUpperCase() !== "POST") return false;
  const path = originalUrl.split("?")[0].replace(/\/+$/, "");
  return MULTIPART_PATHS.has(path);
}

const FILE_UPLOAD_MAX_COUNT = 500;
const MAX_FILE_BYTES = 25 * 1024 * 1024 * 1024;
const MEDIA_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "mkv"]);

function sendError(res: Response, error: unknown, fallback: string, route: string) {
  const status = error instanceof PathError ? error.status : 400;
  const message = error instanceof Error ? error.message : fallback;
  log(`${route} failed: ${message}`);
  if (!res.headersSent) res.status(status).json({ error: true, message });
}

export function sanitizeUploadPath(originalName: string): { dir: string; filename: string } {
  const cleanParts = originalName
    .split(/[\\/]+/)
    .map((part) => part.replace(/[^a-zA-Z0-9._ -]+/g, "_").trim())
    .filter((part) => part && part !== "." && part !== "..");
  const filename = cleanParts.pop() || `upload-${Date.now()}`;
  return { dir: cleanParts.join(pathModule.sep), filename };
}

function uniqueName(dir: string, filename: string): string {
  const parsed = pathModule.parse(filename);
  const base = (parsed.name || "upload").replace(/[^a-zA-Z0-9._ -]+/g, "_").trim() || "upload";
  const ext = parsed.ext.replace(/[^a-zA-Z0-9.]+/g, "");
  let candidate = `${base}${ext}`;
  for (let n = 1; fs.existsSync(pathModule.join(dir, candidate)); n++) candidate = `${base}-${n}${ext}`;
  return candidate;
}

export function registerFilesRoutes(app: Express, registry = new ShareRegistry(), hooks: { onChange?: () => void } = {}) {
  const changed = () => { try { hooks.onChange?.(); } catch { /* best effort */ } };

  app.get("/api/files/shares", (_req: Request, res: Response) => {
    res.json({
      shares: registry.shares.map((s) => ({
        id: s.id, label: s.label, smbName: s.smbName, kind: s.kind, writable: s.writable,
        mounted: registry.mounted(s), path: `/${s.id}/`,
      })),
      astraDriveUploadPath: registry.toVirtual(registry.config.astraDriveUploadDir),
    });
  });

  app.get("/api/files", async (req: Request, res: Response) => {
    try {
      const r = registry.resolve(req.query.path ?? "/storage/");
      const names = await fs.promises.readdir(r.abs);
      const entries = (await Promise.all(names.filter((n) => !n.startsWith("._") && n !== ".DS_Store").map(async (name) => {
        const stat = await fs.promises.stat(pathModule.join(r.abs, name)).catch(() => null);
        if (!stat) return null;
        return { name, path: `${r.virtual.replace(/\/$/, "")}/${name}`, isDir: stat.isDirectory(), size: stat.size, modified: stat.mtime };
      }))).filter(Boolean) as Array<{ name: string; isDir: boolean }>;
      entries.sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name, undefined, { sensitivity: "base" })));
      res.setHeader("Cache-Control", "no-store");
      res.json({ share: r.share.id, writable: r.share.writable, path: r.virtual, entries });
    } catch (error) { sendError(res, error, "Unable to read files", "GET /api/files"); }
  });

  app.get("/api/files/download", async (req: Request, res: Response) => {
    try {
      const r = registry.resolve(req.query.path);
      const stat = await fs.promises.stat(r.abs);
      if (!stat.isFile()) return res.status(404).json({ error: true, message: "File not found" });
      res.download(r.abs);
    } catch (error) { sendError(res, error, "Unable to download file", "GET /api/files/download"); }
  });

  const CT: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska", m4v: "video/mp4",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", mp3: "audio/mpeg", pdf: "application/pdf", txt: "text/plain; charset=utf-8" };

  // Inline streaming with HTTP Range (video/audio/image preview).
  app.get("/api/files/stream", async (req: Request, res: Response) => {
    try {
      const r = registry.resolve(req.query.path);
      const stat = await fs.promises.stat(r.abs);
      if (!stat.isFile()) return res.status(404).json({ error: true, message: "File not found" });
      const type = CT[pathModule.extname(r.abs).slice(1).toLowerCase()] || "application/octet-stream";
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Type", type);
      res.setHeader("X-Content-Type-Options", "nosniff");
      const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ""));
      if (m && (m[1] || m[2])) {
        const start = m[1] ? Number(m[1]) : Math.max(0, stat.size - Number(m[2]));
        const end = m[1] && m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1;
        if (start >= stat.size || start > end) { res.setHeader("Content-Range", `bytes */${stat.size}`); return res.status(416).end(); }
        res.status(206).setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
        res.setHeader("Content-Length", String(end - start + 1));
        return fs.createReadStream(r.abs, { start, end }).pipe(res);
      }
      res.setHeader("Content-Length", String(stat.size));
      fs.createReadStream(r.abs).pipe(res);
    } catch (error) { sendError(res, error, "Unable to stream file", "GET /api/files/stream"); }
  });

  const uploadTarget = (req: Request): Resolved => {
    const raw = req.query.path ?? registry.toVirtual(registry.config.astraDriveUploadDir);
    return registry.resolve(raw, { write: true });
  };

  const filesUpload = multer({
    preservePath: true,
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        try {
          const target = uploadTarget(req);
          const { dir } = sanitizeUploadPath(file.originalname);
          const dest = registry.containAbs(pathModule.resolve(target.abs, dir), target.share);
          fs.mkdirSync(dest, { recursive: true });
          (file as any)._astraDest = dest;
          cb(null, dest);
        } catch (error) { cb(error as Error, ""); }
      },
      filename: (_req, file, cb) => {
        try {
          const dest = (file as any)._astraDest as string;
          cb(null, uniqueName(dest, sanitizeUploadPath(file.originalname).filename));
        } catch (error) { cb(error as Error, ""); }
      },
    }),
    limits: { files: FILE_UPLOAD_MAX_COUNT, fileSize: MAX_FILE_BYTES },
  });

  const handleUpload = (field: string, max: number, upload: multer.Multer, route: string, empty: string) =>
    (req: Request, res: Response) => {
      upload.array(field, max)(req, res, (error) => {
        if (error) return sendError(res, error, "Upload failed", route);
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        if (files.length === 0) return res.status(400).json({ error: true, message: empty });
        changed();
        res.status(201).json({ ok: true, uploaded: files.map((f) => registry.toVirtual(f.path)) });
      });
    };

  app.post("/api/files/upload", handleUpload("files", FILE_UPLOAD_MAX_COUNT, filesUpload, "POST /api/files/upload", "Choose one or more files to upload"));

  // Media Wall drops land in Astra Drive (storage is read-only in Astra after the share split).
  const mediaWallUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, file, cb) => {
        try {
          const r = registry.resolve("/astra-drive/media-wall", { write: true });
          fs.mkdirSync(r.abs, { recursive: true });
          (file as any)._astraDest = r.abs;
          cb(null, r.abs);
        } catch (error) { cb(error as Error, ""); }
      },
      filename: (_req, file, cb) => {
        const original = pathModule.basename(file.originalname).replace(/[^a-zA-Z0-9._ -]+/g, "_");
        cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${original || "upload"}`);
      },
    }),
    fileFilter: (_req, file, cb) => cb(null, MEDIA_EXT.has(pathModule.extname(file.originalname).slice(1).toLowerCase())),
    limits: { files: 50, fileSize: MAX_FILE_BYTES },
  });
  app.post("/api/files/upload-media", handleUpload("files", 50, mediaWallUpload, "POST /api/files/upload-media", "Drop one or more supported image or video files"));

  app.post("/api/files/folder", async (req: Request, res: Response) => {
    const name = (typeof req.body?.name === "string" ? req.body.name : "").replace(/[\\/]+/g, "").trim();
    if (!name || name === "." || name === "..") return res.status(400).json({ error: true, message: "Folder name required" });
    try {
      const parent = registry.resolve(req.body?.path, { write: true });
      if (!(await fs.promises.stat(parent.abs)).isDirectory()) return res.status(400).json({ error: true, message: "Parent path must be a folder" });
      const target = registry.containAbs(pathModule.join(parent.abs, name), parent.share);
      await fs.promises.mkdir(target, { recursive: false });
      changed();
      res.status(201).json({ ok: true, path: registry.toVirtual(target), name });
    } catch (error) { sendError(res, error, "Unable to create folder", "POST /api/files/folder"); }
  });

  app.delete("/api/files", async (req: Request, res: Response) => {
    const raw: unknown[] = Array.isArray(req.body?.paths) ? req.body.paths : [req.body?.path];
    const paths = raw.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
    if (paths.length === 0) return res.status(400).json({ error: true, message: "path or paths required" });
    try {
      const targets = paths.map((p) => registry.resolve(p, { write: true }));
      if (targets.some((t) => registry.isShareRoot(t))) return res.status(400).json({ error: true, message: "Cannot remove a share root" });
      const removed: string[] = [];
      for (const t of targets) { await fs.promises.rm(t.abs, { recursive: true, force: false }); removed.push(t.virtual); }
      changed();
      res.json({ ok: true, removed });
    } catch (error) { sendError(res, error, "Unable to delete file", "DELETE /api/files"); }
  });

  app.patch("/api/files/move", async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const raw: unknown[] = Array.isArray(body.paths) ? body.paths : [body.from ?? body.path];
    const paths = raw.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
    const targetDirRaw = typeof body.targetDir === "string" ? body.targetDir : typeof body.toDir === "string" ? body.toDir : null;
    const explicitTo = paths.length === 1 && typeof body.to === "string" ? body.to : null;
    if (paths.length === 0 || (!targetDirRaw && !explicitTo)) return res.status(400).json({ error: true, message: "paths and targetDir required" });
    try {
      const targetDir = targetDirRaw ? registry.resolve(targetDirRaw, { write: true }) : null;
      if (targetDir && !(await fs.promises.stat(targetDir.abs)).isDirectory()) return res.status(400).json({ error: true, message: "targetDir must be a directory" });
      const moved: Array<{ from: string; to: string }> = [];
      for (const p of paths) {
        const from = registry.resolve(p, { write: true });
        if (registry.isShareRoot(from)) return res.status(400).json({ error: true, message: "Cannot move a share root" });
        await fs.promises.stat(from.abs);
        const to = explicitTo
          ? registry.resolve(explicitTo, { write: true })
          : registry.resolve(`${targetDir!.virtual.replace(/\/$/, "")}/${pathModule.basename(from.abs)}`, { write: true });
        if (to.share.id !== from.share.id) return res.status(400).json({ error: true, message: "Moving between shares is not supported" });
        if (to.abs === from.abs) continue;
        if (to.abs.startsWith(`${from.abs}${pathModule.sep}`)) return res.status(400).json({ error: true, message: "Cannot move a folder inside itself" });
        await fs.promises.rename(from.abs, to.abs);
        moved.push({ from: from.virtual, to: to.virtual });
      }
      changed();
      res.json({ ok: true, moved });
    } catch (error) { sendError(res, error, "Unable to move file", "PATCH /api/files/move"); }
  });
}
