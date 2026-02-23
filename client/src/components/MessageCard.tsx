import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Clock, Terminal, Image as ImageIcon, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

type MessageCardProps = {
  type: string;
  metadata: any;
};

export function MessageCard({ type, metadata }: MessageCardProps) {
  if (type === "node_status") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 w-full max-w-md bg-card/50 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">System Node Status</h4>
            <p className="text-xs text-muted-foreground">Real-time cluster health</p>
          </div>
        </div>
        <div className="space-y-2">
          {metadata?.nodes?.map((node: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-white/5">
              <span className="text-sm font-mono text-zinc-300">{node.name}</span>
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", 
                  node.status === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"
                )} />
                <span className="text-xs font-medium uppercase tracking-wider">{node.status}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (type === "job") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 w-full max-w-lg bg-card/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            <span className="font-mono text-sm font-semibold text-accent">{metadata?.jobName || "Job Execution"}</span>
          </div>
          <span className={cn(
            "px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border",
            metadata?.status === 'completed' ? "bg-green-500/20 text-green-400 border-green-500/30" : 
            metadata?.status === 'failed' ? "bg-destructive/20 text-destructive border-destructive/30" :
            "bg-blue-500/20 text-blue-400 border-blue-500/30"
          )}>
            {metadata?.status}
          </span>
        </div>
        <div className="p-4 bg-black/40 font-mono text-xs text-zinc-400 max-h-32 overflow-y-auto">
          {metadata?.logs?.map((log: string, i: number) => (
            <div key={i} className="mb-1 border-l-2 border-white/10 pl-2 hover:border-accent/50 transition-colors">
              <span className="text-zinc-600 mr-2">{new Date().toLocaleTimeString()}</span>
              {log}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (type === "media_preview") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 grid grid-cols-2 gap-2 max-w-md"
      >
        {metadata?.items?.map((item: any, i: number) => (
          <div key={i} className="group relative aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-all cursor-pointer">
            {/* Using placeholders for demo if no URL */}
            <img 
              src={item.url || `https://images.unsplash.com/photo-1614728853913-1e221165d642?w=400&h=300&fit=crop`} 
              alt="Media preview" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            {/* Scenic space nebula abstract */}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <span className="text-xs font-medium text-white truncate w-full">{item.title}</span>
            </div>
            {item.type === 'video' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5" />
              </div>
            )}
          </div>
        ))}
      </motion.div>
    );
  }

  return null;
}
