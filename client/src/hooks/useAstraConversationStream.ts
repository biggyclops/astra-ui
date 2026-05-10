import { useEffect, useState } from "react";
import { conversationScript } from "@/config/astra";
import { conversationCore, type ConversationViewMessage } from "@/systems/conversation-core";

export function useAstraConversationStream() {
  const [index, setIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [loop, setLoop] = useState(0);

  const current = conversationScript[index];

  useEffect(() => {
    if (!current) {
      return;
    }

    let timer: number | undefined;

    if (visibleChars < current.content.length) {
      timer = window.setTimeout(() => {
        setVisibleChars((value) => Math.min(value + conversationCore.charsPerTick, current.content.length));
      }, conversationCore.tickMs);
    } else {
      timer = window.setTimeout(() => {
        if (index >= conversationScript.length - 1) {
          setLoop((value) => value + 1);
          setIndex(0);
          setVisibleChars(0);
          return;
        }

        setIndex((value) => value + 1);
        setVisibleChars(0);
      }, conversationCore.holdMs);
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [current, index, visibleChars]);

  const messages: ConversationViewMessage[] = conversationScript.map((message, messageIndex) => ({
    ...message,
    content:
      messageIndex < index
        ? message.content
        : messageIndex > index
          ? ""
          : message.content.slice(0, visibleChars),
  }));

  return {
    messages,
    phaseLabel: conversationCore.phaseLabel(index, loop),
    streamingLabel: conversationCore.streamingLabel(current, visibleChars),
  };
}
