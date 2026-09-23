import { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
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
const NeuralCommandCenter = lazy(() => import("@/features/neural/NeuralCommandCenter"));

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
          <Route path="/neural">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground" role="status">Loading neural command center…</div>}>
              <NeuralCommandCenter />
            </Suspense>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
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
