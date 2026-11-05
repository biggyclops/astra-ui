/**
 * Hermes SMB share registry.
 *
 * Each Hermes share is mounted on Mini-Beast under /mnt/hermes/<id> (see docs/hermes-shares.md).
 * Paths exchanged with the browser / AstraPhone are virtual: "/<shareId>/<relative path>".
 * Legacy forms are still accepted:
 *   /files/...                 -> storage share (old single-share layout)
 *   /uploads/astraphone/...    -> Astra Drive upload dir (AstraPhone compatibility)
 *   /files/uploads/astraphone  -> same
 * Every resolution is contained with realpath so symlinks cannot escape a share root.
 */
import fs from "node:fs";
import pathModule from "node:path";

export type ShareId = "storage" | "images" | "videos" | "torrents" | "astra-drive" | "backups" | "comfyui" | "projects";

export interface ShareDef {
  id: ShareId;
  label: string;
  smbName: string;
  root: string;
  writable: boolean;
  kind: "general" | "images" | "videos" | "downloads" | "drive" | "backups" | "generated" | "projects";
}

type Env = Record<string, string | undefined>;

const SHARE_BASE: Array<Omit<ShareDef, "root">> = [
  { id: "storage", label: "Hermes Storage", smbName: "0. Hermes Storage", writable: false, kind: "general" },
  { id: "images", label: "Hermes Images", smbName: "1. Hermes Images", writable: false, kind: "images" },
  { id: "videos", label: "Hermes Videos", smbName: "2. Hermes Videos", writable: false, kind: "videos" },
  { id: "torrents", label: "Hermes Torrents", smbName: "3. Hermes Torrents", writable: true, kind: "downloads" },
  { id: "astra-drive", label: "Astra Drive", smbName: "4. Astra Drive", writable: true, kind: "drive" },
  { id: "backups", label: "Hermes Backups", smbName: "5. Hermes Backups", writable: false, kind: "backups" },
  { id: "comfyui", label: "ComfyUI Files", smbName: "6. Comfyui files", writable: false, kind: "generated" },
  { id: "projects", label: "Projects", smbName: "7. Projects", writable: false, kind: "projects" },
];

export const SHARE_IDS: ShareId[] = SHARE_BASE.map((s) => s.id);

function envKey(id: ShareId): string {
  return `HERMES_SHARE_${id.replace(/-/g, "_").toUpperCase()}`;
}

export interface ShareConfig {
  shares: ShareDef[];
  astraDriveUploadDir: string;
  torrentsDownloadDir: string;
}

export function loadShareConfig(env: Env = process.env): ShareConfig {
  const base = (env.HERMES_SHARES_BASE || "/mnt/hermes").replace(/\/+$/, "");
  const shares = SHARE_BASE.map((s) => {
    let root = env[envKey(s.id)]?.trim();
    if (!root && s.id === "storage" && env.HERMES_LOCAL_PATH) root = env.HERMES_LOCAL_PATH.trim();
    return { ...s, root: pathModule.resolve(root || `${base}/${s.id}`) };
  });
  const byId = (id: ShareId) => shares.find((s) => s.id === id)!;
  return {
    shares,
    astraDriveUploadDir: pathModule.resolve(env.ASTRA_DRIVE_UPLOAD_DIR?.trim() || pathModule.join(byId("astra-drive").root, "astraphone")),
    torrentsDownloadDir: pathModule.resolve(env.TORRENTS_DOWNLOAD_DIR?.trim() || byId("torrents").root),
  };
}

export class PathError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export interface Resolved {
  share: ShareDef;
  abs: string;
  rel: string; // POSIX, no leading slash
  virtual: string; // "/<share>/<rel>"
}

function isInside(root: string, p: string): boolean {
  return p === root || p.startsWith(root.endsWith(pathModule.sep) ? root : root + pathModule.sep);
}

/** realpath of the deepest existing ancestor, with the non-existent tail re-appended. */
function realpathLoose(p: string): string {
  const tail: string[] = [];
  let cur = p;
  for (;;) {
    try {
      const real = fs.realpathSync.native(cur);
      return tail.length ? pathModule.join(real, ...tail.reverse()) : real;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") throw err;
      const parent = pathModule.dirname(cur);
      if (parent === cur) return p;
      tail.push(pathModule.basename(cur));
      cur = parent;
    }
  }
}

export class ShareRegistry {
  constructor(public readonly config: ShareConfig = loadShareConfig()) {}

  get shares(): ShareDef[] { return this.config.shares; }

  get(id: string): ShareDef | undefined { return this.config.shares.find((s) => s.id === id); }

  shareFor(abs: string): ShareDef | undefined {
    return this.config.shares.find((s) => isInside(s.root, abs));
  }

  mounted(share: ShareDef): boolean {
    try { return fs.statSync(share.root).isDirectory(); } catch { return false; }
  }

  toVirtual(abs: string): string {
    const share = this.shareFor(abs);
    if (!share) throw new PathError("Path is outside every Hermes share", 403);
    const rel = pathModule.relative(share.root, abs).split(pathModule.sep).filter(Boolean).join("/");
    return `/${share.id}/${rel}`;
  }

  /** Map a virtual or legacy path to { share, relative parts }. */
  private parse(raw: unknown): { share: ShareDef; relParts: string[]; baseAbs: string } {
    let p = typeof raw === "string" ? raw.trim() : "";
    try { p = decodeURIComponent(p); } catch { /* keep raw */ }
    p = p.replace(/\\/g, "/");
    if (p.includes("\0")) throw new PathError("Invalid path");
    const parts = p.split("/").filter(Boolean);
    if (parts.some((x) => x === "..")) throw new PathError("Path traversal not allowed", 403);
    const clean = parts.filter((x) => x !== ".");
    if (clean.length === 0) throw new PathError("A share is required, e.g. /videos/");

    // Legacy AstraPhone upload path -> Astra Drive upload dir
    const legacy = clean[0] === "files" ? clean.slice(1) : clean;
    if (legacy[0] === "uploads" && legacy[1] === "astraphone") {
      const drive = this.get("astra-drive")!;
      return { share: drive, relParts: legacy.slice(2), baseAbs: this.config.astraDriveUploadDir };
    }
    if (clean[0] === "files") {
      const storage = this.get("storage")!;
      return { share: storage, relParts: clean.slice(1), baseAbs: storage.root };
    }
    const share = this.get(clean[0]);
    if (!share) throw new PathError(`Unknown share: ${clean[0]}`, 404);
    return { share, relParts: clean.slice(1), baseAbs: share.root };
  }

  resolve(raw: unknown, opts: { write?: boolean } = {}): Resolved {
    const { share, relParts, baseAbs } = this.parse(raw);
    if (opts.write && !share.writable) throw new PathError(`${share.label} is read-only in Astra`, 403);
    if (!this.mounted(share)) throw new PathError(`${share.label} is not mounted on this server`, 503);
    const lexical = pathModule.resolve(baseAbs, ...relParts);
    if (!isInside(share.root, lexical)) throw new PathError("Path traversal not allowed", 403);
    const rootReal = fs.realpathSync.native(share.root);
    const real = realpathLoose(lexical);
    if (!isInside(rootReal, real)) throw new PathError("Path escapes the share", 403);
    const rel = pathModule.relative(rootReal, real).split(pathModule.sep).filter(Boolean).join("/");
    return { share, abs: real, rel, virtual: `/${share.id}/${rel}` };
  }

  /** Contain an already-absolute path (e.g. a multer destination) inside a share. */
  containAbs(abs: string, share: ShareDef): string {
    const rootReal = fs.realpathSync.native(share.root);
    const real = realpathLoose(pathModule.resolve(abs));
    if (!isInside(rootReal, real)) throw new PathError("Path escapes the share", 403);
    return real;
  }

  isShareRoot(r: Resolved): boolean { return r.rel === ""; }
}
