import { useNodeStatus, useRunHealthCheck, usePageVisible } from "@/hooks/use-astra";
import { useEffect, useRef, useState } from "react";
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
  Copy,
  Loader2,
  Terminal,
  ChevronDown,
  Link2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { readOpsToken } from "@/lib/ops-token";

const TYPE_ICONS: Record<string, typeof Server> = {
  Server: Server,
  Workstation: Monitor,
  NAS: Database,
  Device: Smartphone,
};

const CONTROL_NODE_NAMES = new Set(["Hades"]);
const RESTART_DOCKER_CMD = "systemctl restart docker";
const RESTART_OLLAMA_CMD = "systemctl restart ollama";
const RESTART_SERVICE_COPY: Record<string, { label: string; service: string }> = {
  [RESTART_DOCKER_CMD]: { label: "Docker", service: "docker" },
  [RESTART_OLLAMA_CMD]: { label: "Ollama", service: "ollama" },
};
const NODE_COMMANDS = [
  { label: "Uptime", cmd: "uptime" },
  { label: "Disk", cmd: "df -h" },
  { label: "Memory", cmd: "free -m" },
  { label: "GPU", cmd: "nvidia-smi" },
] as const;

const SYSTEM_CHECK_COMMANDS = [
  { heading: "UPTIME", cmd: "uptime" },
  { heading: "DISK", cmd: "df -h" },
  { heading: "MEMORY", cmd: "free -m" },
  { heading: "GPU", cmd: "nvidia-smi" },
] as const;

const RECOVER_NODE_COMMANDS = [
  { heading: "DOCKER RESTART", cmd: RESTART_DOCKER_CMD },
  { heading: "OLLAMA RESTART", cmd: RESTART_OLLAMA_CMD },
  { heading: "UPTIME", cmd: "uptime" },
  { heading: "DISK", cmd: "df -h" },
  { heading: "MEMORY", cmd: "free -m" },
  { heading: "GPU", cmd: "nvidia-smi" },
] as const;

type RunResult = {
  node: string;
  cmd: string;
  ok: boolean;
  stdout: string;
  stderr: string;
};

type ActionHistoryEntry = {
  id: string;
  timestamp: number;
  node: string;
  action: string;
  result: "success" | "error";
};

type NodeHealthBanner = {
  status: "healthy" | "warning" | "issues";
  timestamp: number;
};

type SystemSummaryItem = {
  label: string;
  status: string;
  value: string;
  tone: "ok" | "warning" | "active" | "idle" | "unknown";
};

type SshTarget = {
  name: string;
  ip?: string | null;
  sshUser?: string | null;
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

function parseDiskUsage(output: string): number | null {
  const usages = Array.from(output.matchAll(/\s(\d{1,3})%\s/g))
    .map((match) => parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value));
  return usages.length > 0 ? Math.max(...usages) : null;
}

function parseMemoryUsage(output: string): number | null {
  const line = output.split("\n").find((row) => row.trim().startsWith("Mem:"));
  if (!line) return null;
  const parts = line.trim().split(/\s+/);
  const total = parseFloat(parts[1]);
  const used = parseFloat(parts[2]);
  if (!Number.isFinite(total) || !Number.isFinite(used) || total <= 0) return null;
  return Math.round((used / total) * 100);
}

function parseGpuUsage(output: string): number | null {
  const smiTableMatch = output.match(/\|\s*\d+%[\s\S]*?\|\s*\d+MiB\s*\/\s*\d+MiB\s*\|\s*(\d{1,3})%\s*(?:Default|Off|On|N\/A)?\s*\|/);
  if (smiTableMatch) return parseInt(smiTableMatch[1], 10);
  const firstNumber = output.match(/^\s*(\d{1,3})\s*(?:,|%)/m);
  return firstNumber ? parseInt(firstNumber[1], 10) : null;
}

function buildSystemSummary(sections: { title: string; output: string }[]): SystemSummaryItem[] {
  const disk = parseDiskUsage(sections.find((section) => section.title === "DISK")?.output ?? "");
  const memory = parseMemoryUsage(sections.find((section) => section.title === "MEMORY")?.output ?? "");
  const gpu = parseGpuUsage(sections.find((section) => section.title === "GPU")?.output ?? "");

  return [
    disk == null
      ? { label: "Disk", status: "Unknown", value: "n/a", tone: "unknown" }
      : { label: "Disk", status: disk > 80 ? "Warning" : "OK", value: `${disk}%`, tone: disk > 80 ? "warning" : "ok" },
    memory == null
      ? { label: "Memory", status: "Unknown", value: "n/a", tone: "unknown" }
      : { label: "Memory", status: memory > 75 ? "Warning" : "Moderate", value: `${memory}%`, tone: memory > 75 ? "warning" : "ok" },
    gpu == null
      ? { label: "GPU", status: "Unknown", value: "n/a", tone: "unknown" }
      : { label: "GPU", status: gpu > 10 ? "Active" : "Idle", value: `${gpu}%`, tone: gpu > 10 ? "active" : "idle" },
  ];
}

function summaryToneClass(tone: SystemSummaryItem["tone"]) {
  if (tone === "warning") return "text-orange-300";
  if (tone === "active") return "text-cyan-300";
  if (tone === "idle") return "text-zinc-300";
  if (tone === "ok") return "text-green-300";
  return "text-zinc-500";
}

function actionNameForCommand(cmd: string) {
  if (cmd === "system check") return "System Check";
  if (cmd === "recover node") return "Recover Node";
  if (RESTART_SERVICE_COPY[cmd]) return `Restart ${RESTART_SERVICE_COPY[cmd].label}`;
  return NODE_COMMANDS.find((item) => item.cmd === cmd)?.label ?? cmd;
}

function formatHistoryTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function dispatchHermesRefresh() {
  window.dispatchEvent(new Event("hermes-refresh"));
}

function buildHealthBanner(ok: boolean, summary: SystemSummaryItem[]): NodeHealthBanner {
  if (!ok || summary.length === 0 || summary.some((item) => item.tone === "unknown")) {
    return { status: "issues", timestamp: Date.now() };
  }
  if (summary.some((item) => item.tone === "warning")) {
    return { status: "warning", timestamp: Date.now() };
  }
  return { status: "healthy", timestamp: Date.now() };
}

function healthBannerStyle(status: NodeHealthBanner["status"]) {
  if (status === "healthy") {
    return {
      label: "Healthy",
      dot: "bg-green-400",
      className: "border-green-500/20 bg-green-500/10 text-green-300",
    };
  }
  if (status === "warning") {
    return {
      label: "Warning",
      dot: "bg-yellow-400",
      className: "border-yellow-500/20 bg-yellow-500/10 text-yellow-200",
    };
  }
  return {
    label: "Issues",
    dot: "bg-red-400",
    className: "border-red-500/20 bg-red-500/10 text-red-300",
  };
}

function buildSshCommand(target: SshTarget) {
  if (!target.ip) return null;
  return `ssh ${target.sshUser ? `${target.sshUser}@` : ""}${target.ip}`;
}

function buildSshHref(target: SshTarget) {
  if (!target.ip) return null;
  return `ssh://${target.sshUser ? `${target.sshUser}@` : ""}${target.ip}`;
}

export default function Nodes() {
  const pageVisible = usePageVisible();
  const { data: statusData, isLoading } = useNodeStatus();
  const healthCheck = useRunHealthCheck();
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [restartConfirm, setRestartConfirm] = useState<{ node: string; cmd: string } | null>(null);
  const [recoverConfirmNode, setRecoverConfirmNode] = useState<string | null>(null);
  const [restartSuccessAt, setRestartSuccessAt] = useState<Record<string, Record<string, number>>>({});
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
  const [nodeHealthBanners, setNodeHealthBanners] = useState<Record<string, NodeHealthBanner>>({});
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const outputPreRef = useRef<HTMLPreElement>(null);

  const nodes = statusData?.nodes ?? [];
  const checkedAt = statusData?.checkedAt;
  const restartResultCopy = runResult?.cmd ? RESTART_SERVICE_COPY[runResult.cmd] : undefined;
  const isRestartResult = !!restartResultCopy;
  const isRestartSuccess = !!runResult?.ok && isRestartResult;
  const primaryOutputText = isRestartSuccess
    ? `${restartResultCopy.label} restarted successfully`
    : runResult?.stdout || runResult?.stderr || "No output.";
  const detailsText = isRestartResult && runResult?.stderr.trim() ? runResult.stderr.trim() : "";
  const outputText = detailsText
    ? `${primaryOutputText}\n\nDetails:\n${detailsText}`
    : primaryOutputText;
  const systemCheckSections =
    runResult?.cmd === "system check"
      ? outputText.split(/\n\n(?==== )/).map((section) => {
          const match = section.match(/^=== ([A-Z ]+) ===\n?([\s\S]*)$/);
          return match ? { title: match[1], output: match[2] || "No output." } : null;
        }).filter((section): section is { title: string; output: string } => section !== null)
      : [];
  const systemSummary = systemCheckSections.length > 0 ? buildSystemSummary(systemCheckSections) : [];

  const ago = checkedAt
    ? Math.round((Date.now() - new Date(checkedAt).getTime()) / 1000)
    : null;

  const getOpsToken = () => readOpsToken();

  const addActionHistory = (nodeName: string, cmd: string, ok: boolean) => {
    const timestamp = Date.now();
    setActionHistory((prev) => [
      {
        id: `${timestamp}-${nodeName}-${cmd}`,
        timestamp,
        node: nodeName,
        action: actionNameForCommand(cmd),
        result: ok ? "success" as const : "error" as const,
      },
      ...prev,
    ].slice(0, 20));
  };

  const runOpsCommand = async (nodeName: string, cmd: string, token: string) => {
    const response = await fetch("/api/ops/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-astra-ops-token": token,
      },
      body: JSON.stringify({ node: nodeName, cmd }),
    });
    const payload = await response.json().catch(() => null);
    return {
      ok: response.ok && !!payload?.ok,
      stdout: typeof payload?.stdout === "string" ? payload.stdout : "",
      stderr:
        typeof payload?.stderr === "string"
          ? payload.stderr
          : payload?.message ?? payload?.error ?? `HTTP ${response.status}`,
    };
  };

  const runNodeCommand = async (nodeName: string, cmd: string) => {
    const key = `${nodeName}:${cmd}`;
    const token = getOpsToken();

    if (!token) {
      setRunResult({
        node: nodeName,
        cmd,
        ok: false,
        stdout: "",
        stderr: "Missing ops token. Set x-astra-ops-token in Settings.",
      });
      addActionHistory(nodeName, cmd, false);
      return;
    }

    setRunningKey(key);
    try {
      const result = await runOpsCommand(nodeName, cmd, token);
      setRunResult({
        node: nodeName,
        cmd,
        ok: result.ok,
        stdout: result.stdout,
        stderr: result.stderr,
      });
      addActionHistory(nodeName, cmd, result.ok);
      if (RESTART_SERVICE_COPY[cmd]) {
        setRestartSuccessAt((prev) => ({
          ...prev,
          [nodeName]: {
            ...(prev[nodeName] ?? {}),
            [cmd]: result.ok ? Date.now() : 0,
          },
        }));
      }
    } catch (error) {
      setRunResult({
        node: nodeName,
        cmd,
        ok: false,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Command request failed",
      });
      addActionHistory(nodeName, cmd, false);
      if (RESTART_SERVICE_COPY[cmd]) {
        setRestartSuccessAt((prev) => ({
          ...prev,
          [nodeName]: {
            ...(prev[nodeName] ?? {}),
            [cmd]: 0,
          },
        }));
      }
    } finally {
      setRunningKey(null);
    }
  };

  const runSystemCheck = async (nodeName: string) => {
    const token = getOpsToken();

    if (!token) {
      setRunResult({
        node: nodeName,
        cmd: "system check",
        ok: false,
        stdout: "",
        stderr: "Missing ops token. Set x-astra-ops-token in Settings.",
      });
      addActionHistory(nodeName, "system check", false);
      return;
    }

    setRunningKey(`${nodeName}:system-check`);
    setRunResult({
      node: nodeName,
      cmd: "system check",
      ok: true,
      stdout: "Running system check...",
      stderr: "",
    });

    const sections: string[] = [];
    const summarySections: { title: string; output: string }[] = [];
    let allOk = true;

    for (const item of SYSTEM_CHECK_COMMANDS) {
      try {
        const result = await runOpsCommand(nodeName, item.cmd, token);
        if (!result.ok) allOk = false;
        const output = result.stdout || result.stderr || "No output.";
        sections.push(`=== ${item.heading} ===\n${output}`);
        summarySections.push({ title: item.heading, output });
      } catch (error) {
        allOk = false;
        const output = error instanceof Error ? error.message : "Command request failed";
        sections.push(`=== ${item.heading} ===\n${output}`);
        summarySections.push({ title: item.heading, output });
      }
    }

    setRunResult({
      node: nodeName,
      cmd: "system check",
      ok: allOk,
      stdout: sections.join("\n\n"),
      stderr: "",
    });
    setNodeHealthBanners((prev) => ({
      ...prev,
      [nodeName]: buildHealthBanner(allOk, buildSystemSummary(summarySections)),
    }));
    addActionHistory(nodeName, "system check", allOk);
    setRunningKey(null);
    dispatchHermesRefresh();
  };

  const runRecoverNode = async (nodeName: string) => {
    const token = getOpsToken();

    if (!token) {
      setRunResult({
        node: nodeName,
        cmd: "recover node",
        ok: false,
        stdout: "",
        stderr: "Missing ops token. Set x-astra-ops-token in Settings.",
      });
      addActionHistory(nodeName, "recover node", false);
      return;
    }

    setRunningKey(`${nodeName}:recover-node`);
    setRunResult({
      node: nodeName,
      cmd: "recover node",
      ok: true,
      stdout: "Recovering node...",
      stderr: "",
    });

    const restartTimestamps: Record<string, number> = {};
    const restartSections: string[] = [];
    const systemSections: string[] = [];
    const summarySections: { title: string; output: string }[] = [];
    let allOk = true;

    for (const item of RECOVER_NODE_COMMANDS) {
      try {
        const result = await runOpsCommand(nodeName, item.cmd, token);
        if (!result.ok) allOk = false;
        if (result.ok && RESTART_SERVICE_COPY[item.cmd]) {
          restartTimestamps[item.cmd] = Date.now();
        }
        const output =
          result.stdout ||
          result.stderr ||
          (RESTART_SERVICE_COPY[item.cmd] ? `${RESTART_SERVICE_COPY[item.cmd].label} restarted successfully` : "No output.");
        const section = `=== ${item.heading} ===\n${output}`;
        if (RESTART_SERVICE_COPY[item.cmd]) {
          restartSections.push(section);
        } else {
          systemSections.push(section);
          summarySections.push({ title: item.heading, output });
        }
      } catch (error) {
        allOk = false;
        const output = error instanceof Error ? error.message : "Command request failed";
        const section = `=== ${item.heading} ===\n${output}`;
        if (RESTART_SERVICE_COPY[item.cmd]) {
          restartSections.push(section);
        } else {
          systemSections.push(section);
          summarySections.push({ title: item.heading, output });
        }
      }
    }

    if (Object.keys(restartTimestamps).length > 0) {
      setRestartSuccessAt((prev) => ({
        ...prev,
        [nodeName]: {
          ...(prev[nodeName] ?? {}),
          ...restartTimestamps,
        },
      }));
    }

    setRunResult({
      node: nodeName,
      cmd: "recover node",
      ok: allOk,
      stdout: `${restartSections.join("\n\n")}\n\n=== SYSTEM CHECK ===\n${systemSections.join("\n\n")}`,
      stderr: "",
    });
    setNodeHealthBanners((prev) => ({
      ...prev,
      [nodeName]: buildHealthBanner(allOk, buildSystemSummary(summarySections)),
    }));
    addActionHistory(nodeName, "recover node", allOk);
    setRunningKey(null);
    dispatchHermesRefresh();
  };

  useEffect(() => {
    const el = outputContainerRef.current ?? outputPreRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [outputText]);

  useEffect(() => {
    setCopiedOutput(false);
  }, [outputText]);

  useEffect(() => {
    if (!pageVisible || Object.keys(restartSuccessAt).length === 0) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pageVisible, restartSuccessAt]);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopiedOutput(true);
    } catch {
      setCopiedOutput(false);
    }
  };

  const copyText = async (value: string, title: string, description: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title, description });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked by the browser.",
        variant: "destructive",
      });
    }
  };

  const copySshCommand = async (target: SshTarget) => {
    const command = buildSshCommand(target);
    if (!command) {
      toast({ title: "SSH unavailable", description: `${target.name} has no SSH target configured.`, variant: "destructive" });
      return;
    }
    await copyText(command, "SSH command copied", command);
  };

  const copyNodeIp = async (target: SshTarget) => {
    if (!target.ip) {
      toast({ title: "IP unavailable", description: `${target.name} has no network address configured.`, variant: "destructive" });
      return;
    }
    await copyText(target.ip, "IP copied", target.ip);
  };

  const openSshLink = (target: SshTarget) => {
    const sshHref = buildSshHref(target);
    if (!sshHref) {
      toast({ title: "SSH unavailable", description: `${target.name} has no SSH target configured.`, variant: "destructive" });
      return;
    }
    window.open(sshHref, "_self", "noopener,noreferrer");
    toast({
      title: "Opening SSH handler",
      description: "If nothing launches, use Copy SSH instead.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-8 pl-10 pt-20">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="astra-logo text-3xl text-white mb-2">
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

      <section className="mb-6 rounded-2xl border border-white/5 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="astra-ui-label text-sm text-zinc-500">
            Recent Actions
          </h2>
          <span className="text-xs text-zinc-600">
            Last {Math.min(actionHistory.length, 10)}
          </span>
        </div>
        {actionHistory.length === 0 ? (
          <p className="text-sm text-zinc-500">No actions yet.</p>
        ) : (
          <div className="space-y-2">
            {actionHistory.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-zinc-300"
              >
                <span className="astra-terminal-text text-zinc-500">
                  [{formatHistoryTime(entry.timestamp)}]
                </span>
                <span>{entry.node}</span>
                <span className="text-zinc-600">→</span>
                <span>{entry.action}</span>
                <span className="text-zinc-600">→</span>
                <span className={entry.result === "success" ? "font-semibold text-green-300" : "font-semibold text-red-300"}>
                  {entry.result === "success" ? "OK" : "ERROR"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node: any, idx: number) => {
          const colors = statusColor(node.status);
          const Icon = TYPE_ICONS[node.type] ?? Server;
          const hasCpu = node.cpu != null;
          const hasMem = node.mem != null;
          const hasGpu = node.gpuUtil != null;
          const dockerRestartedAt = restartSuccessAt[node.name]?.[RESTART_DOCKER_CMD] ?? 0;
          const dockerRestartedAgo = dockerRestartedAt
            ? Math.max(0, Math.floor((nowMs - dockerRestartedAt) / 1000))
            : null;
          const showDockerRestarted = dockerRestartedAgo != null && dockerRestartedAgo < 60;
          const ollamaRestartedAt = restartSuccessAt[node.name]?.[RESTART_OLLAMA_CMD] ?? 0;
          const ollamaRestartedAgo = ollamaRestartedAt
            ? Math.max(0, Math.floor((nowMs - ollamaRestartedAt) / 1000))
            : null;
          const showOllamaRestarted = ollamaRestartedAgo != null && ollamaRestartedAgo < 60;
          const healthBanner = nodeHealthBanners[node.name];
          const healthBannerCopy = healthBanner ? healthBannerStyle(healthBanner.status) : null;

          return (
            <motion.div
              key={node.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

              {healthBannerCopy && (
                <div className={`relative mb-4 flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold ${healthBannerCopy.className}`}>
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${healthBannerCopy.dot}`} />
                    {healthBannerCopy.label}
                  </span>
                  <span className="font-mono text-[10px] opacity-70">
                    {formatHistoryTime(healthBanner.timestamp)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${colors.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                        className="inline-flex items-center gap-1 rounded-md astra-heading text-lg text-left text-white transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                          <span>{node.name}</span>
                          {(node.ip || node.sshUser) && <ChevronDown className="h-4 w-4 opacity-70" />}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={() => copySshCommand(node)}>
                          <Terminal className="h-4 w-4" />
                          Copy SSH Command
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyNodeIp(node)} disabled={!node.ip}>
                          <Copy className="h-4 w-4" />
                          Copy IP Address
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openSshLink(node)}>
                          <Link2 className="h-4 w-4" />
                          Open SSH Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="astra-ui-label text-xs text-muted-foreground">
                      {node.type}
                    </span>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
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
                {hasGpu && (
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                      <span>GPU</span>
                      <span>{node.gpuUtil}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          node.gpuUtil > 85 ? "bg-orange-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${node.gpuUtil}%` }}
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

              {CONTROL_NODE_NAMES.has(node.name) && (
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
                    <Terminal className="h-3.5 w-3.5" />
                    <span className="astra-ui-label text-xs text-zinc-500">Controls</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {NODE_COMMANDS.map((item) => {
                      const isRunning = runningKey === `${node.name}:${item.cmd}`;
                      return (
                        <button
                          key={item.cmd}
                          type="button"
                          onClick={() => runNodeCommand(node.name, item.cmd)}
                          disabled={runningKey != null}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-primary/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {item.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => runSystemCheck(node.name)}
                      disabled={runningKey != null}
                      className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-primary/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {runningKey === `${node.name}:system-check` && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {runningKey === `${node.name}:system-check` ? "Running system check..." : "System Check"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestartConfirm({ node: node.name, cmd: RESTART_DOCKER_CMD })}
                      disabled={runningKey != null}
                      className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 text-xs font-medium text-orange-200 transition-colors hover:border-orange-400/60 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {runningKey === `${node.name}:${RESTART_DOCKER_CMD}` && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Restart Docker
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestartConfirm({ node: node.name, cmd: RESTART_OLLAMA_CMD })}
                      disabled={runningKey != null}
                      className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {runningKey === `${node.name}:${RESTART_OLLAMA_CMD}` && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Restart Ollama
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoverConfirmNode(node.name)}
                      disabled={runningKey != null}
                      className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 text-xs font-medium text-green-200 transition-colors hover:border-green-400/60 hover:bg-green-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {runningKey === `${node.name}:recover-node` && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {runningKey === `${node.name}:recover-node` ? "Recovering node..." : "Recover Node"}
                    </button>
                    {showDockerRestarted && (
                      <div className="col-span-2 inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 text-xs font-medium text-green-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Docker restarted {dockerRestartedAgo}s ago
                      </div>
                    )}
                    {showOllamaRestarted && (
                      <div className="col-span-2 inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 text-xs font-medium text-green-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ollama restarted {ollamaRestartedAgo}s ago
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                {node.vramUsed != null && node.vramTotal != null && (
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> VRAM {node.vramUsed}/{node.vramTotal} MiB
                  </div>
                )}
                {node.name === "Hermes" && node.extraDrives?.length > 0 && (
                  <div className="basis-full rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div className="mb-2 astra-ui-label text-[10px] text-zinc-500">
                      Extra Drives
                    </div>
                    <div className="space-y-1.5">
                      {node.extraDrives.map((drive: any, index: number) => (
                        <div key={`${drive.filesystem ?? "drive"}-${index}`} className="flex items-start justify-between gap-3 text-[11px]">
                          <div className="min-w-0">
                            <div className="truncate text-zinc-200">{drive.label || drive.filesystem || "Unknown drive"}</div>
                            <div className="truncate text-zinc-500">
                              {drive.model || drive.mount || (drive.mounted ? "mounted" : "unmounted")}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-zinc-400">
                            {drive.mounted
                              ? (drive.used && drive.total && drive.pct ? `${drive.used}/${drive.total} (${drive.pct})` : drive.size || "mounted")
                              : `unmounted${drive.size ? ` · ${drive.size}` : ""}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!hasCpu && !hasGpu && !node.disk && node.latencyMs == null && node.status !== "offline" && (
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

      <Dialog open={!!runResult} onOpenChange={(open) => !open && setRunResult(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              {runResult?.node} · {runResult?.cmd}
            </DialogTitle>
            <DialogDescription>
              {isRestartSuccess
                ? `${restartResultCopy.label} restarted successfully`
                : runResult?.ok
                  ? "Command completed."
                  : "Command failed or was rejected."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={copyOutput}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-primary/40 hover:bg-white/10"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedOutput ? "Copied" : "Copy Output"}
            </button>
          </div>
          {systemCheckSections.length > 0 ? (
            <div
              ref={outputContainerRef}
              className="max-h-[460px] overflow-auto rounded-lg border border-white/10 bg-black/40"
            >
              <div className="border-b border-white/10 bg-white/[0.03] p-4">
                  <h3 className="astra-heading mb-2 text-sm text-zinc-100">
                  System Status
                  </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {systemSummary.map((item) => (
                    <div key={item.label} className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                      <div className="astra-ui-label text-[10px] text-zinc-500">
                        {item.label}
                      </div>
                      <div className={`mt-1 text-sm font-semibold ${summaryToneClass(item.tone)}`}>
                        {item.status} <span className="text-zinc-400">({item.value})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {systemCheckSections.map((section, index) => (
                <section key={section.title} className={index > 0 ? "border-t border-white/10" : undefined}>
                  <h3 className="astra-heading px-4 pt-4 text-sm text-zinc-100">
                    {section.title}
                  </h3>
                  <pre className="px-4 pb-4 pt-2 font-mono text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">
                    {section.output}
                  </pre>
                </section>
              ))}
            </div>
          ) : (
            <pre
              ref={outputPreRef}
              className="max-h-[460px] overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap"
            >
              {primaryOutputText}
            </pre>
          )}
          {detailsText && (
            <section className="rounded-lg border border-orange-500/20 bg-orange-500/10">
              <h3 className="astra-heading border-b border-orange-500/20 px-4 py-2 text-sm text-orange-100">
                Details
              </h3>
              <pre className="max-h-40 overflow-auto p-4 font-mono text-xs leading-relaxed text-orange-100 whitespace-pre-wrap">
                {detailsText}
              </pre>
            </section>
          )}
          {runResult?.stderr && runResult.stdout && !detailsText && (
            <pre className="max-h-40 overflow-auto rounded-lg border border-red-500/20 bg-red-500/10 p-4 font-mono text-xs leading-relaxed text-red-200 whitespace-pre-wrap">
              {runResult.stderr}
            </pre>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!restartConfirm} onOpenChange={(open) => !open && setRestartConfirm(null)}>
        <AlertDialogContent className="border-white/10 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="astra-heading">
              Restart {restartConfirm ? RESTART_SERVICE_COPY[restartConfirm.cmd]?.label : "service"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restart {restartConfirm ? RESTART_SERVICE_COPY[restartConfirm.cmd]?.label : "this service"} on Hades?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = restartConfirm ?? { node: "Hades", cmd: RESTART_DOCKER_CMD };
                setRestartConfirm(null);
                void runNodeCommand(action.node, action.cmd);
              }}
              className="bg-orange-500 text-white hover:bg-orange-500/90"
            >
              Restart {restartConfirm ? RESTART_SERVICE_COPY[restartConfirm.cmd]?.label : "service"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!recoverConfirmNode} onOpenChange={(open) => !open && setRecoverConfirmNode(null)}>
        <AlertDialogContent className="border-white/10 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="astra-heading">Recover Node</AlertDialogTitle>
            <AlertDialogDescription>
              This will restart Docker and Ollama, then run a system check. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const nodeName = recoverConfirmNode ?? "Hades";
                setRecoverConfirmNode(null);
                void runRecoverNode(nodeName);
              }}
              className="bg-green-500 text-white hover:bg-green-500/90"
            >
              Recover Node
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
