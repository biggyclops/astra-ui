import { motion } from "framer-motion";
import { useAstraPresence } from "@/hooks/useAstraPresence";

export function AstraPresenceLayer() {
  const presence = useAstraPresence();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]">
      <motion.div
        className="absolute right-6 top-6 rounded-full border border-cyan-200/8 bg-cyan-300/[0.035] px-4 py-2 backdrop-blur-xl"
        animate={{ y: [0, -2, 0], opacity: [0.45, 0.72, 0.45] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <p className="astra-micro text-cyan-50/48">{presence.signature}</p>
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/24 to-transparent" />
    </div>
  );
}
