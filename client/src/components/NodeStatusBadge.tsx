import { useState } from "react";
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
  Kratos: Cpu,
  Hades: Box,
  Hermes: HardDrive,
};

const metricsLabels: Record<string, { label: string; key: string }[]> = {
  Kratos: [{ label: "GPU", key: "gpu" }, { label: "RAM", key: "ram" }],
  Hades: [{ label: "ComfyUI", key: "comfyui" }],
  Hermes: [{ label: "Storage", key: "storage" }, { label: "Used", key: "used" }],
};

function NodeRow({ node, onSelect }: { node: NodeStatusItem; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-2 w-full px-1 py-0.5 rounded hover:bg-white/5 transition-colors group"
      data-testid={`node-badge-${node.name.toLowerCase()}`}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor[node.status], dotGlow[node.status])} />
      <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors truncate">
        {node.name.slice(0, 3)}
      </span>
    </button>
  );
}

function NodeDetail({ node, checkedAt }: { node: NodeStatusItem; checkedAt: string }) {
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
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{node.name}</span>
        </div>
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border", chipStyle[node.status])}>
          <span className={cn("w-1.5 h-1.5 rounded-full", dotColor[node.status])} />
          <span className="capitalize">{node.status}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {metrics.map((m) => (
          <div key={m.key} className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-mono">{m.label}</span>
            <span className={cn(
              "font-mono",
              node.details[m.key] === "ok" ? "text-green-400" :
              node.details[m.key] === "degraded" ? "text-yellow-400" :
              node.details[m.key] === "unknown" ? "text-yellow-400/60" :
              "text-foreground"
            )}>
              {node.details[m.key] || "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground/60 font-mono">
        Checked: {new Date(checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </motion.div>
  );
}

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
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
          data-testid="node-status-trigger"
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
            allOnline ? "border-green-500/20 bg-green-500/5" :
            anyOffline ? "border-red-500/20 bg-red-500/5" :
            "border-yellow-500/20 bg-yellow-500/5"
          )}>
            <Server className={cn(
              "w-4 h-4 transition-colors",
              allOnline ? "text-green-400" :
              anyOffline ? "text-red-400" :
              "text-yellow-400"
            )} />
          </div>
          <div className="flex items-center gap-1">
            {data.nodes.map(n => (
              <span
                key={n.name}
                className={cn("w-1.5 h-1.5 rounded-full transition-colors", dotColor[n.status], dotGlow[n.status])}
              />
            ))}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-64 p-0 bg-card border-white/10"
        data-testid="node-status-popover"
      >
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold font-display tracking-wide uppercase text-muted-foreground">Node Status</span>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 rounded-full"
              onClick={() => runCheck()}
              disabled={isPending}
              data-testid="btn-health-check"
            >
              <RefreshCw className={cn("w-3 h-3", isPending && "animate-spin")} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
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
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                Last check: {new Date(data.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">Click a node for details</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-2 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => runCheck()}
            disabled={isPending}
            className="w-full text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            data-testid="btn-run-health-check"
          >
            <RefreshCw className={cn("w-3 h-3", isPending && "animate-spin")} />
            Run Health Check
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
