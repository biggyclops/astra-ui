import { motion } from "framer-motion";
import { ArrowUpRight, Command, WandSparkles } from "lucide-react";
import { useAstraConversationStream } from "@/hooks/useAstraConversationStream";
import { conversationCore } from "@/systems/conversation-core";
import { cn } from "@/lib/utils";

export function AstraConversationPanel() {
  const { messages, phaseLabel, streamingLabel } = useAstraConversationStream();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4 lg:px-7">
        <div>
          <p className="astra-kicker">Conversation core</p>
          <h2 className="astra-title text-xl">{conversationCore.title}</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
          <WandSparkles className="h-4 w-4 text-cyan-200/80" />
          <span className="astra-micro">{phaseLabel}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-7">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          {messages.map((message, index) => (
            <motion.article
              key={message.id}
              className={cn(
                "astra-message-card group rounded-[1.35rem] border p-4 lg:p-5",
                message.role === "oracle"
                  ? "ml-auto border-cyan-200/14 bg-cyan-400/[0.06]"
                  : "border-white/6 bg-white/[0.03]",
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -1 }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="astra-kicker">{message.roleLabel}</p>
                  <p className="text-xs text-cyan-50/35">{message.timestamp}</p>
                </div>
                <div className="flex items-center gap-2 text-cyan-50/35">
                  {message.role === "oracle" ? <WandSparkles className="h-4 w-4 text-cyan-200/70" /> : <Command className="h-4 w-4 text-red-200/60" />}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </div>
              </div>

              <p className="astra-body text-[15px] leading-7 text-cyan-50/84">{message.content}</p>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 px-5 py-4 lg:px-7">
        <div className="astra-input-bar flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
          <div>
            <p className="astra-kicker">Stream state</p>
            <p className="text-sm text-cyan-50/70">{streamingLabel}</p>
          </div>
          <div className="flex items-center gap-2 text-cyan-50/45">
            <span className="h-2 w-2 rounded-full bg-cyan-200/70 shadow-[0_0_14px_rgba(34,211,238,0.55)]" />
            <span className="astra-micro">awaiting next transmission</span>
          </div>
        </div>
      </div>
    </div>
  );
}
