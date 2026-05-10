import { motion } from "framer-motion";
import { AstraAtmosphere } from "@/components/AstraAtmosphere";
import { AstraConversationPanel } from "@/components/AstraConversationPanel";
import { AstraContextPanel } from "@/components/AstraContextPanel";
import { AstraPresenceLayer } from "@/components/AstraPresenceLayer";
import { AstraSidebar } from "@/components/AstraSidebar";

export function AstraShell() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AstraAtmosphere />
      <AstraPresenceLayer />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1720px] gap-5 p-4 md:p-5 lg:grid-cols-[250px_minmax(0,1.28fr)_300px] lg:gap-6 lg:p-6 xl:gap-7 xl:p-8">
        <motion.aside
          className="astra-panel astra-panel-deep min-h-[220px] overflow-hidden lg:min-h-0"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <AstraSidebar />
        </motion.aside>

        <motion.main
          className="astra-panel astra-panel-main min-h-[calc(100vh-2rem)] overflow-hidden lg:min-h-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
        >
          <AstraConversationPanel />
        </motion.main>

        <motion.aside
          className="astra-panel astra-panel-deep min-h-[220px] overflow-hidden lg:min-h-0"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}
        >
          <AstraContextPanel />
        </motion.aside>
      </div>
    </div>
  );
}
