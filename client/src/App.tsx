import { Switch, Route, useLocation } from "wouter";
import { type FormEvent, useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/Sidebar";

// Pages
import Chat from "@/pages/Chat";
import MediaWall from "@/pages/MediaWall";
import Nodes from "@/pages/Nodes";
import Jobs from "@/pages/Jobs";
import Settings from "@/pages/Settings";
import Autonomy from "@/pages/Autonomy";
import Intel from "@/pages/Intel";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

function AstraLoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [message, setMessage] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setMessage("Enter a username and password.");
      return;
    }

    setMessage("");
    setIsSubmitting(true);
    let unlocked = false;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.authenticated) {
        throw new Error(data.message || "Login failed");
      }

      unlocked = true;
      setIsUnlocking(true);
      window.setTimeout(onAuthenticated, 950);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
      setIsSubmitting(false);
    } finally {
      if (!unlocked) {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <main className={`astra-login-stage${isUnlocking ? " is-unlocking" : ""}`}>
      <div className="astra-login-split">
        <section className="astra-login-left">
          <img className="astra-login-brand" src="/astra-brand-horizontal.png" alt="Astra" />
          <div className="astra-login-panel">
            <span className="astra-login-scan" aria-hidden="true" />
            <form className="astra-login-form" onSubmit={submitLogin}>
              <label className="astra-login-field" aria-label="Username">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  disabled={isSubmitting || isUnlocking}
                />
              </label>

              <label className="astra-login-field" aria-label="Password">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={isSubmitting || isUnlocking}
                />
                <button
                  className="astra-password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isSubmitting || isUnlocking}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </label>

              {message ? <p className="astra-login-message">{message}</p> : null}

              <button className="astra-login-submit" type="submit" disabled={isSubmitting || isUnlocking}>
                {isUnlocking ? "Access granted" : isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </section>

        <section className="astra-login-right" aria-hidden="true">
          {/* Background image only; video intentionally omitted */}
        </section>
      </div>

      <style>{`
        .astra-login-stage {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: #000;
          color: rgb(240, 253, 255);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          transition:
            opacity 300ms ease 650ms,
            filter 300ms ease 650ms;
        }

        .astra-login-stage.is-unlocking {
          opacity: 0;
          filter: brightness(0.45);
        }

        .astra-login-split {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: 49.5% 50.5%;
        }

        .astra-login-left,
        .astra-login-right {
          position: relative;
          min-width: 0;
          min-height: 0;
        }

        .astra-login-left {
          background:
            radial-gradient(circle at 22% 14%, rgba(10, 20, 32, 0.45) 0%, rgba(0, 0, 0, 0) 42%),
            linear-gradient(180deg, #000 0%, #02040a 100%);
        }

        .astra-login-left::before,
        .astra-login-left::after,
        .astra-login-right::before,
        .astra-login-right::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .astra-login-left::before {
          z-index: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.35) 100%);
        }

        .astra-login-left::after {
          z-index: 1;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.02) 100%);
        }

        .astra-login-right {
          background: url('/astra-login-bg.jpg') center center / cover no-repeat #000;
        }

        .astra-login-right::before {
          z-index: 1;
          background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.18) 12%, rgba(0, 0, 0, 0) 38%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.14) 0%, rgba(0, 0, 0, 0.22) 100%);
        }

        .astra-login-right::after {
          z-index: 2;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.28) 100%);
        }

        .astra-login-brand {
          position: absolute;
          left: 42px;
          top: 48px;
          z-index: 3;
          width: 442px;
          height: 138px;
          object-fit: contain;
          transition: filter 360ms ease;
        }

        .astra-login-stage.is-unlocking .astra-login-brand {
          filter: brightness(1.45) drop-shadow(0 0 18px rgba(103, 232, 249, 0.22));
        }

        .astra-login-panel {
          position: absolute;
          left: 42px;
          bottom: 64px;
          z-index: 3;
          width: min(47vw, 900px);
          max-width: 820px;
          padding: 16px;
          border: 1px solid rgba(28, 139, 168, 0.5);
          background: rgba(1, 7, 17, 0.94);
          overflow: hidden;
          box-shadow:
            inset 0 0 0 1px rgba(49, 199, 233, 0.035),
            0 0 0 1px rgba(3, 12, 24, 0.62);
          transition:
            border-color 260ms ease,
            box-shadow 260ms ease;
        }

        .astra-login-stage.is-unlocking .astra-login-panel {
          border-color: rgba(160, 240, 252, 0.82);
          box-shadow:
            inset 0 0 0 1px rgba(103, 232, 249, 0.12),
            0 0 24px rgba(34, 211, 238, 0.12);
        }

        .astra-login-scan {
          position: absolute;
          left: 16px;
          right: 16px;
          top: 50%;
          z-index: 2;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.95), transparent);
          opacity: 0;
          pointer-events: none;
          transform: translateX(-105%);
        }

        .astra-login-stage.is-unlocking .astra-login-scan {
          animation: astra-login-scan 520ms ease 160ms both;
        }

        .astra-login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 4px;
          transition:
            opacity 350ms ease 180ms,
            transform 350ms ease 180ms;
        }

        .astra-login-stage.is-unlocking .astra-login-form {
          opacity: 0;
          transform: translateY(6px);
        }

        .astra-login-field {
          position: relative;
          display: block;
          width: 100%;
        }

        .astra-login-field > svg {
          position: absolute;
          left: 18px;
          top: 50%;
          width: 22px;
          height: 22px;
          color: rgba(151, 225, 244, 0.92);
          transform: translateY(-50%);
          pointer-events: none;
        }

        .astra-login-field input {
          width: 100%;
          height: 70px;
          border: 1px solid rgba(47, 165, 194, 0.68);
          border-radius: 8px;
          padding: 0 56px 0 62px;
          color: rgb(218, 242, 250);
          caret-color: rgb(103, 232, 249);
          background: rgba(1, 7, 18, 0.92);
          box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.025);
          font: inherit;
          font-size: 20px;
          outline: none;
          transition: 200ms ease;
        }

        .astra-login-field input::placeholder {
          color: rgba(145, 177, 195, 0.72);
        }

        .astra-login-field input:hover {
          border-color: rgba(91, 214, 237, 0.74);
          background: rgba(2, 10, 22, 0.95);
        }

        .astra-login-field input:focus {
          border-color: rgba(117, 228, 246, 0.82);
          background: rgba(2, 11, 23, 0.96);
          box-shadow:
            inset 0 0 18px rgba(6, 21, 35, 0.68),
            0 0 0 1px rgba(34, 211, 238, 0.2),
            0 0 20px rgba(34, 211, 238, 0.12);
        }

        .astra-password-toggle {
          position: absolute;
          top: 50%;
          right: 16px;
          display: grid;
          width: 36px;
          height: 36px;
          margin: 0;
          padding: 0;
          place-items: center;
          border: 0;
          color: rgba(151, 225, 244, 0.86);
          background: transparent;
          box-shadow: none;
          transform: translateY(-50%);
          cursor: pointer;
        }

        .astra-password-toggle svg {
          width: 1.2rem;
          height: 1.2rem;
        }

        .astra-login-message {
          min-height: 1rem;
          margin: 0;
          color: rgba(254, 205, 211, 0.95);
          font-size: 0.88rem;
          line-height: 1.35;
        }

        .astra-login-submit {
          height: 70px;
          margin-top: 4px;
          border: 1px solid rgba(91, 214, 237, 0.72);
          border-radius: 8px;
          color: white;
          background: rgba(1, 6, 17, 0.92);
          box-shadow:
            inset 0 0 18px rgba(8, 24, 42, 0.58),
            0 0 16px rgba(34, 211, 238, 0.1);
          font: inherit;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: 200ms ease;
        }

        .astra-login-submit:hover,
        .astra-login-submit:focus-visible {
          border-color: rgba(160, 240, 252, 0.86);
          background: rgba(3, 14, 28, 0.9);
          box-shadow:
            inset 0 0 20px rgba(8, 24, 42, 0.64),
            0 0 22px rgba(34, 211, 238, 0.16);
        }

        .astra-login-submit:disabled {
          cursor: wait;
          opacity: 0.72;
        }

        @keyframes astra-login-scan {
          0% {
            opacity: 0;
            transform: translateX(-105%);
          }

          18% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translateX(105%);
          }
        }

        @media (max-width: 760px) {
          .astra-login-split {
            grid-template-columns: 1fr;
          }

          .astra-login-right {
            min-height: 56vh;
          }

          .astra-login-brand {
            left: 16px;
            top: 18px;
            width: min(442px, calc(100vw - 32px));
            height: auto;
          }

          .astra-login-panel {
            position: fixed;
            right: 16px;
            bottom: 16px;
            left: 16px;
            width: auto;
            max-width: none;
            padding: 12px;
          }

          .astra-login-field input,
          .astra-login-submit {
            height: 56px;
            font-size: 0.92rem;
          }
        }
      `}</style>
    </main>
  );
}

function Router() {
  const [location] = useLocation();

  if (location === "/intel") {
    return <Intel />;
  }

  return (
    <div className="flex w-full h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 pl-20 relative">
        <Switch>
          <Route path="/" component={Chat} />
          <Route path="/media" component={MediaWall} />
          <Route path="/nodes" component={Nodes} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/settings" component={Settings} />
          <Route path="/autonomy" component={Autonomy} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        const data = await response.json().catch(() => ({}));
        if (!cancelled) {
          setAuthStatus(response.ok && data.authenticated ? "authenticated" : "unauthenticated");
        }
      } catch {
        if (!cancelled) {
          setAuthStatus("unauthenticated");
        }
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-black text-cyan-100 flex items-center justify-center">
        <span className="text-xs uppercase tracking-[0.28em] text-cyan-100/70">Loading Astra secure session...</span>
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <AstraLoginScreen
        onAuthenticated={() => {
          setAuthStatus("authenticated");
        }}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
