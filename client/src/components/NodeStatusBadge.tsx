import { memo, useState } from "react";
import { useNodeStatus, useRunHealthCheck, type NodeStatusItem } from "@/hooks/use-astra";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Server, RefreshCw, Cpu, HardDrive, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const dotColor: Record<string, string> = {
  online: "bg-green-400",
  offline: "bg-red-400",
  unknown: "bg-yellow-400",
};

const dotGlow: Record<string, string> = {
  online: "shadow-[0_0_6px_rgba(74,222,128,0.6)]",
  offline: "shadow-[0_0_6px_rgba(248,113,113,0.6)]",
  unknown: "shadow-[0_0_6px_rgba(250,204,21,0.5)]",
};

const chipStyle: Record<string, string> = {
  online: "bg-green-500/10 text-green-400 border-green-500/20",
  offline: "bg-red-500/10 text-red-400 border-red-500/20",
  unknown: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const nodeIcon: Record<string, typeof Cpu> = {
  Hades: Box,
  Hermes: HardDrive,
};

const metricsLabels: Record<string, { label: string; key: string }[]> = {
  Hades: [
    { label: "Storage", key: "storage" },
    { label: "CPU", key: "cpu" },
    { label: "Memory", key: "memory" },
    { label: "Docker", key: "docker" },
    { label: "GPU", key: "gpu" },
    { label: "VRAM", key: "vram" },
  ],
  Hermes: [
    { label: "Drive", key: "drive" },
    { label: "Mount", key: "mount" },
    { label: "Used", key: "used" },
    { label: "Extras", key: "extraDrives" },
  ],
};

const NodeRow = memo(function NodeRow({ node, onSelect }: { node: NodeStatusItem; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group flex w-full items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-cyan-300/8"
      data-testid={`node-badge-${node.name.toLowerCase()}`}
    >
      <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", dotColor[node.status], dotGlow[node.status])} />
      <span className="truncate astra-terminal-text text-slate-300 transition-colors group-hover:text-cyan-50">
        {node.name.slice(0, 3)}
      </span>
    </button>
  );
});

const NodeDetail = memo(function NodeDetail({ node, checkedAt }: { node: NodeStatusItem; checkedAt: string }) {
  const Icon = nodeIcon[node.name] || Server;
  const metrics = metricsLabels[node.name] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-cyan-300" />
          <span className="astra-heading text-sm text-cyan-50">{node.name}</span>
            </div>
            <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium", chipStyle[node.status])}>
              <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[node.status])} />
          <span className="astra-ui-label capitalize">{node.status}</span>
            </div>
          </div>

      <div className="space-y-1.5">
        {metrics.map((m) => (
          <div key={m.key} className="flex items-center justify-between text-[11px]">
            <span className="astra-ui-label text-muted-foreground font-mono">{m.label}</span>
            <span className={cn(
              "font-mono",
              node.details?.[m.key] === "ok" ? "text-green-400" :
              node.details?.[m.key] === "degraded" ? "text-yellow-400" :
              node.details?.[m.key] === "unknown" ? "text-yellow-400/60" :
              "text-foreground"
            )}>
              {node.details?.[m.key] || "—"}
            </span>
          </div>
        ))}
      </div>

      {node.extraDrives && node.extraDrives.length > 0 && (
        <div className="rounded-md border border-cyan-300/10 bg-slate-950/55 p-2">
          <div className="mb-1 astra-ui-label text-[10px] text-cyan-100/50">
            Extra Drives
          </div>
          <div className="space-y-1.5">
            {node.extraDrives.map((drive, index) => (
              <div key={`${drive.filesystem ?? "drive"}-${index}`} className="font-mono text-[10px] text-slate-300">
                <div>{drive.label || drive.filesystem || "Unknown drive"}</div>
                <div className="text-slate-500">
                  {drive.mounted
                    ? `${drive.mount || "mounted"} · ${drive.used && drive.total && drive.pct ? `${drive.used}/${drive.total} (${drive.pct})` : drive.size || "size unknown"}`
                    : `unmounted${drive.size ? ` · ${drive.size}` : ""}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="astra-terminal-text text-cyan-100/45">
        Checked: {new Date(checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </motion.div>
  );
});

export function NodeStatusBadge() {
  const { data } = useNodeStatus();
  const { mutate: runCheck, isPending } = useRunHealthCheck();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  if (!data) return null;

  const selected = data.nodes.find(n => n.name === selectedNode);
  const allOnline = data.nodes.every(n => n.status === "online");
  const anyOffline = data.nodes.some(n => n.status === "offline");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="group flex cursor-pointer flex-col items-center gap-1.5"
          data-testid="node-status-trigger"
        >
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-300",
            allOnline ? "border-cyan-300/20 bg-cyan-300/8 shadow-[0_0_20px_rgba(34,211,238,0.18)]" :
            anyOffline ? "border-red-500/20 bg-red-500/5" :
            "border-yellow-500/20 bg-yellow-500/5"
          )}>
            <Server className={cn(
              "h-4 w-4 transition-colors",
              allOnline ? "text-cyan-300" :
              anyOffline ? "text-red-400" :
              "text-yellow-400"
            )} />
          </div>
          <div className="flex items-center gap-1">
            {data.nodes.map(n => (
              <span
                key={n.name}
                className={cn("h-1.5 w-1.5 rounded-full transition-colors", dotColor[n.status], dotGlow[n.status])}
              />
            ))}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-72 border-cyan-300/10 bg-[rgba(3,8,22,0.98)] p-0 backdrop-blur-2xl"
        data-testid="node-status-popover"
      >
        <div className="border-b border-cyan-300/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="astra-ui-label text-xs text-cyan-100/55">Node Status</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => runCheck()}
              disabled={isPending}
              data-testid="btn-health-check"
            >
              <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {data.nodes.map(n => (
              <NodeRow key={n.name} node={n} onSelect={() => setSelectedNode(selectedNode === n.name ? null : n.name)} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <div className="p-3" key={selected.name}>
              <NodeDetail node={selected} checkedAt={data.checkedAt} />
            </div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 text-center"
            >
              <p className="astra-terminal-text text-cyan-100/50">
                Last check: {new Date(data.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="mt-1 astra-ui-label text-[10px] text-cyan-100/35">Click a node for details</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-cyan-300/10 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => runCheck()}
            disabled={isPending}
            className="w-full gap-1.5 text-xs text-cyan-100/60 hover:text-cyan-50"
            data-testid="btn-run-health-check"
          >
            <RefreshCw className={cn("h-3 w-3", isPending && "animate-spin")} />
            Run Health Check
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
