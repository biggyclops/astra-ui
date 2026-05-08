import { useState, useCallback, useMemo } from "react";
import { useJobs, useCreateJob, useUpdateJob } from "@/hooks/use-astra";
import { useNodeStatus } from "@/hooks/use-astra";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Clock, CheckCircle2, XCircle, AlertTriangle, Activity,
  Plus, X, ChevronDown, ChevronRight, Play, Image as ImageIcon,
  Loader2, Server, FileText, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAstraPresenceSource } from "@/hooks/use-astra-presence";
import { DashboardPanel, DashboardShell } from "@/components/DashboardShell";
import type { DashboardMetric } from "@/components/DashboardShell";

type StatusFilter = "all" | "queued" | "running" | "done" | "failed";

type JobItem = {
  id: number;
  type: string;
  title: string;
  status: string;
  node: string;
  progress: number;
  inputs: { id: string; type: string; url: string; thumb_url?: string }[];
  outputs: { id: string; type: string; url: string; thumb_url?: string }[];
  logs: string[];
  createdAt: string;
  updatedAt: string;
};

type SmartGenerateResult = {
  ok: boolean;
  mode?: "txt2img" | "img2img" | "video";
  auto_mode?: "off" | "safe" | "aggressive";
  iterations: number;
  images: Array<{ stage: "initial" | "adjusted"; image: string }>;
  videos?: Array<{ format: "MP4" | "GIF" | "WEBP" | "WEBM"; video: string }>;
  adjustments: Record<string, string>;
  warning?: string;
  video_evaluation?: { diff: number };
  history?: Array<{
    attempt: number;
    params: {
      steps: number;
      cfg_scale: number;
      sampler_name: string;
      width: number;
      height: number;
    };
    score: number;
    adjustments: Record<string, string>;
    image: string;
  }>;
  message?: string;
};

const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: any }> = {
  queued: { color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20", icon: Clock },
  running: { color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", icon: Loader2 },
  done: { color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20", icon: CheckCircle2 },
  failed: { color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", icon: XCircle },
};

const nodeColors: Record<string, string> = {
  "Mini-Beast": "text-cyan-400",
  Hades: "text-teal-400",
  Hermes: "text-amber-400",
  Phobos: "text-rose-400",
};

const ALL_NODES = ["Mini-Beast", "Hades", "Hermes", "Phobos"] as const;
const JOB_TYPES = ["comfyui.image", "comfyui.video", "media.describe", "system.task"] as const;

function StatusPill({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.queued;
  const Icon = config.icon;
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", config.bgColor, config.color, config.borderColor)}>
      {status === "running" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : status === "queued" ? (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span className="capitalize">{status}</span>
    </div>
  );
}

function ProgressBar({ progress, status }: { progress: number; status: string }) {
  if (status === "done" || status === "failed") return null;
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", status === "running" ? "bg-blue-500" : "bg-yellow-500/50")}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

function MediaThumb({ item }: { item: { id: string; type: string; url: string; thumb_url?: string } }) {
  return (
    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 flex-shrink-0">
      <img src={item.thumb_url || item.url} alt={item.id} className="w-full h-full object-cover" />
      <div className="absolute top-1 left-1">
        <div className="bg-black/60 backdrop-blur-sm px-1 py-0.5 rounded flex items-center gap-0.5">
          {item.type === "video" ? <Play className="w-2 h-2 text-white fill-white" /> : <ImageIcon className="w-2 h-2 text-white" />}
          <span className="text-[8px] text-white/80 font-mono uppercase">{item.type === "video" ? "VID" : "IMG"}</span>
        </div>
      </div>
    </div>
  );
}

function CreateJobDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: number) => void }) {
  const { mutate: createJob, isPending } = useCreateJob();
  const { data: statusData } = useNodeStatus();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(JOB_TYPES[0]);
  const [node, setNode] = useState<string>(ALL_NODES[0]);

  const onlineNodes = statusData?.nodes?.filter((n: any) => n.status === "online").map((n: any) => n.name) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createJob(
      { type: type as any, title: title.trim(), node: node as any, inputs: [] },
      {
        onSuccess: (j: any) => {
          setTitle("");
          onCreated(j.id);
          onClose();
        },
      }
    );
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="astra-heading text-lg text-white">New Job</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="astra-ui-label text-xs text-muted-foreground block mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the job..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="astra-ui-label text-xs text-muted-foreground block mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="astra-ui-label text-xs text-muted-foreground block mb-1.5">Node</label>
              <select
                value={node}
                onChange={(e) => setNode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                {ALL_NODES.map((n) => (
                  <option key={n} value={n} disabled={onlineNodes.length > 0 && !onlineNodes.includes(n)}>
                    {n}{onlineNodes.length > 0 && !onlineNodes.includes(n) ? " (offline)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={isPending || !title.trim()} className="w-full gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isPending ? "Creating..." : "Create Job"}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function JobDetailDrawer({ job, onClose, onSimulateFail, onDelete }: { job: JobItem; onClose: () => void; onSimulateFail: () => void; onDelete: () => void }) {
  const [logsExpanded, setLogsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-lg h-full bg-card border-l border-white/10 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-primary" />
            <h2 className="astra-heading text-lg text-white">{job.title}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <p className="astra-ui-label text-[10px] text-muted-foreground mb-1">Type</p>
              <p className="text-sm font-medium">{job.type}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <p className="astra-ui-label text-[10px] text-muted-foreground mb-1">Node</p>
              <p className={cn("text-sm font-medium", nodeColors[job.node] || "text-white")}>
                <Server className="w-3 h-3 inline mr-1" />{job.node}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <p className="astra-ui-label text-[10px] text-muted-foreground mb-1">Status</p>
              <StatusPill status={job.status} />
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <p className="astra-ui-label text-[10px] text-muted-foreground mb-1">Progress</p>
              <p className="text-sm font-medium font-mono">{job.progress}%</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <p className="astra-ui-label text-[10px] text-muted-foreground mb-1">Created</p>
              <p className="text-xs font-mono text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <p className="astra-ui-label text-[10px] text-muted-foreground mb-1">Updated</p>
              <p className="text-xs font-mono text-muted-foreground">{new Date(job.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {(job.status === "running" || job.status === "queued") && (
            <ProgressBar progress={job.progress} status={job.status} />
          )}

          {job.inputs && job.inputs.length > 0 && (
            <div>
              <h3 className="astra-ui-label text-xs text-muted-foreground mb-3">Inputs ({job.inputs.length})</h3>
              <div className="flex flex-wrap gap-2">
                {job.inputs.map((input) => <MediaThumb key={input.id} item={input} />)}
              </div>
            </div>
          )}

          {job.outputs && job.outputs.length > 0 && (
            <div>
              <h3 className="astra-ui-label text-xs text-muted-foreground mb-3">Outputs ({job.outputs.length})</h3>
              <div className="flex flex-wrap gap-2">
                {job.outputs.map((output) => <MediaThumb key={output.id} item={output} />)}
              </div>
            </div>
          )}

          <div>
            <button
              onClick={() => setLogsExpanded(!logsExpanded)}
              className="flex items-center gap-2 text-xs text-muted-foreground mb-3 hover:text-foreground transition-colors"
            >
              {logsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <FileText className="w-3 h-3" />
              <span className="astra-ui-label text-xs">Logs ({(job.logs || []).length})</span>
            </button>
            <AnimatePresence>
              {logsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-[11px] space-y-0.5">
                    {(job.logs || []).length === 0 ? (
                      <p className="text-muted-foreground italic">No logs yet.</p>
                    ) : (
                      (job.logs || []).map((line, i) => (
                        <p key={i} className={cn(
                          "leading-relaxed",
                          line.includes("ERROR") ? "text-red-400" :
                          line.includes("Complete") || line.includes("successfully") ? "text-green-400" :
                          "text-zinc-400"
                        )}>{line}</p>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            {job.status !== "failed" && job.status !== "done" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSimulateFail}
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Simulate Fail
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex-1 border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/10 hover:text-zinc-300 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Job
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Jobs() {
  const { data: jobsData } = useJobs();
  const { mutate: updateJob } = useUpdateJob();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [smartPrompt, setSmartPrompt] = useState("cyberpunk woman portrait");
  const [smartMode, setSmartMode] = useState<"txt2img" | "video">("txt2img");
  const [smartAutoMode, setSmartAutoMode] = useState<"off" | "safe" | "aggressive">("safe");
  const [smartResult, setSmartResult] = useState<SmartGenerateResult | null>(null);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [isSmartGenerating, setIsSmartGenerating] = useState(false);
  const { mutate: createJob } = useCreateJob();

  const jobs: JobItem[] = (jobsData || []).map((j: any) => ({
    ...j,
    inputs: j.inputs || [],
    outputs: j.outputs || [],
    logs: j.logs || [],
  }));

  const filtered = jobs
    .filter(j => filter === "all" || j.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null;

  const counts = {
    all: jobs.length,
    queued: jobs.filter(j => j.status === "queued").length,
    running: jobs.filter(j => j.status === "running").length,
    done: jobs.filter(j => j.status === "done").length,
    failed: jobs.filter(j => j.status === "failed").length,
  };
  const activeNodes = new Set(jobs.map((job) => job.node)).size;
  const alerts = [
    ...(counts.failed > 0 ? [`${counts.failed} failed`] : []),
    ...(smartError ? ["smart generate error"] : []),
  ];
  const presenceSignals = useMemo(
    () => ({
      gpuActive: jobs.some((job) => job.status === "running" && /comfyui\./i.test(job.type)),
      roboticsActive: jobs.some((job) => job.status === "running" && /phobos|cyberus|robot|servo|arm/i.test(`${job.node} ${job.type} ${job.title}`)),
      securityAlert: Boolean(smartError) || jobs.some((job) => job.status === "failed"),
      transferActive: jobs.some((job) => /media|image|video/i.test(job.type)),
    }),
    [jobs, smartError]
  );
  useAstraPresenceSource("jobs", presenceSignals);
  const jobsNarration = useMemo(() => {
    if (counts.running > 0) {
      return `Astra is orchestrating ${counts.running} active job${counts.running === 1 ? "" : "s"} across ${activeNodes} nodes.`;
    }
    if (counts.queued > 0) {
      return `Astra has ${counts.queued} job${counts.queued === 1 ? "" : "s"} queued across ${activeNodes} nodes.`;
    }
    return `Astra job queue is idle with ${counts.done} completed job${counts.done === 1 ? "" : "s"} in history.`;
  }, [activeNodes, counts.done, counts.queued, counts.running]);
  const jobMetrics = useMemo<DashboardMetric[]>(
    () => [
      { label: "Total", value: counts.all.toString(), detail: "jobs in queue", tone: "accent" as const, icon: FileText },
      { label: "Running", value: counts.running.toString(), detail: "live execution", tone: counts.running > 0 ? "good" : "muted" as const, icon: Loader2 },
      { label: "Queued", value: counts.queued.toString(), detail: "awaiting compute", tone: counts.queued > 0 ? "warn" : "muted" as const, icon: Clock },
      { label: "Failed", value: counts.failed.toString(), detail: counts.failed > 0 ? "requires review" : "clear", tone: counts.failed > 0 ? "alert" : "good" as const, icon: XCircle },
      { label: "Done", value: counts.done.toString(), detail: "completed runs", tone: "good" as const, icon: CheckCircle2 },
      { label: "Nodes", value: activeNodes.toString(), detail: "job targets", tone: "accent" as const, icon: Server },
    ],
    [activeNodes, counts.all, counts.done, counts.failed, counts.queued, counts.running]
  );

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const data = e.dataTransfer.getData("application/x-astra-media");
    if (data) {
      try {
        const payload = JSON.parse(data);
        if (payload.items?.length > 0) {
          const inputs = payload.items.map((item: any) => ({
            id: item.id, type: item.type, url: item.url, thumb_url: item.thumb_url,
          }));
          const firstItem = payload.items[0];
          const jobType = firstItem.type === "video" ? "comfyui.video" : "comfyui.image";
          createJob(
            { type: jobType as any, title: `Process ${payload.items.length > 1 ? `${payload.items.length} items` : firstItem.id}`, node: "Mini-Beast" as any, inputs },
            { onSuccess: (newJob: any) => setSelectedJobId(newJob.id) }
          );
        }
      } catch (err) {
        console.error("Failed to parse drop data", err);
      }
    }
  }, [createJob]);

  const handleSimulateFail = useCallback(() => {
    if (!selectedJob) return;
    updateJob({
      id: selectedJob.id,
      status: "failed",
      logs: [...(selectedJob.logs || []), `[${new Date().toISOString()}] ERROR: Simulated failure on ${selectedJob.node}.`],
    });
  }, [selectedJob, updateJob]);

  const handleDelete = useCallback(async () => {
    if (!selectedJob) return;
    try {
      await fetch(`/api/jobs/${selectedJob.id}`, { method: "DELETE" });
      setSelectedJobId(null);
    } catch {}
  }, [selectedJob]);

  const handleSmartGenerate = useCallback(async () => {
    const prompt = smartPrompt.trim();
    if (!prompt || isSmartGenerating) return;

    setIsSmartGenerating(true);
    setSmartError(null);

    try {
      const res = await fetch("/api/sd/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode: smartMode,
          auto_mode: smartAutoMode,
          params: {
            steps: 20,
            cfg_scale: 7,
            sampler_name: "Euler a",
            width: 512,
            height: 512,
            ...(smartMode === "video" ? { video_length: 16, fps: 8, format: "MP4" } : {}),
          },
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Smart Generate failed");
      }

      setSmartResult(data);
    } catch (error) {
      setSmartError(error instanceof Error ? error.message : "Smart Generate failed");
    } finally {
      setIsSmartGenerating(false);
    }
  }, [isSmartGenerating, smartAutoMode, smartMode, smartPrompt]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "queued", label: "Queued" },
    { key: "running", label: "Running" },
    { key: "done", label: "Done" },
    { key: "failed", label: "Failed" },
  ];

  return (
    <DashboardShell
      eyebrow="ASTRA / ORCHESTRATION"
      title="Job Queue"
      subtitle={`${counts.running} running, ${counts.queued} queued, ${counts.failed} failed across ${activeNodes} nodes.`}
      narration={jobsNarration}
      metrics={jobMetrics}
      alerts={alerts.map((label) => ({ label, tone: "warn" }))}
      actions={(
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 rounded-full">
          <Plus className="w-4 h-4" /> New Job
        </Button>
      )}
    >
      <DashboardPanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{counts.all} total</span>
            {counts.running > 0 && (
              <span className="inline-flex items-center gap-1 text-cyan-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                {counts.running} running
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <Button
                key={f.key}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "text-xs font-medium gap-1.5 rounded-full",
                  filter === f.key
                    ? f.key === "all"
                      ? "bg-cyan-300/15 text-cyan-50"
                      : `${statusConfig[f.key]?.bgColor} ${statusConfig[f.key]?.color}`
                    : "text-muted-foreground"
                )}
              >
                {f.label}
                {counts[f.key] > 0 && <span className="text-[10px] opacity-60">({counts[f.key]})</span>}
              </Button>
            ))}
          </div>
        </div>
      </DashboardPanel>

      <div
        className="flex-1 overflow-y-auto p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <section className="mb-4 rounded-xl border border-white/5 bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="astra-ui-label mb-1.5 block text-xs text-muted-foreground">
                Automatic1111 Smart Generate
              </label>
              <input
                type="text"
                value={smartPrompt}
                onChange={(e) => setSmartPrompt(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div className="w-full lg:w-44">
              <label className="astra-ui-label mb-1.5 block text-xs text-muted-foreground">
                Generate
              </label>
              <select
                value={smartMode}
                onChange={(e) => setSmartMode(e.target.value as "txt2img" | "video")}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              >
                <option value="txt2img">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="w-full lg:w-44">
              <label className="astra-ui-label mb-1.5 block text-xs text-muted-foreground">
                Auto Mode
              </label>
              <select
                value={smartAutoMode}
                onChange={(e) => setSmartAutoMode(e.target.value as "off" | "safe" | "aggressive")}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              >
                <option value="off">Off</option>
                <option value="safe">Safe</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <Button
              type="button"
              onClick={handleSmartGenerate}
              disabled={isSmartGenerating || !smartPrompt.trim()}
              className="gap-2"
            >
              {isSmartGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {isSmartGenerating ? "Generating..." : "Smart Generate"}
            </Button>
          </div>

          {smartError && (
            <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {smartError}
            </p>
          )}

          {smartResult && (
            <div className="mt-4 space-y-3">
              {smartResult.warning && (
                <p className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
                  {smartResult.warning === "video_unstable" ? "Video may be unstable" : smartResult.warning}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{smartResult.iterations} generation{smartResult.iterations === 1 ? "" : "s"}</span>
                {smartResult.mode && (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">
                    output: {smartResult.mode}
                  </span>
                )}
                {smartResult.auto_mode && (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">
                    mode: {smartResult.auto_mode}
                  </span>
                )}
                {smartResult.history?.map((attempt) => (
                  <span key={attempt.attempt} className="rounded border border-white/10 bg-white/5 px-2 py-1">
                    Attempt {attempt.attempt}: score {attempt.score.toFixed(2)}
                  </span>
                ))}
                {smartResult.video_evaluation && (
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">
                    frame diff {smartResult.video_evaluation.diff.toFixed(2)}
                  </span>
                )}
                {Object.keys(smartResult.adjustments).length === 0 && (
                  <span>No adjustments applied</span>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {smartResult.videos?.map((item, index) => (
                  <div key={`${item.format}-${index}`} className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    <div className="border-b border-white/10 px-3 py-2 text-xs text-muted-foreground">
                      <span className="astra-ui-label text-xs text-muted-foreground">
                      {item.format}
                      </span>
                    </div>
                    <video
                      src={`data:video/${item.format.toLowerCase()};base64,${item.video}`}
                      controls
                      className="w-full"
                    />
                  </div>
                ))}
                {smartResult.images.map((item) => (
                  <div key={item.stage} className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    <div className="border-b border-white/10 px-3 py-2 text-xs text-muted-foreground">
                      <span className="astra-ui-label text-xs text-muted-foreground">
                      {item.stage}
                      </span>
                    </div>
                    <img
                      src={`data:image/png;base64,${item.image}`}
                      alt={`${item.stage} smart generation`}
                      className="w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {isDragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-primary/20 border-2 border-dashed border-primary rounded-2xl p-12 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-primary animate-bounce">
                <Plus className="w-10 h-10" />
                <span className="astra-heading text-lg">Drop media to create job</span>
              </div>
            </div>
          </motion.div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Terminal className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              {filter === "all" ? "No jobs yet. Click \"New Job\" or drag media here." : `No ${filter} jobs.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedJobId(job.id)}
                  className={cn(
                    "group relative bg-card border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-white/5",
                    selectedJobId === job.id ? "border-primary/40 ring-1 ring-primary/20" : "border-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                      <Terminal className={cn("w-5 h-5", statusConfig[job.status]?.color || "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="astra-heading text-sm truncate">{job.title}</span>
                        <span className="astra-terminal-text text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/5">{job.type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className={nodeColors[job.node] || "text-white"}>
                          <Server className="w-3 h-3 inline mr-0.5" />{job.node}
                        </span>
                        <span>
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {job.inputs?.length > 0 && <span>{job.inputs.length} input(s)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {(job.status === "running" || job.status === "queued") && (
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                            <span>{job.progress}%</span>
                          </div>
                          <ProgressBar progress={job.progress} status={job.status} />
                        </div>
                      )}
                      <StatusPill status={job.status} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateJobDialog
            open={showCreate}
            onClose={() => setShowCreate(false)}
            onCreated={(id) => setSelectedJobId(id)}
          />
        )}
        {selectedJob && !showCreate && (
          <JobDetailDrawer
            job={selectedJob}
            onClose={() => setSelectedJobId(null)}
            onSimulateFail={handleSimulateFail}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
