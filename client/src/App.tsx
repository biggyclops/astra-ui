import { Switch, Route } from "wouter";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const Landing = lazy(() => import("@/pages/Landing"));
const Chat = lazy(() => import("@/pages/Chat"));
const MediaWall = lazy(() => import("@/pages/MediaWall"));
const Nodes = lazy(() => import("@/pages/Nodes"));
const Transmission = lazy(() => import("@/pages/Transmission"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const Files = lazy(() => import("@/pages/Files"));
const Settings = lazy(() => import("@/pages/Settings"));
const Sidebar = lazy(() => import("@/components/Sidebar").then((module) => ({ default: module.Sidebar })));
const CyberBackdrop = lazy(() => import("@/components/CyberBackdrop").then((module) => ({ default: module.CyberBackdrop })));

function ShellLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030816] text-cyan-100">
      <p className="astra-ui-label text-xs text-cyan-100/70">{label}</p>
    </div>
  );
}

function Router() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setIsAuthed(Boolean((data as { authenticated?: boolean }).authenticated));
      })
      .catch(() => {
        if (!cancelled) setIsAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string, remember: boolean) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, remember }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !(data as { authenticated?: boolean }).authenticated) {
      throw new Error((data as { message?: string }).message || "Login failed");
    }
    setIsAuthed(true);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setIsAuthed(false);
    }
  }, []);

  if (isAuthed === null) {
    return <ShellLoading label="Loading Astra secure session..." />;
  }

  if (!isAuthed) {
    return (
      <Suspense fallback={<ShellLoading label="Loading Astra login surface..." />}>
        <Landing onSignIn={signIn} onSsoSignIn={signIn} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ShellLoading label="Loading Astra command surface..." />}>
      <div className="relative flex min-h-screen w-full overflow-x-hidden bg-background text-foreground md:h-screen">
        <CyberBackdrop />
        <Sidebar onSignOut={signOut} />
        <main className="relative z-10 flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pb-20 md:pb-0 md:pl-20">
          <Switch>
            <Route path="/" component={Chat} />
            <Route path="/media" component={MediaWall} />
            <Route path="/nodes/transmission" component={Transmission} />
            <Route path="/nodes" component={Nodes} />
            <Route path="/jobs" component={Jobs} />
            <Route path="/files/*?" component={Files} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </Suspense>
  );
}

function App() {
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
