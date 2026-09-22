import AstraBrainCore from "@/components/AstraBrainCore";

export default function AstraBrainLab() {
  return (
    <div className="fixed inset-0 bg-[#05070f] overflow-hidden">
      {/* Top command bar */}
      <div className="absolute top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#05070f]/95 backdrop-blur">
        <div className="flex items-center justify-between px-8 h-14">
          <div className="flex items-center gap-4">
            <div className="font-mono text-xs tracking-[4px] text-cyan-400/70">ASTRA NEURAL CORE</div>
            <div className="h-px w-8 bg-white/20" />
            <div className="font-mono text-[10px] text-amber-400/60 tracking-widest">BRAIN LAB • PREVIEW</div>
          </div>
          <div className="font-mono text-[10px] text-white/30 tracking-[2px]">
            INTERACTIVE PROTOTYPE • LIVE WIRING PENDING
          </div>
        </div>
      </div>

      {/* Full-screen brain visualization */}
      <div className="absolute inset-0 pt-14">
        <AstraBrainCore />
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#05070f]/95 backdrop-blur">
        <div className="flex items-center justify-between px-8 h-9 text-[10px] font-mono text-white/25 tracking-widest">
          <div>DRAG • SCROLL • CLICK NODES</div>
          <div>NO LIVE TELEMETRY • SIMULATED GRAPH</div>
          <div>ESC TO EXIT (DEV ONLY)</div>
        </div>
      </div>
    </div>
  );
}
