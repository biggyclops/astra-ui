import { getPresenceCards } from "@/config/astra";

export const presenceLayer = {
  tickMs: 1200,
  snapshot(pulse: number) {
    const cards = getPresenceCards();

    return {
      state: pulse % 2 === 0 ? "stable" : "listening",
      signature: pulse % 3 === 0 ? "Astra is listening" : "Talos host is calm",
      cards,
    };
  },
};
