import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Search, Tv as TvIcon, Play, MonitorPlay, Loader2, X } from "lucide-react";

/** IPTV Land TV control. Calls the Astra backend (/api/tv/*, astra_session); the recorder token never reaches the browser. */
interface Prog { title: string; start: number; stop: number }
interface Result { channelId: string; name: string; group: string; num?: number; match: "channel" | "now" | "upcoming"; programme: Prog | null; now: Prog | null; next: Prog | null }

const clock = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, { method: body ? "POST" : "GET", credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j as T;
}

export default function Tv() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tuning, setTuning] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Result | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [group, setGroup] = useState("All groups");

  const groups = useMemo(() => ["All groups", ...Array.from(new Set((results || []).map((r) => r.group).filter(Boolean))).sort()], [results]);
  const visibleResults = useMemo(() => group === "All groups" ? results || [] : (results || []).filter((r) => r.group === group), [group, results]);

  useEffect(() => { if (!notice) return; const t = window.setTimeout(() => setNotice(""), 4000); return () => window.clearTimeout(t); }, [notice]);

  async function search(e?: FormEvent) {
    e?.preventDefault(); const query = q.trim(); if (!query) return;
    setBusy(true); setError("");
    try { setResults((await api<{ results: Result[] }>(`/api/tv/search?q=${encodeURIComponent(query)}`)).results); setBrowsing(false); setGroup("All groups"); }
    catch (err) { setError((err as Error).message); setResults(null); }
    finally { setBusy(false); }
  }
  async function browse() {
    setBusy(true); setError("");
    try { setResults((await api<{ channels: Result[] }>("/api/tv/channels")).channels); setBrowsing(true); setGroup("All groups"); }
    catch (err) { setError((err as Error).message); setResults(null); }
    finally { setBusy(false); }
  }
  async function tune(r: Result) {
    setTuning(r.channelId); setError("");
    try { await api("/api/tv/tune", { channelId: r.channelId }); setNotice(`Tuning the TV to ${r.name}`); }
    catch (err) { setError((err as Error).message); } finally { setTuning(null); }
  }
  async function searchOnTv() {
    const query = q.trim(); if (!query) return; setError("");
    try { await api("/api/tv/search-on-tv", { query }); setNotice(`Opened search for “${query}” on the TV`); }
    catch (err) { setError((err as Error).message); }
  }

  return (
    <div className="min-h-screen bg-background p-8 pl-10 pt-20" data-testid="page-tv">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">TV</h1>
        <p className="text-muted-foreground">Find a channel or game on the living-room TV and put it on.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <section className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
          {playing && <div className="mb-6 overflow-hidden rounded-[22px] border border-cyan-400/30 bg-black" data-testid="panel-tv-player">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.05]">
              <div className="min-w-0"><div className="text-sm font-semibold text-white truncate">{playing.name}</div><div className="text-xs text-zinc-400 truncate">{playing.now?.title || "Live TV"}</div></div>
              <button type="button" onClick={() => setPlaying(null)} aria-label="Close player" className="rounded-full p-2 text-zinc-300 hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <video key={playing.channelId} src={`/api/tv/stream/${encodeURIComponent(playing.channelId)}`} controls autoPlay playsInline className="block w-full aspect-video bg-black" data-testid="video-tv-player" />
          </div>}
          <form onSubmit={search} className="flex items-center gap-3 mb-6">
            <div className="flex-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 focus-within:border-cyan-400/60">
              <Search className="w-4 h-4 text-cyan-300" />
              <input data-testid="input-tv-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Celtics, CBS News, Sky News…"
                className="flex-1 bg-transparent outline-none text-white placeholder:text-zinc-500" aria-label="Search TV channels" />
            </div>
            <button type="submit" data-testid="button-tv-search" disabled={busy || !q.trim()}
              className="rounded-full px-5 py-3 bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-400/30 disabled:opacity-40 transition-colors flex items-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
            </button>
            <button type="button" data-testid="button-tv-browse" onClick={browse} disabled={busy}
              className="rounded-full px-5 py-3 bg-white/5 border border-white/10 text-zinc-200 text-sm hover:border-cyan-400/40 disabled:opacity-40 transition-colors flex items-center gap-2">
              <TvIcon className="w-4 h-4" /> Browse Channels
            </button>
            <button type="button" data-testid="button-tv-search-on-tv" onClick={searchOnTv} disabled={!q.trim()}
              className="rounded-full px-5 py-3 bg-white/5 border border-white/10 text-zinc-200 text-sm hover:border-cyan-400/40 disabled:opacity-40 transition-colors flex items-center gap-2">
              <MonitorPlay className="w-4 h-4" /> Search on TV
            </button>
          </form>

          {browsing && results && <div className="mb-5 flex items-center justify-between gap-4" data-testid="tv-browse-toolbar">
            <p className="text-sm text-zinc-400"><span className="text-white font-semibold">{visibleResults.length}</span> of {results.length} channels</p>
            <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filter channels by group" data-testid="select-tv-group"
              className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-zinc-200 outline-none focus:border-cyan-400/60">
              {groups.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>}

          {error && <div className="mb-4 rounded-2xl border border-pink-400/30 bg-pink-500/10 px-4 py-3 text-sm text-pink-200" data-testid="text-tv-error">{error}</div>}
          {results && results.length === 0 && <div className="text-muted-foreground py-10 text-center">No channels match “{q.trim()}”.</div>}
          {!results && !error && <div className="text-muted-foreground py-10 text-center">Search by channel name or by what's on.</div>}

          <ul className="space-y-3">
            {visibleResults.map((r, i) => (
              <motion.li key={r.channelId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 rounded-[22px] border border-white/5 bg-card/60 p-4 hover:border-cyan-400/40 transition-colors" data-testid={`row-tv-${r.channelId}`}>
                <div className="p-3 rounded-xl bg-cyan-400/15 text-cyan-300"><TvIcon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{r.name}</span>
                    {r.num != null && <span className="text-[10px] uppercase tracking-widest text-zinc-500">CH {r.num}</span>}
                    {r.match !== "channel" && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">{r.match === "now" ? "On now" : "Later"}</span>}
                  </div>
                  <div className="text-sm text-zinc-300 truncate">Now: {r.now ? r.now.title : "—"}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {r.next ? `Next ${clock(r.next.start)}: ${r.next.title}` : "Next: —"}
                    {r.match === "upcoming" && r.programme ? ` · Match ${clock(r.programme.start)}: ${r.programme.title}` : ""}
                  </div>
                </div>
                <button type="button" onClick={() => setPlaying(r)} data-testid={`button-tv-watch-${r.channelId}`}
                  className="rounded-full px-4 py-2 bg-white/5 border border-white/10 text-zinc-200 text-sm font-semibold hover:border-cyan-400/40 transition-colors flex items-center gap-2">
                  <MonitorPlay className="w-4 h-4" /> Watch
                </button>
                <button type="button" onClick={() => tune(r)} disabled={tuning === r.channelId} data-testid={`button-tv-tune-${r.channelId}`}
                  className="rounded-full px-4 py-2 bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-400/30 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {tuning === r.channelId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Tune
                </button>
              </motion.li>
            ))}
          </ul>
        </section>

        <aside className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 h-fit">
          <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-3">Living-room TV</h2>
          <p className="text-sm text-zinc-300 mb-4">IPTV Land checks for Astra every 3 seconds while it's open on the TV.</p>
          <p className="text-xs text-zinc-500">Adult channels never appear here. You can also just ask Astra in Chat: “find the Celtics game” or “put on CBS News”.</p>
          {notice && <div className="mt-4 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300" data-testid="text-tv-notice">{notice}</div>}
        </aside>
      </div>
    </div>
  );
}
