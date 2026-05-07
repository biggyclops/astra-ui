import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Cpu,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AstraVisualPanel } from "@/components/AstraVisualPanel";
import { cn } from "@/lib/utils";

type LandingProps = {
  onSignIn: (username: string, password: string, remember: boolean) => Promise<void>;
  onSsoSignIn: (username: string, password: string, remember: boolean) => Promise<void>;
};

const trustBadges = [
  { label: "Encrypted session", icon: ShieldCheck },
  { label: "Node-aware", icon: Cpu },
  { label: "Operational telemetry", icon: Activity },
  { label: "Astra presence", icon: Sparkles },
];

const telemetryRows = [
  { label: "Session", value: "LOCAL-EDGE", icon: BadgeCheck },
  { label: "Node mesh", value: "12 ONLINE", icon: Wifi },
  { label: "Latency", value: "18 ms", icon: Clock3 },
  { label: "Lock state", value: "SEALED", icon: LockKeyhole },
];

function AstraMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-950/70 shadow-[0_0_30px_rgba(34,211,238,0.22)]">
        <img src="/icon-192.png" alt="Astra logo" className="h-9 w-9 object-contain" />
      </div>
      <div className="leading-tight">
        <p className="astra-ui-label text-[0.7rem] text-cyan-100/70">Astra</p>
        <p className="text-sm text-cyan-50/60">Secure command surface</p>
      </div>
    </div>
  );
}

function TelemetryChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] px-3 py-2 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-cyan-100/50">
        <Icon className="h-3.5 w-3.5 text-cyan-200/90" />
        <span className="astra-ui-label text-[0.62rem]">{label}</span>
      </div>
      <p className="mt-1 text-sm text-cyan-50/85">{value}</p>
    </div>
  );
}

export default function Landing({ onSignIn, onSsoSignIn }: LandingProps) {
  const [username, setUsername] = useState("comeau");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const canSubmit = useMemo(() => username.trim().length > 0 && password.length > 0, [username, password]);
  const timeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(now),
    [now]
  );
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(now),
    [now]
  );

  const submitLogin = async () => {
    if (!canSubmit) {
      setAuthError("Enter a username and password.");
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);
    try {
      await onSignIn(username.trim(), password, true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020712] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 16% 18%, rgba(34,211,238,0.14), transparent 22%), radial-gradient(circle at 86% 16%, rgba(59,130,246,0.1), transparent 20%), linear-gradient(180deg, rgba(2,7,18,0.88) 0%, rgba(3,9,24,0.92) 54%, rgba(1,4,11,1) 100%), linear-gradient(rgba(125,211,252,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.045) 1px, transparent 1px)",
          backgroundSize: "auto, auto, auto, 80px 80px, 80px 80px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent opacity-50" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="pointer-events-none fixed right-4 top-4 z-30 hidden sm:block sm:right-6 sm:top-6 lg:right-8">
          <div className="rounded-2xl border border-cyan-300/12 bg-slate-950/60 px-3 py-2 text-right text-cyan-100/75 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-end gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
              <span className="astra-terminal-text text-cyan-100/85">{timeLabel}</span>
            </div>
            <p className="mt-1 astra-ui-label text-[0.62rem] text-cyan-100/45">{dateLabel}</p>
          </div>
        </div>

        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-5 flex items-start justify-between gap-4 pr-[7.5rem] sm:pr-[9rem] lg:pr-[10rem]"
        >
          <AstraMark />

          <div className="hidden items-center gap-2 rounded-2xl border border-cyan-300/12 bg-slate-950/50 px-3 py-2 text-xs text-cyan-100/65 backdrop-blur-xl sm:flex">
            <TerminalSquare className="h-4 w-4 text-cyan-300" />
            <span className="astra-ui-label text-[0.68rem] text-cyan-100/70">Port 8080 ready</span>
          </div>
        </motion.header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(430px,0.86fr)_minmax(0,1.14fr)] xl:items-center">
          <motion.section
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative self-center overflow-hidden rounded-[1.75rem] border border-cyan-300/12 bg-[rgba(5,11,26,0.72)] shadow-[0_0_80px_rgba(34,211,238,0.08)] backdrop-blur-2xl lg:h-[calc(100vh-9rem)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_82%_8%,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_28%,rgba(2,6,23,0.24)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[length:100%_4px] opacity-20" />

            <div className="relative flex flex-col justify-between gap-6 p-5 sm:p-7 lg:h-full lg:p-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/12 bg-cyan-400/8 px-3 py-2 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
                    <Activity className="h-3.5 w-3.5 text-cyan-200" />
                    <span className="astra-ui-label text-[0.68rem] text-cyan-50/75">Live presence</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/10 bg-white/[0.03] px-3 py-2 text-xs text-cyan-50/70">
                    <Globe2 className="h-3.5 w-3.5 text-cyan-200/80" />
                    Local edge session
                  </span>
                </div>

                <div className="max-w-xl space-y-4">
                  <div className="space-y-2">
                    <p className="astra-ui-label text-xs text-cyan-100/45">Astral interface</p>
                    <h1 className="astra-heading text-4xl text-white sm:text-5xl xl:text-6xl">
                      <span className="bg-gradient-to-r from-cyan-100 via-white to-cyan-300 bg-clip-text text-transparent">
                        Astra
                      </span>
                    </h1>
                    <p className="max-w-lg text-sm leading-7 text-cyan-50/66 sm:text-[0.98rem]">
                      A restrained login surface for the command layer, tuned for readability, status awareness, and quiet
                      control.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {telemetryRows.map(({ label, value, icon: Icon }) => (
                      <TelemetryChip key={label} label={label} value={value} icon={Icon} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-cyan-300/10 bg-slate-950/35 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3">
                      <span className="astra-ui-label text-[0.65rem] text-cyan-100/45">Session state</span>
                      <span className="rounded-full border border-cyan-300/12 bg-cyan-300/10 px-2 py-1 astra-terminal-text text-cyan-50/80">
                        STABLE
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-cyan-50/70">
                      Readiness checks are active. Authentication opens the workspace without changing the visual tone.
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] border border-cyan-300/10 bg-slate-950/35 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3">
                      <span className="astra-ui-label text-[0.65rem] text-cyan-100/45">Security layer</span>
                      <span className="rounded-full border border-cyan-300/12 bg-cyan-300/10 px-2 py-1 astra-terminal-text text-cyan-50/80">
                        SEALED
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-cyan-50/70">
                      Encrypted access, restrained motion, and subtle telemetry signals tuned for operational work.
                    </p>
                  </div>
                </div>

                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitLogin();
                  }}
                  className="w-full max-w-[29rem] rounded-[1.35rem] border border-cyan-300/12 bg-slate-950/52 p-4 shadow-[0_0_36px_rgba(34,211,238,0.06)] backdrop-blur-2xl"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="astra-ui-label text-[0.65rem] text-cyan-100/45">Authentication</p>
                      <h2 className="text-sm text-cyan-50/85">Local session access</h2>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/12 bg-cyan-300/8 px-2.5 py-1 text-[0.62rem] text-cyan-100/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.75)]" />
                      local session
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="landing-username" className="astra-ui-label text-[0.65rem] text-cyan-100/45">
                        Username / email
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/55" />
                        <Input
                          id="landing-username"
                          value={username}
                          autoComplete="username"
                          inputMode="email"
                          onChange={(event) => setUsername(event.target.value)}
                          placeholder="operator@astra.local"
                          className={cn(
                            "h-11 border-cyan-300/12 bg-slate-950/55 pl-10 text-sm text-cyan-50 placeholder:text-cyan-100/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors duration-200 focus-visible:border-cyan-200/40 focus-visible:ring-2 focus-visible:ring-cyan-300/28",
                            "hover:border-cyan-300/20"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="landing-password" className="astra-ui-label text-[0.65rem] text-cyan-100/45">
                        Password
                      </Label>
                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/55" />
                        <Input
                          id="landing-password"
                          type="password"
                          value={password}
                          autoComplete="current-password"
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="••••••••"
                          className={cn(
                            "h-11 border-cyan-300/12 bg-slate-950/55 pl-10 text-sm text-cyan-50 placeholder:text-cyan-100/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors duration-200 focus-visible:border-cyan-200/40 focus-visible:ring-2 focus-visible:ring-cyan-300/28",
                            "hover:border-cyan-300/20"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[0.72rem] text-cyan-100/52">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan-300/80" />
                      <span className="astra-terminal-text">Local session active</span>
                    </div>
                    <p className="text-[0.7rem] text-cyan-100/38">No remote prompt required</p>
                  </div>

                  {authError ? (
                    <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/8 px-3 py-2 text-sm text-rose-100/90">
                      {authError}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className="mt-4 h-11 w-full rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.08)] transition-colors duration-200 hover:bg-cyan-300/14 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  >
                    <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.form>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
            className="relative hidden self-center overflow-hidden rounded-[1.75rem] border border-cyan-300/12 bg-[rgba(4,10,24,0.74)] shadow-[0_0_100px_rgba(34,211,238,0.08)] backdrop-blur-2xl md:block lg:h-[calc(100vh-9rem)]"
          >
            <div className="relative h-[34rem] overflow-hidden p-3 sm:p-4 lg:h-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_20%_78%,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.06)_0%,rgba(2,6,23,0.18)_46%,rgba(2,6,23,0.78)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(125,211,252,0.03)_1px,transparent_1px)] bg-[length:72px_100%] opacity-30" />

              <AstraVisualPanel className="relative h-full" />
            </div>
          </motion.section>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-cyan-100/45">
          <Check className="h-3.5 w-3.5 text-cyan-300" />
          <span className="astra-ui-label text-xs text-cyan-100/45">Login interface ready for secure access</span>
        </div>
      </div>
    </main>
  );
}
