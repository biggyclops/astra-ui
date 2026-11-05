import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Download, Pause, Play, Trash2, Loader2, ShieldCheck, ShieldAlert, Film, Tv, ExternalLink } from "lucide-react";

/** Transmission (behind the VPN container) plus Radarr / Sonarr queues. Downloads land in /mnt/hermes/torrents. */
interface Torrent { id: number; name: string; status: number; percentDone: number; rateDownload: number; rateUpload: number; eta: number; errorString?: string; totalSize: number }
interface Status { ok: boolean; webUrl: string; containers: { vpn: { running: boolean }; transmission: { running: boolean } }; session: { downloadDir?: string }; torrents: Torrent[]; storage: { root: string; exists: boolean; writable: boolean; sessionDirMatches: boolean } }
interface Arr { name: string; configured: boolean; ok: boolean; message?: string; version?: string; queueTotal?: number; queue?: Array<{ id: number; title: string; status: string; timeleft?: string }> }

const rate = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB/s` : `${Math.round(b / 1024)} KB/s`;

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(path, { method, credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || j.error || `Request failed (${r.status})`);
  return j as T;
}

export default function Downloads() {
  const [status, setStatus] = useState<Status | null>(null);
  const [arr, setArr] = useState<{ radarr: Arr; sonarr: Arr } | null>(null);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [folder, setFolder] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    try { setStatus(await api<Status>("/api/transmission/status")); setError(""); } catch (e) { setError((e as Error).message); }
    api<{ radarr: Arr; sonarr: Arr }>("/api/arr/status").then(setArr).catch(() => {});
  }, []);
  useEffect(() => { refresh(); const t = window.setInterval(refresh, 5000); return () => window.clearInterval(t); }, [refresh]);

  async function add(e: FormEvent) {
    e.preventDefault(); if (!url.trim()) return; setAdding(true);
    try { await api("/api/transmission/add", "POST", { url: url.trim(), folder: folder.trim() || undefined }); setUrl(""); await refresh(); }
    catch (err) { setError((err as Error).message); } finally { setAdding(false); }
  }
  const act = (id: number, action: "start" | "stop") => api(`/api/transmission/torrents/${id}/${action}`, "POST", {}).then(refresh).catch((e) => setError(e.message));
  const remove = (t: Torrent) => window.confirm(`Remove “${t.name}”? Downloaded files are kept.`) && api(`/api/transmission/torrents/${t.id}`, "DELETE", { deleteLocalData: false }).then(refresh).catch((e) => setError(e.message));

  const vpnOk = status?.containers.vpn.running && status?.containers.transmission.running;

  return (
    <div className="min-h-screen bg-background p-8 pl-10 pt-20" data-testid="page-downloads">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Downloads</h1>
        <p className="text-muted-foreground">Transmission through the VPN, saving to Hermes Torrents, plus Radarr and Sonarr.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <section className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
          <form onSubmit={add} className="flex items-center gap-3 mb-6 flex-wrap">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Magnet link or .torrent URL" data-testid="input-torrent-url"
              className="flex-1 min-w-[240px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400/60" />
            <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Subfolder (optional)" data-testid="input-torrent-folder"
              className="w-48 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400/60" />
            <button type="submit" disabled={adding || !url.trim()} data-testid="button-torrent-add"
              className="rounded-full px-5 py-3 bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-400/30 disabled:opacity-40 flex items-center gap-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Add
            </button>
          </form>

          {error && <div className="mb-4 rounded-2xl border border-pink-400/30 bg-pink-500/10 px-4 py-3 text-sm text-pink-200" data-testid="text-downloads-error">{error}</div>}
          {status && status.torrents.length === 0 && <div className="text-muted-foreground py-10 text-center">No torrents.</div>}
          <ul className="space-y-3">
            {(status?.torrents || []).map((t) => (
              <li key={t.id} className="rounded-[22px] border border-white/5 bg-card/60 p-4" data-testid={`row-torrent-${t.id}`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{t.name}</div>
                    <div className="text-xs text-zinc-500">{Math.round(t.percentDone * 100)}% · ↓ {rate(t.rateDownload)} · ↑ {rate(t.rateUpload)}{t.errorString ? ` · ${t.errorString}` : ""}</div>
                  </div>
                  <button onClick={() => act(t.id, t.status === 0 ? "start" : "stop")} className="p-2 rounded-full border border-white/10 text-zinc-300 hover:text-cyan-300" title={t.status === 0 ? "Resume" : "Pause"}>
                    {t.status === 0 ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(t)} className="p-2 rounded-full border border-white/10 text-zinc-400 hover:text-pink-300" title="Remove"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-cyan-400/70" style={{ width: `${t.percentDone * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-3">Transmission</h2>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs border ${vpnOk ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-pink-400/30 bg-pink-500/10 text-pink-200"}`}>
              {vpnOk ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />} {vpnOk ? "VPN and Transmission running" : "VPN or Transmission down"}
            </div>
            {status && <>
              <p className="mt-3 text-xs font-mono text-zinc-400 break-all">{status.storage.root}</p>
              {!status.storage.exists && <p className="mt-1 text-xs text-pink-200">Torrents share is not mounted on Mini-Beast.</p>}
              {status.storage.exists && !status.storage.sessionDirMatches && <p className="mt-1 text-xs text-zinc-500">Transmission's default folder is {status.session.downloadDir}; new adds still go to the Torrents share.</p>}
              <a href={status.webUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:underline">Open Transmission <ExternalLink className="w-3 h-3" /></a>
            </>}
          </div>
          {arr && [arr.radarr, arr.sonarr].map((a) => (
            <div key={a.name} className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6" data-testid={`card-${a.name}`}>
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">{a.name === "radarr" ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}{a.name === "radarr" ? "Radarr" : "Sonarr"}</h2>
              {!a.ok ? <p className="text-xs text-pink-200">{a.message}</p> : <>
                <p className="text-xs text-zinc-500 mb-2">v{a.version} · {a.queueTotal} in queue</p>
                <ul className="space-y-1">{(a.queue || []).slice(0, 6).map((q) => <li key={q.id} className="text-sm text-zinc-300 truncate">{q.title} <span className="text-xs text-zinc-500">{q.status}</span></li>)}</ul>
              </>}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
