import { motion } from "framer-motion";
import { CircleDashed, Sigma, Telescope, TimerReset } from "lucide-react";
import { getContextCards } from "@/config/astra";
import { useAstraShellStore } from "@/stores/astra-shell-store";
import { contextEngine } from "@/systems/context-engine";
import { telemetryLayer } from "@/systems/telemetry-layer";
import { getPresenceCards } from "@/config/astra";

const iconMap = {
  telescope: Telescope,
  sigma: Sigma,
  timer: TimerReset,
  orbit: CircleDashed,
} as const;

export function AstraContextPanel() {
  const selectedSectionId = useAstraShellStore((state) => state.selectedSectionId);
  const cards = getContextCards(selectedSectionId);
  const telemetry = telemetryLayer.snapshot();
  const presence = getPresenceCards();
  const context = contextEngine.resolve(selectedSectionId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 lg:p-5">
      <div className="border-b border-white/5 pb-4">
        <p className="astra-kicker">Context engine</p>
        <h2 className="astra-title text-xl">{context.title}</h2>
        <p className="mt-2 text-sm leading-6 text-cyan-50/60">{context.summary}</p>
      </div>

      <div className="grid gap-3">
        {cards.map((card, index) => {
          const Icon = iconMap[card.icon];

          return (
            <motion.div
              key={card.title}
              className="astra-panel-surface rounded-2xl border border-white/6 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -1 }}
            >
              <div className="mb-3 flex items-center gap-3">
                <Icon className="h-4 w-4 text-cyan-200/70" />
                <div>
                  <p className="astra-kicker">{card.title}</p>
                  <p className="text-xs text-cyan-50/40">{card.subtext}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-cyan-50/72">{card.body}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-3 border-t border-white/5 pt-4">
        {telemetry.map((item) => (
          <div key={item.label} className="astra-panel-slab justify-between">
            <span className="astra-micro">{item.label}</span>
            <span className="astra-micro text-cyan-100/80">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto grid gap-3 border-t border-white/5 pt-4">
        {presence.map((item) => (
          <div key={item.label} className="astra-panel-slab justify-between">
            <span className="astra-micro">{item.label}</span>
            <span className="astra-micro text-red-100/80">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
