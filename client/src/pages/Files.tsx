import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  ChevronRight,
  Download,
  File,
  FileVideo,
  Folder,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileEntry = {
  name: string;
  path?: string;
  isDir: boolean;
  size: number;
  modified: string;
};

function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function encodeRoutePath(path: string): string {
  const segments = splitPath(path);
  return segments.length ? `/files/${segments.map(encodeURIComponent).join("/")}` : "/files";
}

function joinPath(...parts: string[]): string {
  const segments = parts.flatMap(splitPath);
  return segments.length ? `/${segments.join("/")}` : "/";
}

function resolveEntryPath(entry: FileEntry, currentPath: string): string {
  return entry.path || joinPath(currentPath, entry.name);
}

function parentPath(path: string): string {
  const segments = splitPath(path);
  return segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : "/";
}

function isVideoFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".mkv") || lower.endsWith(".webm");
}

function formatSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "";
  if (size === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 || value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

function formatModified(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchFiles(path: string, signal?: AbortSignal): Promise<FileEntry[]> {
  const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`, { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Unable to load files (${response.status})`);
  }
  if (!Array.isArray(data)) {
    throw new Error("Unexpected file listing response");
  }

  return data;
}

function downloadFileUrl(path: string): string {
  return `/api/files/download?path=${encodeURIComponent(path)}`;
}

export default function Files() {
  const [location, navigate] = useLocation();
  const currentPath = location.startsWith("/files")
    ? location.replace("/files", "") || "/"
    : "/";
  const normalizedPath = currentPath === "" ? "/" : currentPath;

  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);

  const loadFiles = useCallback(async () => {
    loadRequestRef.current?.abort();
    const controller = new AbortController();
    loadRequestRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const items = await fetchFiles(normalizedPath, controller.signal);
      setEntries(items);
    } catch (err) {
      if (!controller.signal.aborted) {
        setEntries([]);
        setError(err instanceof Error ? err.message : "Unable to load files");
      }
    } finally {
      if (loadRequestRef.current === controller) {
        loadRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [normalizedPath]);

  useEffect(() => {
    void loadFiles();

    return () => {
      loadRequestRef.current?.abort();
      loadRequestRef.current = null;
    };
  }, [loadFiles]);

  useEffect(() => {
    setVideoPath(null);
    setVideoSrc(null);
    setNotice(null);
  }, [normalizedPath]);

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.load();
      videoRef.current.play().catch(() => undefined);
    }
  }, [videoSrc]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      }),
    [entries],
  );

  const crumbs = useMemo(() => {
    const segments = splitPath(currentPath);
    return [
      { label: "/", path: "/" },
      ...segments.map((segment, index) => ({
        label: segment,
        path: `/${segments.slice(0, index + 1).join("/")}`,
      })),
    ];
  }, [currentPath]);

  const selectedName = videoPath ? splitPath(videoPath).at(-1) ?? "" : "";

  const openEntry = (entry: FileEntry) => {
    setNotice(null);
    const fullPath = resolveEntryPath(entry, currentPath);

    if (entry.isDir) {
      const nextPath = fullPath;
      navigate(encodeRoutePath(nextPath));
      return;
    }

    if (isVideoFile(entry.name)) {
      setVideoPath(fullPath);
      setVideoSrc(`/api/files/stream?path=${encodeURIComponent(fullPath)}`);
      return;
    }

    setVideoPath(null);
    setVideoSrc(null);
    setNotice("Unsupported format");
  };

  return (
    <section className="flex h-full min-h-screen flex-col bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(encodeRoutePath(parentPath(currentPath)))}
            disabled={currentPath === "/"}
            className="border-white/10 bg-white/5"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadFiles()}
            className="border-white/10 bg-white/5"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : null}
              <button
                type="button"
                onClick={() => navigate(encodeRoutePath(crumb.path))}
                className={cn(
                  "truncate rounded px-1.5 py-1 transition-colors hover:bg-white/5 hover:text-foreground",
                  crumb.path === currentPath && "text-foreground",
                )}
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="min-w-0 text-right">
          <h1 className="truncate text-lg font-semibold">Files</h1>
          <p className="truncate font-mono text-xs text-muted-foreground">{currentPath}</p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading files...
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  File browser unavailable
                </div>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {sortedEntries.length === 0 ? (
                <div className="flex h-full items-center justify-center py-12 text-sm text-muted-foreground">
                  This folder is empty.
                </div>
              ) : (
                sortedEntries.map((entry) => {
                  const playable = !entry.isDir && isVideoFile(entry.name);
                  const entryPath = resolveEntryPath(entry, currentPath);
                  return (
                    <div
                      key={`${entry.isDir ? "dir" : "file"}-${entry.name}`}
                      className={cn(
                        "grid grid-cols-[minmax(0,1fr)_2.5rem] items-stretch gap-2 px-4 py-3 text-sm transition-colors",
                        "hover:bg-white/[0.04]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => openEntry(entry)}
                        className="grid w-full min-w-0 grid-cols-[2rem_minmax(0,1fr)_8rem_9rem] items-center gap-3 text-left"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5">
                          {entry.isDir ? (
                            <Folder className="h-4 w-4 text-primary" />
                          ) : playable ? (
                            <FileVideo className="h-4 w-4 text-secondary" />
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <span className="truncate font-medium" title={entry.name}>
                          {entry.name}
                        </span>
                        <span className="text-right font-mono text-xs text-muted-foreground">
                          {entry.isDir ? "Folder" : formatSize(entry.size)}
                        </span>
                        <span className="truncate text-right text-xs text-muted-foreground">
                          {formatModified(entry.modified)}
                        </span>
                      </button>

                      {entry.isDir ? (
                        <div />
                      ) : (
                        <div className="flex items-center justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              window.open(downloadFileUrl(entryPath), "_blank");
                            }}
                            className="h-8 w-8 border-white/10 bg-white/5"
                            aria-label={`Download ${entry.name}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <section className="shrink-0 border-t border-white/5 bg-black/20 px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                {selectedName || "Video player"}
              </h2>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {videoPath || "Select a video file to play it here"}
              </p>
            </div>

            {videoSrc ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setVideoPath(null);
                  setVideoSrc(null);
                }}
                className="h-8 w-8 shrink-0 border-white/10 bg-white/5"
                aria-label="Close video player"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {notice ? (
            <div className="mb-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
              {notice}
            </div>
          ) : null}

          {videoSrc ? (
            <video
              ref={videoRef}
              key={videoSrc}
              src={videoSrc}
              controls
              autoPlay
              muted
              playsInline
              className="w-full max-h-[68vh] rounded-lg bg-black"
            />
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 text-sm text-muted-foreground">
              No video selected
            </div>
          )}
        </section>
      </main>
    </section>
  );
}
