import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, Folder, FileText, Upload, FolderPlus, Trash2, Download, Lock, Loader2, ChevronRight, Image as ImageIcon, Film, Archive, Sparkles, Briefcase, CloudDownload } from "lucide-react";

/** Hermes shares browser. Paths are virtual: /<share>/<relative>. Writes only on Torrents and Astra Drive. */
interface Share { id: string; label: string; smbName: string; kind: string; writable: boolean; mounted: boolean; path: string }
interface Entry { name: string; path: string; isDir: boolean; size: number; modified: string }
interface Listing { share: string; writable: boolean; path: string; entries: Entry[] }

const ICONS: Record<string, typeof HardDrive> = { general: HardDrive, images: ImageIcon, videos: Film, downloads: CloudDownload, drive: Upload, backups: Archive, generated: Sparkles, projects: Briefcase };
const VIDEO = /\.(mp4|webm|mov|m4v|mkv)$/i;
const IMAGE = /\.(jpe?g|png|webp|gif)$/i;

function fmtSize(n: number) { if (n < 1024) return `${n} B`; const u = ["KB", "MB", "GB", "TB"]; let i = -1; do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1); return `${n.toFixed(n < 10 ? 1 : 0)} ${u[i]}`; }

async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const r = await fetch(path, { method: init?.method || "GET", credentials: "include", headers: init?.body ? { "Content-Type": "application/json" } : undefined, body: init?.body ? JSON.stringify(init.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || j.error || `Request failed (${r.status})`);
  return j as T;
}

export default function Files() {
  const [shares, setShares] = useState<Share[]>([]);
  const [path, setPath] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Entry | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { api<{ shares: Share[] }>("/api/files/shares").then((r) => setShares(r.shares)).catch((e) => setError(e.message)); }, []);

  const load = useCallback(async (p: string) => {
    setBusy(true); setError(""); setPreview(null);
    try { setListing(await api<Listing>(`/api/files?path=${encodeURIComponent(p)}`)); setPath(p); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }, []);

  const crumbs = path ? path.split("/").filter(Boolean) : [];
  const share = shares.find((s) => s.id === crumbs[0]);

  async function upload(files: FileList | null) {
    if (!files?.length || !path) return;
    const fd = new FormData(); Array.from(files).forEach((f) => fd.append("files", f, f.name));
    setBusy(true); setError("");
    try {
      const r = await fetch(`/api/files/upload?path=${encodeURIComponent(path)}`, { method: "POST", credentials: "include", body: fd });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || "Upload failed");
      await load(path);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
  async function newFolder() {
    const name = window.prompt("Folder name"); if (!name || !path) return;
    try { await api("/api/files/folder", { method: "POST", body: { path, name } }); await load(path); } catch (e) { setError((e as Error).message); }
  }
  async function remove(e: Entry) {
    if (!path || !window.confirm(`Delete “${e.name}”${e.isDir ? " and everything in it" : ""}?`)) return;
    try { await api("/api/files", { method: "DELETE", body: { path: e.path } }); await load(path); } catch (err) { setError((err as Error).message); }
  }

  return (
    <div className="min-h-screen bg-background p-8 pl-10 pt-20" data-testid="page-files">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Files</h1>
        <p className="text-muted-foreground">Every Hermes share, mounted on Mini-Beast. Torrents and Astra Drive are writable; the rest are read-only here.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="grid-shares">
        {shares.map((s, i) => {
          const Icon = ICONS[s.kind] || HardDrive; const active = crumbs[0] === s.id;
          return (
            <motion.button key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              disabled={!s.mounted} onClick={() => load(s.path)} data-testid={`tile-share-${s.id}`} title={s.smbName}
              className={`text-left rounded-[22px] border p-4 transition-colors backdrop-blur-xl ${active ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-white/[0.04] hover:border-cyan-400/40"} disabled:opacity-40 disabled:cursor-not-allowed`}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-cyan-400/15 text-cyan-300"><Icon className="w-5 h-5" /></div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${s.writable ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/5 text-zinc-400"}`}>
                  {!s.mounted ? "Not mounted" : s.writable ? "Read / write" : "Read only"}
                </span>
              </div>
              <div className="font-semibold text-white truncate">{s.label}</div>
              <div className="text-[11px] font-mono text-zinc-500 truncate">/mnt/hermes/{s.id}</div>
            </motion.button>
          );
        })}
      </div>

      <section className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <nav className="flex items-center gap-1 text-sm font-mono flex-1 min-w-0" data-testid="breadcrumbs">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
                <button className="truncate text-cyan-300 hover:underline" onClick={() => load(`/${crumbs.slice(0, i + 1).join("/")}/`)}>{i === 0 ? share?.label ?? c : c}</button>
              </span>
            ))}
            {!path && <span className="text-zinc-500">Choose a share</span>}
          </nav>
          {listing?.writable ? (<>
            <input ref={fileInput} type="file" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
            <button onClick={() => fileInput.current?.click()} disabled={busy} data-testid="button-upload"
              className="rounded-full px-4 py-2 bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-400/30 disabled:opacity-40 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload</button>
            <button onClick={newFolder} data-testid="button-new-folder"
              className="rounded-full px-4 py-2 bg-white/5 border border-white/10 text-zinc-200 text-sm hover:border-cyan-400/40 flex items-center gap-2"><FolderPlus className="w-4 h-4" /> New folder</button>
          </>) : listing ? <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400"><Lock className="w-3.5 h-3.5" /> Read only</span> : null}
        </div>

        {error && <div className="mb-4 rounded-2xl border border-pink-400/30 bg-pink-500/10 px-4 py-3 text-sm text-pink-200" data-testid="text-files-error">{error}</div>}
        {busy && <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-cyan-300" /></div>}

        {preview && (
          <div className="mb-4 rounded-[22px] overflow-hidden border border-white/10 bg-black/40" data-testid="preview">
            {VIDEO.test(preview.name) ? <video src={`/api/files/stream?path=${encodeURIComponent(preview.path)}`} controls autoPlay className="w-full max-h-[60vh]" />
              : <img src={`/api/files/stream?path=${encodeURIComponent(preview.path)}`} alt={preview.name} className="max-h-[60vh] mx-auto" />}
          </div>
        )}

        {!busy && listing && (
          <ul className="divide-y divide-white/5" data-testid="list-entries">
            {listing.entries.length === 0 && <li className="py-10 text-center text-muted-foreground">This folder is empty.</li>}
            {listing.entries.map((e) => (
              <li key={e.path} className="flex items-center gap-3 py-2.5 group">
                {e.isDir ? <Folder className="w-4 h-4 text-cyan-300" /> : <FileText className="w-4 h-4 text-zinc-400" />}
                <button className="flex-1 min-w-0 text-left truncate text-zinc-100 hover:text-cyan-300"
                  onClick={() => e.isDir ? load(`${e.path}/`) : (VIDEO.test(e.name) || IMAGE.test(e.name)) ? setPreview(e) : window.open(`/api/files/download?path=${encodeURIComponent(e.path)}`)}>{e.name}</button>
                <span className="text-xs font-mono text-zinc-500 w-20 text-right">{e.isDir ? "" : fmtSize(e.size)}</span>
                <span className="text-xs text-zinc-500 w-36 text-right hidden md:block">{new Date(e.modified).toLocaleString()}</span>
                {!e.isDir && <a href={`/api/files/download?path=${encodeURIComponent(e.path)}`} className="p-1.5 rounded-full text-zinc-400 hover:text-cyan-300" title="Download"><Download className="w-4 h-4" /></a>}
                {listing.writable && <button onClick={() => remove(e)} className="p-1.5 rounded-full text-zinc-500 hover:text-pink-300 opacity-0 group-hover:opacity-100" title="Delete"><Trash2 className="w-4 h-4" /></button>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
