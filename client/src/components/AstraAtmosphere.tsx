import { motion } from "framer-motion";
import { atmosphereField } from "@/systems/atmosphere-engine";

export function AstraAtmosphere() {
  const glyphs = atmosphereField.glyphs;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(32,112,160,0.12),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(170,47,39,0.1),transparent_28%),linear-gradient(180deg,rgba(4,7,16,1)_0%,rgba(5,9,18,0.96)_48%,rgba(2,4,10,1)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.025)_1px,transparent_1px)] bg-[size:84px_84px] opacity-14 mix-blend-screen" />
      <motion.div
        className="absolute -top-24 left-[12%] h-[24rem] w-[24rem] rounded-full bg-cyan-400/8 blur-3xl"
        animate={{ x: [0, 10, 0], y: [0, -8, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 28, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[8%] top-[10%] h-[20rem] w-[20rem] rounded-full bg-red-500/8 blur-3xl"
        animate={{ x: [0, -8, 0], y: [0, 8, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 32, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 opacity-22 mix-blend-screen">
        {glyphs.map((glyph) => (
          <motion.span
            key={glyph.id}
            className="astra-glyph absolute text-[11px] uppercase tracking-[0.48em] text-cyan-100/22"
            style={{
              left: glyph.left,
              top: glyph.top,
              opacity: glyph.opacity,
            }}
            animate={{
              y: [0, -6, 0],
              opacity: [glyph.opacity * 0.55, glyph.opacity * 0.8, glyph.opacity * 0.6],
            }}
            transition={{
              duration: glyph.duration + 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: glyph.delay,
            }}
          >
            {glyph.symbol}
          </motion.span>
        ))}
      </div>

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/18 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-200/12 to-transparent" />
    </div>
  );
}
