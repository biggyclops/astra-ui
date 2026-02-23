import { Switch, Route } from "wouter";
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

function Router() {
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
