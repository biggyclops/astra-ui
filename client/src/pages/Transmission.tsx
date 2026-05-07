import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Globe2,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useAstraPresenceSource } from "@/hooks/use-astra-presence";
import { usePageVisible } from "@/hooks/use-astra";

type Torrent = {
  id: number;
  name: string;
  status: number;
  percentDone: number;
  rateDownload: number;
  rateUpload: number;
  eta: number;
  errorString?: string;
  totalSize: number;
  downloadedEver: number;
  uploadedEver: number;
};

type TransmissionStatus = {
  ok: boolean;
  webUrl: string;
  containers: {
    gluetun: { running: boolean; healthy: boolean; status: string; networkMode?: string; image?: string };
    transmission: { running: boolean; healthy: boolean; status: string; networkMode?: string; image?: string };
  };
  vpn: {
    provider: string;
    killSwitch: boolean;
    boundToVpn: boolean;
    masked: boolean;
    publicIp: { ok: boolean; ip?: string; city?: string; region?: string; country?: string; org?: string; error?: string };
    hostPublicIp: { ok: boolean; ip?: string; error?: string };
    interface: { defaultRoute?: string | null; tun0?: string | null };
  };
  session: {
    version?: string;
    downloadDir?: string;
    peerPort?: number;
    portForwardingEnabled?: boolean;
  };
  stats: {
    activeTorrentCount?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    pausedTorrentCount?: number;
    torrentCount?: number;
  };
  torrents: Torrent[];
  storage?: {
    requestedRoot: string;
    activeRoot: string;
    usingFallback: boolean;
    requestedExists: boolean;
    requestedWritable: boolean;
    activeWritable: boolean;
  };
};

type StatsResponse = {
  ok: boolean;
  downloadSpeed: number;
  uploadSpeed: number;
  torrentCount: number;
  activeTorrentCount: number;
  disk: { total: number; used: number; free: number; percent: number; root: string };
};

type FileNode = {
  name: string;
  path: string;
  type: "directory" | "file";
  size: number;
  children?: FileNode[];
};

type FileTreeResponse = {
  ok: boolean;
  root: string;
  tree: FileNode;
};

const STATUS_LABEL: Record<number, string> = {
  0: "Stopped",
  1: "Queued check",
  2: "Checking",
  3: "Queued",
  4: "Downloading",
  5: "Queued seed",
  6: "Seeding",
};

function bytes(value?: number) {
  const n = value ?? 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} GB`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} kB`;
  return `${n} B`;
}

function speed(value?: number) {
  return `${bytes(value)}/s`;
}

function eta(seconds: number) {
  if (seconds == null || seconds < 0 || seconds >= 8640000) return "n/a";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={ok ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}
    >
      {ok ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <AlertTriangle className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}

function FileTree({ node, onDelete, busyPath }: { node: FileNode; onDelete: (path: string) => void; busyPath?: string }) {
  const [open, setOpen] = useState(node.path === "");
  const isDirectory = node.type === "directory";
  return (
    <div className="text-sm">
      <div className="flex min-w-0 items-center gap-2 py-1">
        {isDirectory ? (
          <button className="w-5 text-left text-muted-foreground" onClick={() => setOpen((value) => !value)}>
            {open ? "−" : "+"}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className={isDirectory ? "font-medium text-foreground" : "truncate text-muted-foreground"}>{node.name || "media"}</span>
        {!isDirectory ? <span className="ml-auto text-xs text-muted-foreground">{bytes(node.size)}</span> : null}
        {node.path ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-300"
            onClick={() => onDelete(node.path)}
            disabled={busyPath === node.path}
          >
            {busyPath === node.path ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </Button>
        ) : null}
      </div>
      {isDirectory && open && node.children ? (
        <div className="ml-4 border-l border-white/10 pl-3">
          {node.children.map((child) => (
            <FileTree key={child.path || child.name} node={child} onDelete={onDelete} busyPath={busyPath} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Transmission() {
  const pageVisible = usePageVisible();
  const [torrentUrl, setTorrentUrl] = useState("");
  const [folder, setFolder] = useState("downloads");
  const [speedHistory, setSpeedHistory] = useState<Array<{ time: string; down: number; up: number }>>([]);
  const statusQuery = useQuery<TransmissionStatus>({
    queryKey: ["/api/transmission/status"],
    refetchInterval: pageVisible ? 5000 : false,
    refetchIntervalInBackground: false,
  });
  const statsQuery = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
    refetchInterval: pageVisible ? 3000 : false,
    refetchIntervalInBackground: false,
  });
  const filesQuery = useQuery<FileTreeResponse>({
    queryKey: ["/api/files/tree"],
    refetchInterval: pageVisible ? 10000 : false,
    refetchIntervalInBackground: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/transmission/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/files/tree"] });
  };

  useEffect(() => {
    if (!pageVisible) return;
    if (!statsQuery.data) return;
    setSpeedHistory((history) => [
      ...history.slice(-39),
      {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
        down: Math.round((statsQuery.data.downloadSpeed || 0) / 1000),
        up: Math.round((statsQuery.data.uploadSpeed || 0) / 1000),
      },
    ]);
  }, [pageVisible, statsQuery.data?.downloadSpeed, statsQuery.data?.uploadSpeed]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const url = torrentUrl.trim();
      if (!url) throw new Error("Torrent URL or magnet link is required");
      await apiRequest("POST", "/api/transmission/add", { url, folder });
    },
    onSuccess: () => {
      setTorrentUrl("");
      invalidate();
      toast({ title: "Torrent added" });
    },
    onError: (error: Error) => toast({ title: "Add failed", description: error.message, variant: "destructive" }),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "start" | "stop" | "verify" | "remove" }) => {
      if (action === "remove") {
        await apiRequest("DELETE", `/api/transmission/torrents/${id}`, { deleteLocalData: false });
      } else {
        await apiRequest("POST", `/api/transmission/torrents/${id}/${action}`);
      }
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast({ title: "Action failed", description: error.message, variant: "destructive" }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (path: string) => {
      await apiRequest("DELETE", "/api/files", { path });
      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files/tree"] });
      toast({ title: "File removed" });
    },
    onError: (error: Error) => toast({ title: "Delete failed", description: error.message, variant: "destructive" }),
  });

  const data = statusQuery.data;
  const healthOk = Boolean(data?.vpn.masked && data.vpn.boundToVpn && data.vpn.killSwitch && data.containers.gluetun.running && data.containers.transmission.running);
  const sortedTorrents = useMemo(() => [...(data?.torrents ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [data?.torrents]);
  const presenceSignals = useMemo(
    () => ({
      transferActive: Boolean(
        (statsQuery.data?.downloadSpeed ?? data?.stats.downloadSpeed ?? 0) > 0 ||
        (statsQuery.data?.uploadSpeed ?? data?.stats.uploadSpeed ?? 0) > 0 ||
        (statsQuery.data?.activeTorrentCount ?? data?.stats.activeTorrentCount ?? 0) > 0
      ),
      securityAlert: Boolean(statusQuery.isError || statsQuery.isError || filesQuery.isError || data?.torrents?.some((torrent) => Boolean(torrent.errorString))),
    }),
    [statsQuery.data?.downloadSpeed, statsQuery.data?.uploadSpeed, statsQuery.data?.activeTorrentCount, statusQuery.isError, statsQuery.isError, filesQuery.isError, data?.stats.downloadSpeed, data?.stats.uploadSpeed, data?.stats.activeTorrentCount, data?.torrents]
  );
  useAstraPresenceSource("transmission", presenceSignals);

  return (
    <div className="h-screen overflow-y-auto px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Transmission</h1>
            <p className="mt-1 text-sm text-muted-foreground">VPN-bound torrent control through NordVPN and Gluetun.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill ok={healthOk} label={healthOk ? "Protected" : "Needs attention"} />
            <Button variant="outline" size="sm" onClick={() => statusQuery.refetch()} disabled={statusQuery.isFetching}>
              {statusQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/nodes/transmission/web/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Web UI
              </a>
            </Button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-card/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /> VPN</div>
            <div className="mt-2 text-lg font-semibold">{data?.vpn.provider ?? "Checking"}</div>
            <div className="mt-1 text-xs text-muted-foreground">{data?.vpn.publicIp.ip ?? "No VPN IP yet"}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-card/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Globe2 className="h-4 w-4" /> IP Mask</div>
            <div className="mt-2 text-lg font-semibold">{data?.vpn.masked ? "Masked" : "Unknown"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Host {data?.vpn.hostPublicIp.ip ?? "n/a"}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-card/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Gauge className="h-4 w-4" /> Speed</div>
            <div className="mt-2 text-lg font-semibold">{speed(statsQuery.data?.downloadSpeed ?? data?.stats.downloadSpeed)} down</div>
            <div className="mt-1 text-xs text-muted-foreground">{speed(statsQuery.data?.uploadSpeed ?? data?.stats.uploadSpeed)} up</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-card/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Server className="h-4 w-4" /> Containers</div>
            <div className="mt-2 flex gap-2">
              <StatusPill ok={Boolean(data?.containers.gluetun.running)} label="Gluetun" />
              <StatusPill ok={Boolean(data?.containers.transmission.running)} label="Transmission" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-card/60 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <Input
              value={torrentUrl}
              onChange={(event) => setTorrentUrl(event.target.value)}
              placeholder="Paste magnet link or torrent URL"
              className="min-w-0"
            />
            <select
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="downloads">Downloads</option>
              <option value="movies">Movies</option>
              <option value="tv">TV</option>
              <option value="iso">ISO</option>
              <option value="watch">Watch</option>
            </select>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-lg border border-white/10 bg-card/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Live Transfer</h2>
                <p className="text-xs text-muted-foreground">3s polling, values in kB/s</p>
              </div>
              <Badge variant="outline">{statsQuery.data?.activeTorrentCount ?? 0} active</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={speedHistory}>
                  <XAxis dataKey="time" hide />
                  <YAxis width={42} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6 }} />
                  <Line type="monotone" dataKey="down" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="up" stroke="#facc15" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-card/60 p-4">
            <h2 className="text-base font-semibold">Storage</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Disk used</span><span>{statsQuery.data?.disk.percent ?? 0}%</span></div>
              <Progress value={statsQuery.data?.disk.percent ?? 0} className="h-2 bg-white/10" />
              <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                <span>{bytes(statsQuery.data?.disk.used)}</span>
                <span>{bytes(statsQuery.data?.disk.total)}</span>
              </div>
              {data?.storage?.usingFallback ? (
                <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-2 text-xs text-yellow-200">
                  Hermes SMB denied writes to {data.storage.requestedRoot}; using {data.storage.activeRoot}.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Files</h2>
              <p className="text-xs text-muted-foreground">{filesQuery.data?.root ?? "Loading file tree"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => filesQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          {filesQuery.data?.tree ? (
            <FileTree
              node={filesQuery.data.tree}
              onDelete={(path) => deleteFileMutation.mutate(path)}
              busyPath={deleteFileMutation.variables}
            />
          ) : (
            <div className="text-sm text-muted-foreground">No files loaded.</div>
          )}
        </section>

        {statusQuery.isLoading ? (
          <div className="rounded-lg border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">Loading Transmission status...</div>
        ) : statusQuery.isError ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{(statusQuery.error as Error).message}</div>
        ) : sortedTorrents.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">No torrents are currently loaded.</div>
        ) : (
          <section className="overflow-hidden rounded-lg border border-white/10 bg-card/60">
            {sortedTorrents.map((torrent) => {
              const percent = Math.round((torrent.percentDone ?? 0) * 100);
              return (
                <div key={torrent.id} className="grid gap-3 border-b border-white/5 p-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="truncate font-medium">{torrent.name}</div>
                      <Badge variant="outline" className="shrink-0 text-xs">{STATUS_LABEL[torrent.status] ?? "Unknown"}</Badge>
                    </div>
                    <Progress value={percent} className="mt-3 h-2 bg-white/10" />
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{percent}%</span>
                      <span>{bytes(torrent.downloadedEver)} / {bytes(torrent.totalSize)}</span>
                      <span>{speed(torrent.rateDownload)} down</span>
                      <span>{speed(torrent.rateUpload)} up</span>
                      <span>ETA {eta(torrent.eta)}</span>
                      {torrent.errorString ? <span className="text-red-300">{torrent.errorString}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => actionMutation.mutate({ id: torrent.id, action: "start" })}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => actionMutation.mutate({ id: torrent.id, action: "stop" })}>
                      <Pause className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => actionMutation.mutate({ id: torrent.id, action: "remove" })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
