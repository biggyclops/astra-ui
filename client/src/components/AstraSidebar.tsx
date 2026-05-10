import { motion } from "framer-motion";
import { ChevronRight, Orbit, Radar, Sparkles } from "lucide-react";
import { getSidebarSections } from "@/config/astra";
import { useAstraShellStore } from "@/stores/astra-shell-store";
import { useAstraPresence } from "@/hooks/useAstraPresence";
import { cn } from "@/lib/utils";

export function AstraSidebar() {
  const sections = getSidebarSections();
  const { selectedSectionId, setSelectedSectionId } = useAstraShellStore();
  const presence = useAstraPresence();

  return (
    <div className="flex h-full flex-col gap-4 p-3 lg:p-4">
      <div className="space-y-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="astra-orb h-10 w-10 rounded-[1rem] border border-cyan-200/18 bg-cyan-300/8 shadow-[0_0_24px_rgba(45,212,191,0.1)]" />
          <div>
            <p className="astra-kicker">Talos host</p>
            <h1 className="astra-title text-[0.95rem]">Astra</h1>
          </div>
        </div>
        <p className="astra-copy text-[0.92rem] leading-6 text-cyan-50/54">
          Mythic interface layer. Observing, translating, and sequencing the signal.
        </p>

        <div className="flex items-center gap-2 rounded-full border border-emerald-400/12 bg-emerald-400/[0.04] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.45)]" />
          <span className="astra-micro text-[10px] text-emerald-200/70">presence {presence.state}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {sections.map((section, index) => {
          const active = selectedSectionId === section.id;

          return (
            <motion.button
              key={section.id}
              className={cn(
                "astra-nav-item group w-full rounded-[1.15rem] border px-3.5 py-3 text-left transition",
                active
                  ? "border-cyan-200/18 bg-cyan-300/[0.065] shadow-[0_0_24px_rgba(34,211,238,0.06)]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/8 hover:bg-white/[0.035]",
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
              whileHover={{ y: -0.5 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedSectionId(section.id)}
            >
              <div className="flex items-start gap-3">
                <section.icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-cyan-200" : "text-cyan-50/35")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="astra-kicker text-[10px]">{section.label}</span>
                    <ChevronRight className={cn("h-3.5 w-3.5 transition", active ? "translate-x-0 text-cyan-200/80" : "text-cyan-50/15 group-hover:translate-x-0.5 group-hover:text-cyan-100/35")} />
                  </div>
                  <p className="mt-1 text-[0.9rem] leading-6 text-cyan-50/64">{section.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5 border-t border-white/5 pt-4">
        <div className="astra-panel-slab">
          <Radar className="h-4 w-4 text-cyan-200/60" />
          <span className="astra-micro">signal stable</span>
        </div>
        <div className="astra-panel-slab">
          <Sparkles className="h-4 w-4 text-red-200/60" />
          <span className="astra-micro">glyph field live</span>
        </div>
        <div className="astra-panel-slab col-span-2">
          <Orbit className="h-4 w-4 text-cyan-200/60" />
          <span className="astra-micro">desktop-first chamber</span>
        </div>
      </div>
    </div>
  );
}
