import { useEffect, useState } from "react";
import { presenceLayer } from "@/systems/presence-layer";

export function useAstraPresence() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulse((value) => (value + 1) % 8);
    }, presenceLayer.tickMs);

    return () => window.clearInterval(timer);
  }, []);

  return presenceLayer.snapshot(pulse);
}
