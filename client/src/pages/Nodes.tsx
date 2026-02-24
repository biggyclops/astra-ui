import { useNodeStatus, useRunHealthCheck } from "@/hooks/use-astra";
import { motion } from "framer-motion";
import {
  Cpu,
  Server,
  Activity,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Monitor,
  Database,
  Smartphone,
  Box,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof Server> = {
  Server: Server,
  Workstation: Monitor,
  NAS: Database,
  Device: Smartphone,
};

function statusColor(status: string) {
  if (status === "online")
    return {
      bg: "bg-green-500/10",
      text: "text-green-400",
      border: "border-green-500/20",
      icon: "bg-primary/20 text-primary",
    };
  if (status === "degraded" || status === "unknown")
    return {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20",
      icon: "bg-orange-500/20 text-orange-400",
    };
  return {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    icon: "bg-red-500/20 text-red-400",
  };
}

export default function Nodes() {
  const { data: statusData, isLoading } = useNodeStatus();
  const healthCheck = useRunHealthCheck();

  const nodes = statusData?.nodes ?? [];
  const checkedAt = statusData?.checkedAt;

  const ago = checkedAt
    ? Math.round((Date.now() - new Date(checkedAt).getTime()) / 1000)
    : null;

  return (
    <div className="min-h-screen bg-background p-8 pl-10 pt-20">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            System Status
          </h1>
          <p className="text-muted-foreground">
            Real-time telemetry from distributed compute nodes.
            {ago != null && (
              <span className="ml-2 text-xs text-zinc-500">
                Updated {ago < 5 ? "just now" : `${ago}s ago`}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => healthCheck.mutate()}
          disabled={healthCheck.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${healthCheck.isPending ? "animate-spin" : ""}`}
          />
          {healthCheck.isPending ? "Checking..." : "Refresh"}
        </button>
      </header>

      {isLoading && nodes.length === 0 && (
        <div className="text-center text-muted-foreground py-20">
          Loading node status...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node: any, idx: number) => {
          const colors = statusColor(node.status);
          const Icon = TYPE_ICONS[node.type] ?? Server;
          const hasCpu = node.cpu != null;
          const hasMem = node.mem != null;

          return (
            <motion.div
              key={node.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${colors.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{node.name}</h3>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">
                      {node.type}
                    </span>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${colors.bg} ${colors.text} ${colors.border}`}
                >
                  {node.status}
                </div>
              </div>

              <div className="space-y-4">
                {hasCpu && (
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                      <span>CPU</span>
                      <span>{node.cpu}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          node.cpu > 80 ? "bg-orange-500" : "bg-secondary"
                        }`}
                        style={{ width: `${node.cpu}%` }}
                      />
                    </div>
                  </div>
                )}
                {hasMem && (
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                      <span>Memory</span>
                      <span>{node.mem}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-700"
                        style={{ width: `${node.mem}%` }}
                      />
                    </div>
                  </div>
                )}

                {node.servicesTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-2 text-muted-foreground">
                      <span>Services</span>
                      <span>
                        {node.servicesUp}/{node.servicesTotal} up
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(node.services ?? []).map((svc: any) => (
                        <span
                          key={svc.name}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                            svc.ok
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {svc.ok ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5" />
                          )}
                          {svc.name}
                          <span className="opacity-60">{svc.ms}ms</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-xs font-mono text-zinc-500">
                {node.latencyMs != null && (
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> {node.latencyMs}ms
                  </div>
                )}
                {node.latencyMs == null && node.status === "online" && (
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" /> local
                  </div>
                )}
                {node.status === "offline" && (
                  <div className="flex items-center gap-1 text-red-400">
                    <WifiOff className="w-3 h-3" /> unreachable
                  </div>
                )}
                {node.disk && (
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" /> {node.disk}
                  </div>
                )}
                {node.docker != null && (
                  <div className="flex items-center gap-1">
                    <Box className="w-3 h-3" /> {node.docker} containers
                  </div>
                )}
                {!hasCpu && !node.disk && node.latencyMs == null && node.status !== "offline" && (
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> No metrics
                  </div>
                )}
              </div>

              {node.reason && node.status !== "online" && (
                <p className="mt-2 text-[10px] text-zinc-600 font-mono truncate">
                  {node.reason}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
