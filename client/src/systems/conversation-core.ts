import { conversationScript } from "@/config/astra";
import type { ConversationViewMessage } from "@/types/astra";

export const conversationCore = {
  title: "Oracle chamber",
  tickMs: 24,
  charsPerTick: 2,
  holdMs: 1100,
  phaseLabel(index: number, loop: number) {
    const phase = conversationScript[index]?.roleLabel ?? "oracle";
    return `phase ${loop + 1} · ${phase}`;
  },
  streamingLabel(current: ConversationViewMessage | undefined, visibleChars: number) {
    if (!current) {
      return "warming conversation surface";
    }

    if (visibleChars < current.content.length) {
      return `streaming ${visibleChars}/${current.content.length} glyphs`;
    }

    return "message held in orbit";
  },
};

export type { ConversationViewMessage };
