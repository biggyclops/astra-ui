import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMockMedia, useHermesMedia, useHermesMediaHealth, hermesProxyUrl, type MockMediaItem } from "@/hooks/use-astra";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Star, Play, Image as ImageIcon,
  X, ChevronLeft, ChevronRight, Repeat, SortAsc, SortDesc,
  Database, HardDrive, Loader2, AlertTriangle, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FilterType = "all" | "video" | "image";
type SortType = "newest" | "oldest" | "name-asc" | "name-desc" | "size-desc" | "size-asc" | "random";
const SORT_CYCLE: SortType[] = ["newest", "oldest", "name-asc", "name-desc", "size-desc", "size-asc", "random"];
const SORT_LABELS: Record<SortType, string> = {
  "newest": "Newest", "oldest": "Oldest",
  "name-asc": "Name A-Z", "name-desc": "Name Z-A",
  "size-desc": "Largest", "size-asc": "Smallest",
  "random": "Shuffle",
};

function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === "function" ? (v as (prev: T) => T)(prev) : v;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  return [value, set];
}

const MAX_SIMULTANEOUS_VIDEOS = 6;

function VideoTile({
  item,
  ambientMode,
  isVisible,
  canPlay,
  onClick,
  isFavorite,
  onToggleFavorite,
  onPlayStateChange,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  item: MockMediaItem;
  ambientMode: boolean;
  isVisible: boolean;
  canPlay: boolean;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPlayStateChange: (playing: boolean) => void;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || isPlaying) return;
    video.play().then(() => {
      setIsPlaying(true);
      onPlayStateChange(true);
    }).catch(() => {});
  }, [isPlaying, onPlayStateChange]);

  const stopPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isPlaying) return;
    video.pause();
    setIsPlaying(false);
    onPlayStateChange(false);
  }, [isPlaying, onPlayStateChange]);

  useEffect(() => {
    if (ambientMode) {
      if (isVisible && canPlay && !isPlaying) {
        startPlay();
      } else if ((!isVisible || !canPlay) && isPlaying) {
        stopPlay();
      }
    } else {
      if (isHovered && canPlay && !isPlaying) {
        startPlay();
      } else if (!isHovered && isPlaying) {
        stopPlay();
      }
    }
  }, [ambientMode, isVisible, isHovered, canPlay, isPlaying, startPlay, stopPlay]);

  useEffect(() => {
    return () => {
      if (isPlaying) {
        onPlayStateChange(false);
      }
    };
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!ambientMode && videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-testid={`media-tile-${item.id}`}
      className={cn(
        "group relative aspect-video rounded-lg cursor-pointer bg-card border transition-all duration-300 overflow-hidden",
        isSelected ? "border-primary ring-2 ring-primary/40 scale-[0.98] z-10" : "border-white/5 hover:border-primary/40"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {item.thumb_url && !isPlaying && (
        <img
          src={item.thumb_url}
          alt={item.id}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      )}
      <video
        ref={videoRef}
        src={item.url}
        muted
        loop
        playsInline
        preload="none"
        className={cn(
          "absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-300",
          isPlaying ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
        <div className="bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1">
          <Play className="w-3 h-3 text-white fill-white" />
          <span className="text-[10px] text-white/80 font-mono">VID</span>
        </div>
      </div>
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 items-end">
        <button
          data-testid={`select-btn-${item.id}`}
          onClick={(e) => { e.stopPropagation(); onSelect(e); }}
          className={cn(
            "p-1 rounded bg-black/40 backdrop-blur-sm border transition-opacity",
            isSelected ? "opacity-100 border-primary text-primary" : "opacity-0 group-hover:opacity-100 border-white/10 text-white/40"
          )}
        >
          <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-white/40")}>
            {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
          </div>
        </button>
        <button
          data-testid={`favorite-btn-${item.id}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="p-1 rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Star className={cn("w-3.5 h-3.5", isFavorite ? "text-accent fill-accent" : "text-white/70")} />
        </button>
      </div>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-lg flex flex-col justify-end p-3 transition-opacity duration-200",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <p className="text-xs font-medium text-white truncate">{item.id}</p>
        {item.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary-foreground/80 border border-primary/20">{t}</span>
            ))}
          </div>
        )}
      </div>
      {(ambientMode && isPlaying) && (
        <div className="absolute bottom-2 right-2 z-10">
          <Repeat className="w-3 h-3 text-secondary animate-pulse" />
        </div>
      )}
    </div>
  );
}

function ImageTile({
  item,
  onClick,
  isFavorite,
  onToggleFavorite,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  item: MockMediaItem;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-testid={`media-tile-${item.id}`}
      className={cn(
        "group relative aspect-square rounded-lg cursor-pointer bg-card border transition-colors duration-300 overflow-hidden",
        isSelected ? "border-secondary ring-2 ring-secondary/40 scale-[0.98] z-10" : "border-white/5 hover:border-secondary/40"
      )}
      onClick={onClick}
    >
      <img
        src={item.url}
        alt={item.id}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2 z-10">
        <div className="bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1">
          <ImageIcon className="w-3 h-3 text-white" />
          <span className="text-[10px] text-white/80 font-mono">IMG</span>
        </div>
      </div>
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 items-end">
        <button
          data-testid={`select-btn-${item.id}`}
          onClick={(e) => { e.stopPropagation(); onSelect(e); }}
          className={cn(
            "p-1 rounded bg-black/40 backdrop-blur-sm border transition-opacity",
            isSelected ? "opacity-100 border-secondary text-secondary" : "opacity-0 group-hover:opacity-100 border-white/10 text-white/40"
          )}
        >
          <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center", isSelected ? "bg-secondary border-secondary" : "border-white/40")}>
            {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
          </div>
        </button>
        <button
          data-testid={`favorite-btn-${item.id}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="p-1 rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Star className={cn("w-3.5 h-3.5", isFavorite ? "text-accent fill-accent" : "text-white/70")} />
        </button>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-lg flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <p className="text-xs font-medium text-white truncate">{item.id}</p>
        {item.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/20">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FullscreenModal({
  item,
  onClose,
  onPrev,
  onNext,
}: {
  item: MockMediaItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
      data-testid="media-modal"
    >
      <Button
        data-testid="modal-close-btn"
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-6 right-6 rounded-full bg-white/10 text-white z-10 hover:bg-white/20"
      >
        <X className="w-5 h-5" />
      </Button>
      <Button
        data-testid="modal-prev-btn"
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white z-10 hover:bg-white/20"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        data-testid="modal-next-btn"
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white z-10 hover:bg-white/20"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>
      <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[85vh] w-full mx-8">
        {item.type === "video" ? (
          <video
            src={item.url}
            controls
            autoPlay
            className="w-full max-h-[85vh] rounded-lg object-contain"
          />
        ) : (
          <img
            src={item.url}
            alt={item.id}
            className="w-full max-h-[85vh] rounded-lg object-contain"
          />
        )}
        <div className="mt-4 text-center">
          <p className="text-white font-medium" data-testid="modal-title">{item.id}</p>
          <p className="text-muted-foreground text-sm mt-1" data-testid="modal-meta">
            {new Date(item.mtime).toLocaleDateString()} | {item.tags.join(", ")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

type SourceType = "mock" | "hermes";

export default function MediaWall() {
  const { data, isLoading: mockLoading } = useMockMedia();
  const mockItems = data?.items || [];

  const [source, setSource] = useLocalStorage<SourceType>("astra-media-source", "mock");
  const [hermesPath, setHermesPath] = useLocalStorage("astra-hermes-path", "/files/5. AI/My Favs/vids/");
  const [hermesPathInput, setHermesPathInput] = useState(hermesPath);
  const [loadedHermesPath, setLoadedHermesPath] = useState<string | null>(null);

  const { data: hermesData, isLoading: hermesLoading, error: hermesError, isFetching: hermesFetching } = useHermesMedia(loadedHermesPath);
  const { data: hermesHealth } = useHermesMediaHealth(undefined, source === "hermes");

  const hermesItems: MockMediaItem[] = useMemo(() => {
    if (!hermesData?.items) return [];
    return hermesData.items.map(item => ({
      id: item.id,
      type: item.type,
      url: hermesProxyUrl(item.path ?? item.url),
      thumb_url: hermesProxyUrl(item.path ?? item.thumb_url),
      mtime: item.mtime || new Date().toISOString(),
      tags: [],
      favorite: false,
      filename: item.filename || item.id,
      size: item.size ? Number(item.size) : undefined,
    }));
  }, [hermesData]);

  const items = source === "hermes" ? hermesItems : mockItems;
  const isLoading = source === "hermes" ? hermesLoading : mockLoading;

  const handleLoadHermes = useCallback(() => {
    setHermesPath(hermesPathInput);
    setLoadedHermesPath(hermesPathInput);
  }, [hermesPathInput, setHermesPath]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [showFavorites, setShowFavorites] = useState(false);
  const [ambientMode, setAmbientMode] = useLocalStorage("astra-ambient-mode", false);
  const [favorites, setFavorites] = useLocalStorage<string[]>("astra-favorites", []);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.mediaId;
            if (!id) continue;
            if (entry.isIntersecting) next.add(id);
            else next.delete(id);
          }
          return next;
        });
      },
      { root, threshold: 0.3 }
    );
    requestAnimationFrame(() => {
      const tiles = root.querySelectorAll("[data-media-id]");
      tiles.forEach((el) => observer.observe(el));
    });
    return () => observer.disconnect();
  }, [items, filter, search, showFavorites, sort]);

  useEffect(() => {
    setPlayingIds(new Set());
    setSelectedIds(new Set());
  }, [filter, search, showFavorites]);

  const handleSelect = useCallback((id: string, e: React.MouseEvent) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    setDraggingId(id);
    const currentSelection = selectedIds.has(id) ? Array.from(selectedIds) : [id];
    const dragItems = items.filter(i => currentSelection.includes(i.id));
    
    const payload = JSON.stringify({
      items: dragItems.map(i => ({
        id: i.id,
        type: i.type,
        url: i.url,
        thumb_url: i.thumb_url
      }))
    });

    e.dataTransfer.setData("application/x-astra-media", payload);
    e.dataTransfer.setData("text/plain", dragItems[0].url);
    e.dataTransfer.effectAllowed = "copy";
    
    if (dragItems.length > 1) {
      const ghost = document.createElement("div");
      ghost.className = "fixed top-0 left-0 bg-primary text-white px-2 py-1 rounded-lg text-xs font-bold pointer-events-none z-[1000]";
      ghost.innerText = `${dragItems.length} items`;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
  }, [items, selectedIds]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev: string[]) =>
      prev.includes(id) ? prev.filter((f: string) => f !== id) : [...prev, id]
    );
  }, [setFavorites]);

  const handlePlayStateChange = useCallback((id: string, playing: boolean) => {
    setPlayingIds(prev => {
      const next = new Set(prev);
      if (playing) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let result = [...items];
    if (filter !== "all") result = result.filter(i => i.type === filter);
    if (showFavorites) result = result.filter(i => favorites.includes(i.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.id.toLowerCase().includes(q) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    result.sort((a, b) => {
      switch (sort) {
        case "newest": return new Date(b.mtime || 0).getTime() - new Date(a.mtime || 0).getTime();
        case "oldest": return new Date(a.mtime || 0).getTime() - new Date(b.mtime || 0).getTime();
        case "name-asc": return (a.filename || a.id).localeCompare(b.filename || b.id);
        case "name-desc": return (b.filename || b.id).localeCompare(a.filename || a.id);
        case "size-desc": return (Number(b.size) || 0) - (Number(a.size) || 0);
        case "size-asc": return (Number(a.size) || 0) - (Number(b.size) || 0);
        case "random": return Math.random() - 0.5;
        default: return 0;
      }
    });
    return result;
  }, [items, filter, sort, search, showFavorites, favorites]);

  const openModal = (idx: number) => setModalIndex(idx);
  const closeModal = () => setModalIndex(null);
  const prevModal = () => setModalIndex(i => i !== null ? (i - 1 + filtered.length) % filtered.length : null);
  const nextModal = () => setModalIndex(i => i !== null ? (i + 1) % filtered.length : null);

  const videoCount = filtered.filter(i => i.type === "video").length;
  const imageCount = filtered.filter(i => i.type === "image").length;

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <header className="shrink-0 border-b border-white/5 bg-background/80 backdrop-blur-md px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-media-wall-title" style={{ fontFamily: "var(--font-display)" }}>
              Media Wall
            </h1>
            <div className="flex rounded-lg border border-white/10 bg-card" data-testid="source-selector">
              <Button
                data-testid="source-mock"
                variant="ghost"
                size="sm"
                onClick={() => setSource("mock")}
                className={cn(
                  "text-xs font-medium rounded-none gap-1.5",
                  source === "mock" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                )}
              >
                <Database className="w-3 h-3" />
                Mock
              </Button>
              <Button
                data-testid="source-hermes"
                variant="ghost"
                size="sm"
                onClick={() => setSource("hermes")}
                className={cn(
                  "text-xs font-medium rounded-none gap-1.5",
                  source === "hermes" ? "bg-secondary/20 text-secondary" : "text-muted-foreground"
                )}
              >
                <HardDrive className="w-3 h-3" />
                Hermes
              </Button>
            </div>
            {selectedIds.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold"
              >
                {selectedIds.size} Selected
                <button onClick={() => setSelectedIds(new Set())} className="hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                data-testid="input-search"
                type="text"
                placeholder="Search files & tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-card border-white/10 text-sm w-56"
              />
            </div>

            <div className="flex rounded-lg border border-white/10 bg-card">
              {(["all", "video", "image"] as FilterType[]).map(f => (
                <Button
                  key={f}
                  data-testid={`filter-${f}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "text-xs font-medium capitalize rounded-none",
                    filter === f
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {f === "all" ? "All" : f === "video" ? "Videos" : "Images"}
                </Button>
              ))}
            </div>

            <Button
              data-testid="btn-sort"
              variant="outline"
              size="sm"
              onClick={() => setSort(s => SORT_CYCLE[(SORT_CYCLE.indexOf(s) + 1) % SORT_CYCLE.length])}
              className="gap-1.5 bg-card border-white/10 text-xs text-muted-foreground"
            >
              {sort.includes("desc") || sort === "newest" ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
              {SORT_LABELS[sort]}
            </Button>

            <Button
              data-testid="btn-favorites"
              variant="outline"
              size="sm"
              onClick={() => setShowFavorites(f => !f)}
              className={cn(
                "gap-1.5 text-xs",
                showFavorites
                  ? "bg-accent/20 text-accent border-accent/30"
                  : "bg-card border-white/10 text-muted-foreground"
              )}
            >
              <Star className={cn("w-3.5 h-3.5", showFavorites && "fill-accent")} />
              Favorites
            </Button>

            <Button
              data-testid="btn-ambient"
              variant="outline"
              size="sm"
              onClick={() => setAmbientMode(!ambientMode)}
              className={cn(
                "gap-1.5 text-xs font-mono",
                ambientMode
                  ? "bg-secondary/20 text-secondary border-secondary/30"
                  : "bg-card border-white/10 text-muted-foreground"
              )}
            >
              <Repeat className={cn("w-3.5 h-3.5", ambientMode && "animate-spin")} style={ambientMode ? { animationDuration: "3s" } : {}} />
              Loop
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-mono">
          <span data-testid="text-total-count">{filtered.length} items</span>
          <span data-testid="text-video-count">{videoCount} videos</span>
          <span data-testid="text-image-count">{imageCount} images</span>
          {source === "hermes" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                (hermesHealth?.mode ?? hermesHealth?.lastProxyMode) === "local"
                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              )}
              data-testid="hermes-mode-badge"
              title={hermesHealth?.mode === "local" ? "Streaming from local mount (X-Hermes-Source: local)" : "Using Hermes HTTP fallback (X-Hermes-Source: http)"}
            >
              {(hermesHealth?.mode ?? hermesHealth?.lastProxyMode) === "local"
                ? "Hermes: Local streaming ✅"
                : "Hermes: HTTP fallback ⚠️"}
            </span>
          )}
          {ambientMode && (
            <span className="text-secondary" data-testid="text-ambient-status">
              Ambient mode ({playingIds.size}/{MAX_SIMULTANEOUS_VIDEOS} playing)
            </span>
          )}
        </div>
        {source === "hermes" && (
          <div className="flex items-center gap-2 mt-3" data-testid="hermes-path-bar">
            <FolderOpen className="w-4 h-4 text-secondary shrink-0" />
            <Input
              data-testid="input-hermes-path"
              type="text"
              value={hermesPathInput}
              onChange={(e) => setHermesPathInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadHermes()}
              placeholder="/files/path/to/folder/"
              className="flex-1 bg-card border-white/10 text-sm font-mono text-secondary"
            />
            <Button
              data-testid="btn-load-hermes"
              size="sm"
              onClick={handleLoadHermes}
              disabled={hermesFetching}
              className="gap-1.5 bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30"
            >
              {hermesFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
              Load
            </Button>
          </div>
        )}
        {source === "hermes" && hermesError && (
          <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="hermes-error">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-xs text-destructive">{(hermesError as Error).message}</span>
          </div>
        )}
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        {isLoading && source !== "hermes" ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm font-mono">Loading media...</p>
          </div>
        ) : source === "hermes" && !loadedHermesPath && !hermesLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <HardDrive className="w-10 h-10 text-secondary/30" />
            <p className="text-muted-foreground text-sm" data-testid="text-hermes-prompt">Enter a Hermes path above and click Load to browse the archive.</p>
          </div>
        ) : source === "hermes" && hermesFetching ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            <p className="text-secondary text-sm font-mono">Connecting to Hermes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Filter className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm" data-testid="text-empty-state">
              {source === "hermes" && hermesData?.message ? hermesData.message : "No media matches your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((item, idx) => (
              <div key={item.id} data-media-id={item.id} className={cn(
                "transition-all duration-300",
                draggingId === item.id && "ring-4 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_20px_rgba(var(--primary),0.5)] rounded-lg"
              )}>
                {item.type === "video" ? (
                  <VideoTile
                    item={item}
                    ambientMode={ambientMode}
                    isVisible={visibleIds.has(item.id)}
                    canPlay={playingIds.has(item.id) || playingIds.size < MAX_SIMULTANEOUS_VIDEOS}
                    onClick={() => openModal(idx)}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    onPlayStateChange={(playing) => handlePlayStateChange(item.id, playing)}
                    isSelected={selectedIds.has(item.id)}
                    onSelect={(e) => handleSelect(item.id, e)}
                    onDragStart={(e) => handleDragStart(item.id, e)}
                    onDragEnd={handleDragEnd}
                  />
                ) : (
                  <ImageTile
                    item={item}
                    onClick={() => openModal(idx)}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    isSelected={selectedIds.has(item.id)}
                    onSelect={(e) => handleSelect(item.id, e)}
                    onDragStart={(e) => handleDragStart(item.id, e)}
                    onDragEnd={handleDragEnd}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalIndex !== null && (
          <FullscreenModal
            item={filtered[modalIndex]}
            onClose={closeModal}
            onPrev={prevModal}
            onNext={nextModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
