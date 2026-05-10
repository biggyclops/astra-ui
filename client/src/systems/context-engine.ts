import { getContextCards } from "@/config/astra";

export const contextEngine = {
  resolve(sectionId: string) {
    const cards = getContextCards(sectionId);

    return {
      title: sectionId === "oracle" ? "Primary inference" : "Context lens",
      summary:
        sectionId === "oracle"
          ? "The main chamber is tuned for streaming conversation, visual presence, and restrained cinematic atmosphere."
          : "The selected lens reframes Astra without changing the underlying identity or the shell architecture.",
      cards,
    };
  },
};
