import { motion } from "framer-motion";
import { ArrowUpRight, Command, WandSparkles } from "lucide-react";
import { useAstraConversationStream } from "@/hooks/useAstraConversationStream";
import { conversationCore } from "@/systems/conversation-core";
import { cn } from "@/lib/utils";

export function AstraConversationPanel() {
  const { messages, phaseLabel, streamingLabel } = useAstraConversationStream();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4 lg:px-8">
        <div>
          <p className="astra-kicker">Conversation core</p>
          <h2 className="astra-title text-[1.05rem] lg:text-[1.1rem]">{conversationCore.title}</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-2">
          <WandSparkles className="h-4 w-4 text-cyan-200/70" />
          <span className="astra-micro">{phaseLabel}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-7">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3.5 lg:gap-4">
          {messages.map((message, index) => (
            <motion.article
              key={message.id}
              className={cn(
                "astra-message-card group rounded-[1.35rem] border p-4 lg:p-5",
                message.role === "oracle"
                  ? "ml-auto border-cyan-200/12 bg-cyan-400/[0.045]"
                  : "border-white/6 bg-white/[0.022]",
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: index * 0.045 }}
              whileHover={{ y: -0.5 }}
            >
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="astra-kicker">{message.roleLabel}</p>
                  <p className="text-[11px] tracking-[0.18em] text-cyan-50/28">{message.timestamp}</p>
                </div>
                <div className="flex items-center gap-2 text-cyan-50/25">
                  {message.role === "oracle" ? <WandSparkles className="h-4 w-4 text-cyan-200/60" /> : <Command className="h-4 w-4 text-red-200/50" />}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-70" />
                </div>
              </div>

              <p className="astra-body max-w-[70ch] text-[15px] leading-7 text-cyan-50/80 lg:text-[15.5px]">{message.content}</p>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 px-5 py-4 lg:px-8">
        <div className="astra-input-bar flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <div>
            <p className="astra-kicker">Stream state</p>
            <p className="text-sm text-cyan-50/64">{streamingLabel}</p>
          </div>
          <div className="flex items-center gap-2 text-cyan-50/40">
            <span className="h-2 w-2 rounded-full bg-cyan-200/55 shadow-[0_0_10px_rgba(34,211,238,0.35)]" />
            <span className="astra-micro">awaiting next transmission</span>
          </div>
        </div>
      </div>
    </div>
  );
}
