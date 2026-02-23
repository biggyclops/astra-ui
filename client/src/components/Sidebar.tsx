import { Link, useLocation } from "wouter";
import { MessageSquare, Image, Activity, Cpu, Settings, Disc } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { NodeStatusBadge } from "./NodeStatusBadge";

const navItems = [
  { icon: MessageSquare, label: "Chat", href: "/" },
  { icon: Image, label: "Media", href: "/media" },
  { icon: Activity, label: "Jobs", href: "/jobs" },
  { icon: Cpu, label: "Nodes", href: "/nodes" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-6 bg-background/50 backdrop-blur-md border-r border-white/5 z-50">
      <div className="mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Disc className="text-white w-6 h-6 animate-spin-slow" />
        </div>
      </div>

      <nav className="flex-1 w-full flex flex-col items-center gap-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 cursor-pointer",
                  isActive 
                    ? "bg-white/10 text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                
                {/* Tooltip-ish label on hover */}
                <div className="absolute left-14 px-2 py-1 bg-popover border border-white/10 rounded-md text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                  {item.label}
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4">
        <NodeStatusBadge />
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-orange-500 p-[2px]">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
             <div className="text-xs font-bold text-accent">AI</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
