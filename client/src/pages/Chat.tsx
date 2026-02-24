import { useState, useRef, useEffect } from "react";
import { useMessages, useSendMessage, useNodes, useJobs } from "@/hooks/use-astra";
import { MessageCard } from "@/components/MessageCard";
import { Send, Paperclip, Mic, Bot, User, Sparkles, Command, X, RefreshCw, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { data: messages, isLoading, live, setLive, refresh } = useMessages(2000);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const data = e.dataTransfer.getData("application/x-astra-media");
    if (data) {
      try {
        const payload = JSON.parse(data);
        if (payload.items) {
          setAttachments(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newItems = payload.items
              .filter((item: any) => !existingIds.has(item.id))
              .map((item: any) => ({
                id: item.id,
                type: item.type,
                url: item.url,
                thumb_url: item.thumb_url
              }));
            return [...prev, ...newItems];
          });
        }
      } catch (err) {
        console.error("Failed to parse drop data", err);
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    sendMessage({ 
      role: 'user', 
      content: inputValue || (attachments.length > 0 ? `Sent ${attachments.length} attachment(s)` : ""), 
      type: 'text',
      metadata: attachments.length > 0 ? { attachments } : undefined
    });

    setInputValue("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-16 border-b border-white/5 bg-background/80 backdrop-blur-md z-10 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h1 className="text-xl font-bold font-display tracking-tight text-gradient">Astra Console</h1>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <button
            data-testid="btn-live-toggle"
            onClick={() => setLive(l => !l)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors",
              live
                ? "bg-green-500/15 text-green-400 border-green-500/30"
                : "bg-white/5 text-muted-foreground border-white/10"
            )}
          >
            <Radio className={cn("w-3 h-3", live && "animate-pulse")} />
            {live ? "LIVE" : "PAUSED"}
          </button>
          <button
            data-testid="btn-refresh-messages"
            onClick={refresh}
            className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <div className="px-2 py-1 rounded bg-white/5 border border-white/5">v2.4.0</div>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-20 pb-28 px-4 md:px-20 lg:px-64 scroll-smooth"
      >
        <div className="flex flex-col gap-6 py-6">
          {isLoading ? (
             <div className="flex flex-col gap-4 items-center justify-center mt-20 opacity-50">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-mono text-sm">Initializing uplink...</p>
             </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-40 gap-6 opacity-80">
              <div className="w-20 h-20 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center border border-white/5 backdrop-blur-sm">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Welcome to Astra</h2>
                <p className="text-muted-foreground max-w-sm">
                  Ready for commands. Try <code className="bg-white/10 px-1 py-0.5 rounded text-primary">/nodes</code> or <code className="bg-white/10 px-1 py-0.5 rounded text-secondary">/media</code>
                </p>
              </div>
            </div>
          ) : (
            messages?.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-4 w-full max-w-3xl",
                  msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg border border-white/5",
                  msg.role === 'user' ? "bg-zinc-800" : "bg-gradient-to-br from-primary to-purple-600"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Bot className="w-4 h-4 text-white" />}
                </div>

                {/* Content */}
                <div className={cn(
                  "flex flex-col gap-1 min-w-0",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-full break-words",
                    msg.role === 'user' 
                      ? "bg-zinc-800/80 text-zinc-100 rounded-tr-sm border border-white/5" 
                      : "bg-transparent text-zinc-100 px-0 py-0" // Assistant messages blend into background more
                  )}>
                    {msg.role === 'assistant' && msg.type === 'text' && (
                       <div className="bg-card/40 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm backdrop-blur-sm">
                         {msg.content}
                       </div>
                    )}
                    
                    {msg.role === 'user' && (
                      <div className="space-y-2">
                        <div>{msg.content}</div>
                        {msg.metadata?.attachments && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.metadata.attachments.map((at: any) => (
                              <div key={at.id} className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-lg pr-3">
                                <div className="w-8 h-8 rounded bg-zinc-700 overflow-hidden flex-shrink-0">
                                  {at.thumb_url ? <img src={at.thumb_url} className="w-full h-full object-cover" /> : <Bot className="w-4 h-4 m-2 text-primary" />}
                                </div>
                                <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[100px]">{at.id}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Render specialized card if needed */}
                    {msg.role === 'assistant' && msg.type !== 'text' && (
                      <div className="space-y-2">
                        {msg.content && <p className="text-muted-foreground text-xs ml-1 mb-1">{msg.content}</p>}
                        <MessageCard type={msg.type} metadata={msg.metadata} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono px-1 opacity-50">
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-background via-background to-transparent pt-20">
        <div className="max-w-3xl mx-auto relative group">
          <div className={cn(
            "absolute -inset-0.5 rounded-2xl blur transition duration-500",
            isDragging ? "bg-gradient-to-r from-primary via-secondary to-accent opacity-100 scale-[1.02]" : "bg-gradient-to-r from-primary via-secondary to-accent opacity-20 group-focus-within:opacity-100"
          )}></div>
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative bg-card rounded-2xl flex flex-col p-2 shadow-2xl border transition-all duration-300",
              isDragging ? "border-primary border-2 scale-[1.01] bg-primary/5" : "border-white/10",
              attachments.length > 0 && "pb-3"
            )}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-2xl pointer-events-none">
                <div className="flex items-center gap-2 text-primary font-bold animate-bounce">
                  <Paperclip className="w-5 h-5" />
                  <span>Drop to attach</span>
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 py-2 mb-1">
                <AnimatePresence>
                  {attachments.map(at => (
                    <motion.div 
                      key={at.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-lg pr-2 group/at"
                    >
                      <div className="w-6 h-6 rounded bg-zinc-700 overflow-hidden">
                        {at.thumb_url ? <img src={at.thumb_url} className="w-full h-full object-cover" /> : <Bot className="w-3 h-3 m-1.5 text-primary" />}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[80px]">{at.id}</span>
                      <button 
                        onClick={() => removeAttachment(at.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-end">
              <button className="p-3 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Astra... (Try /nodes, /media, /jobs)"
                className="flex-1 bg-transparent border-0 focus:ring-0 text-foreground placeholder:text-muted-foreground resize-none py-3.5 px-2 max-h-32 min-h-[52px]"
                rows={1}
              />

              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && attachments.length === 0) || isPending}
                  className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Helper hint */}
          <div className="absolute -top-8 left-0 text-xs text-muted-foreground font-mono opacity-0 group-focus-within:opacity-100 transition-opacity flex items-center gap-2">
            <Command className="w-3 h-3" />
            <span>Cmd + Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
