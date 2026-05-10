import { motion } from "framer-motion";
import { useAstraPresence } from "@/hooks/useAstraPresence";

export function AstraPresenceLayer() {
  const presence = useAstraPresence();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]">
      <motion.div
        className="absolute right-6 top-6 rounded-full border border-cyan-200/10 bg-cyan-300/6 px-4 py-2 backdrop-blur-xl"
        animate={{ y: [0, -3, 0], opacity: [0.62, 0.9, 0.62] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <p className="astra-micro text-cyan-50/60">{presence.signature}</p>
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}
