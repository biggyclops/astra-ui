import { useNodes } from "@/hooks/use-astra";
import { motion } from "framer-motion";
import { Cpu, Server, Activity, Zap } from "lucide-react";

const MOCK_NODES = [
  { id: 1, name: 'Kratos-Alpha', type: 'Kratos', status: 'online', load: 45, temp: 62 },
  { id: 2, name: 'Kratos-Beta', type: 'Kratos', status: 'online', load: 78, temp: 75 },
  { id: 3, name: 'Hades-Core-01', type: 'Hades', status: 'degraded', load: 92, temp: 88 },
  { id: 4, name: 'Hermes-Relay', type: 'Hermes', status: 'online', load: 12, temp: 45 },
  { id: 5, name: 'Hermes-Bridge', type: 'Hermes', status: 'offline', load: 0, temp: 0 },
];

export default function Nodes() {
  const { data: nodes } = useNodes();
  const displayNodes = (nodes && nodes.length > 0) ? nodes : MOCK_NODES;

  return (
    <div className="min-h-screen bg-background p-8 pl-10 pt-20">
      <header className="mb-10">
        <h1 className="text-3xl font-display font-bold text-white mb-2">System Status</h1>
        <p className="text-muted-foreground">Real-time telemetry from distributed compute clusters.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayNodes.map((node: any, idx: number) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors"
          >
            {/* Background decoration */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${node.status === 'online' ? 'bg-primary/20 text-primary' : node.status === 'degraded' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{node.name}</h3>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">{node.type} Cluster</span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                 node.status === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                 node.status === 'degraded' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {node.status}
              </div>
            </div>

            <div className="space-y-4">
              {/* CPU Load */}
              <div>
                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                  <span>Compute Load</span>
                  <span>{node.load || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${node.load > 80 ? 'bg-orange-500' : 'bg-secondary'}`} 
                    style={{ width: `${node.load || 0}%` }}
                  />
                </div>
              </div>

               {/* Temp */}
               <div>
                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                  <span>Thermal Output</span>
                  <span>{node.temp || 0}°C</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-purple-500`} 
                    style={{ width: `${(node.temp || 0) / 1.2}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex gap-4 text-xs font-mono text-zinc-500">
               <div className="flex items-center gap-1">
                 <Activity className="w-3 h-3" /> 12ms
               </div>
               <div className="flex items-center gap-1">
                 <Zap className="w-3 h-3" /> 1.2kW
               </div>
               <div className="flex items-center gap-1">
                 <Cpu className="w-3 h-3" /> 64 Threads
               </div>
            </div>

          </motion.div>
        ))}
      </div>
    </div>
  );
}
