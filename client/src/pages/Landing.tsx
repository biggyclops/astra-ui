import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AstraLoginAtmosphere } from "@/components/AstraLoginAtmosphere";

type LandingProps = {
  onSignIn: (username: string, password: string, remember: boolean) => Promise<void>;
  onSsoSignIn: (username: string, password: string, remember: boolean) => Promise<void>;
};

export default function Landing({ onSignIn }: LandingProps) {
  const [username, setUsername] = useState("comeau");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const canSubmit = useMemo(() => username.trim().length > 0 && password.length > 0, [username, password]);

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
    <motion.main
      className="relative min-h-screen overflow-hidden bg-transparent text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <AstraLoginAtmosphere
        typingLevel={password.length > 0 || isPasswordFocused ? 1 : 0}
        awakened={isSubmitting}
        className="z-0"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(circle at 86% 32%, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.04) 16%, transparent 32%), radial-gradient(circle at 70% 58%, rgba(59,130,246,0.05) 0%, transparent 24%)",
          opacity: 0.22,
        }}
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitLogin();
        }}
        className="absolute z-10 flex flex-col gap-2"
        style={{
          left: "6%",
          top: "34%",
          width: "clamp(230px, 17.5vw, 290px)",
        }}
      >
        <Label htmlFor="landing-username" className="sr-only">
          Username / email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-50/45" />
          <Input
            id="landing-username"
            value={username}
            autoComplete="username"
            inputMode="email"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="operator@astra.local"
            className={cn(
              "h-11 border border-transparent bg-transparent pl-10 text-sm text-cyan-50 placeholder:text-cyan-100/26 shadow-none backdrop-blur-0 transition-all duration-200 ease-out",
              "hover:border-cyan-200/10 hover:bg-white/[0.01] focus-visible:border-cyan-200/20 focus-visible:ring-2 focus-visible:ring-cyan-300/20 focus-visible:shadow-[0_0_0_1px_rgba(34,211,238,0.14)]"
            )}
          />
        </div>

        <Label htmlFor="landing-password" className="sr-only">
          Password
        </Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-50/45" />
          <Input
            id="landing-password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
            placeholder="••••••••"
            className={cn(
              "h-11 border border-transparent bg-transparent pl-10 text-sm text-cyan-50 placeholder:text-cyan-100/26 shadow-none backdrop-blur-0 transition-all duration-200 ease-out",
              "hover:border-cyan-200/10 hover:bg-white/[0.01] focus-visible:border-cyan-200/20 focus-visible:ring-2 focus-visible:ring-cyan-300/20 focus-visible:shadow-[0_0_0_1px_rgba(34,211,238,0.14)]"
            )}
          />
        </div>

        {authError ? <p className="mt-1 text-xs text-rose-100/90">{authError}</p> : null}

        <Button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className={cn(
            "group mt-2 h-11 w-full rounded-none border border-transparent bg-transparent px-0 text-cyan-50 shadow-none",
            "transition-all duration-200 ease-out hover:bg-white/[0.01] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/20",
            isSubmitting ? "text-cyan-100/85" : ""
          )}
        >
          <span className="inline-flex items-center gap-2">
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200/80" /> : null}
            <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
          </span>
          <ArrowRight className={cn("h-4 w-4 transition-transform duration-200", isSubmitting ? "opacity-70" : "group-hover:translate-x-0.5")} />
        </Button>
      </form>
    </motion.main>
  );
}
