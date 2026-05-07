import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useJobs, useMessages, useSendMessage, useNodeStatus } from "@/hooks/use-astra";
import { MessageCard } from "@/components/MessageCard";
import { AstraPresence } from "@/components/AstraPresence";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Mic, Bot, User, Sparkles, X, RefreshCw, Radio, Volume2, Activity, Radar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { readOpsToken } from "@/lib/ops-token";
import { useAstraPresenceSource } from "@/hooks/use-astra-presence";

const VOICE_MAX_SECONDS = 15;
const VOICE_STT_PATH = "/api/voice/stt";
const VOICE_TTS_PATH = "/api/voice/tts";

export default function Chat() {
  const { data: messages, isLoading, live, setLive, refresh } = useMessages(2000);
  const { data: nodeData, refetch: refreshNodes, error: nodeError } = useNodeStatus();
  const { data: jobsData } = useJobs();
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { toast } = useToast();
  const VOICE_TOKEN_KEY = "astra_voice_token";
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [autoSendAfterStt, setAutoSendAfterStt] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpokenMessageIdRef = useRef<number | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const clearRecordingResources = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  }, []);

  const stopTtsPlayback = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
    }
    if (activeAudioUrlRef.current) {
      URL.revokeObjectURL(activeAudioUrlRef.current);
      activeAudioUrlRef.current = null;
    }
    setIsTtsPlaying(false);
  }, []);

  const cleanupSession = useCallback(() => {
    clearRecordingResources();
    lastSpokenMessageIdRef.current = null;
    stopTtsPlayback();
  }, [clearRecordingResources, stopTtsPlayback]);

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

  useEffect(() => cleanupSession, [cleanupSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed && attachments.length === 0) return;

    sendMessage({
      role: "user",
      content: trimmed || (attachments.length > 0 ? `Sent ${attachments.length} attachment(s)` : ""),
      type: "text",
      metadata: attachments.length > 0 ? { attachments } : undefined,
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

  const getOpsToken = useCallback(() => readOpsToken(), []);
  const getVoiceToken = useCallback(() => (typeof localStorage !== "undefined" ? localStorage.getItem(VOICE_TOKEN_KEY) ?? "" : "").trim(), []);
  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);
      const start = Date.now();
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setRecordingSeconds(Math.min(elapsed, VOICE_MAX_SECONDS));
        if (elapsed >= VOICE_MAX_SECONDS) stopRecording();
      }, 200);
    } catch (err) {
      toast({ title: "Microphone access denied", description: err instanceof Error ? err.message : "Could not start recording", variant: "destructive" });
    }
  }, [isRecording, isTranscribing, toast]);

  const stopRecording = useCallback(() => {
    clearRecordingTimer();
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state === "inactive") {
      return;
    }
    rec.stop();
    mediaRecorderRef.current = null;
    const chunks = audioChunksRef.current;
    if (chunks.length === 0) return;
    const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
    const token = getOpsToken();
    if (!token) {
      toast({ title: "Voice requires ops token", description: "Set x-astra-ops-token in Settings.", variant: "destructive" });
      return;
    }
    setIsTranscribing(true);
    const form = new FormData();
    form.append("audio", blob, "audio.webm");
    fetch(VOICE_STT_PATH, { method: "POST", headers: { "x-astra-ops-token": token }, body: form })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg = (data as { message?: string }).message ?? (data as { error?: string }).error ?? `HTTP ${r.status}`;
          toast({ title: "Transcription failed", description: msg, variant: "destructive" });
          return;
        }
        const text = (data as { text?: string }).text ?? "";
        if (text) {
          setInputValue((prev) => (prev ? `${prev} ${text}` : text));
          if (autoSendAfterStt) {
            sendMessage({ role: "user", content: text.trim(), type: "text" });
            setInputValue("");
          }
        }
      })
      .finally(() => setIsTranscribing(false));
  }, [clearRecordingTimer, getOpsToken, autoSendAfterStt, toast, sendMessage]);

  const cancelRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    clearRecordingResources();
  }, [clearRecordingResources]);

  const buildTtsHeaders = useCallback((): Record<string, string> => {
    const ops = getOpsToken();
    const voice = getVoiceToken();
    const h: Record<string, string> = { "Content-Type": "application/json", "x-astra-ops-token": ops };
    if (voice) h["x-astra-voice-token"] = voice;
    return h;
  }, [getOpsToken, getVoiceToken]);

  useEffect(() => {
    if (!messages?.length || !speakReplies) return;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || last.type !== "text" || !last.content) return;
    if (lastSpokenMessageIdRef.current === last.id) return;
    let cancelled = false;
    const token = getOpsToken();
    if (!token) return;
    lastSpokenMessageIdRef.current = last.id;
    fetch(VOICE_TTS_PATH, {
      method: "POST",
      headers: buildTtsHeaders(),
      body: JSON.stringify({ text: last.content }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          toast({ title: "TTS failed", description: (data as { message?: string }).message ?? `HTTP ${r.status}`, variant: "destructive" });
          return;
        }
        const ct = (r.headers.get("content-type") ?? "").toLowerCase();
        if (ct.includes("application/json")) {
          const data = await r.json().catch(() => ({}));
          toast({ title: "TTS failed", description: (data as { message?: string }).message ?? "Server returned JSON instead of audio", variant: "destructive" });
          return;
        }
        const blob = await r.blob();
        if (cancelled) return;
        stopTtsPlayback();
        const url = URL.createObjectURL(blob);
        activeAudioUrlRef.current = url;
        const audio = new Audio(url);
        activeAudioRef.current = audio;
        audio.onended = () => {
          if (activeAudioUrlRef.current === url) activeAudioUrlRef.current = null;
          if (activeAudioRef.current === audio) activeAudioRef.current = null;
          URL.revokeObjectURL(url);
          setIsTtsPlaying(false);
        };
        audio.onerror = () => {
          if (activeAudioUrlRef.current === url) activeAudioUrlRef.current = null;
          if (activeAudioRef.current === audio) activeAudioRef.current = null;
          URL.revokeObjectURL(url);
          setIsTtsPlaying(false);
        };
        setIsTtsPlaying(true);
        try {
          await audio.play();
        } catch {
          stopTtsPlayback();
        }
      })
      .catch(() => {
        lastSpokenMessageIdRef.current = null;
        stopTtsPlayback();
      });

    return () => {
      cancelled = true;
    };
  }, [messages, speakReplies, getOpsToken, buildTtsHeaders, stopTtsPlayback, toast]);

  const handleSpeakLastReply = useCallback(async () => {
    setTtsError(null);
    const last = messages?.length ? messages[messages.length - 1] : null;
    if (!last || last.role !== "assistant" || last.type !== "text" || !last.content) {
      setTtsError("No assistant reply to speak.");
      return;
    }
    const opsToken = getOpsToken();
    if (!opsToken) {
      setTtsError("Set ops token in Settings (astra_ops_token).");
      return;
    }
    setIsTtsPlaying(true);
    try {
    const r = await fetch(VOICE_TTS_PATH, {
        method: "POST",
        headers: buildTtsHeaders(),
        body: JSON.stringify({ text: last.content }),
      });
      const ct = (r.headers.get("content-type") ?? "").toLowerCase();
      if (ct.includes("application/json")) {
        const data = await r.json().catch(() => ({}));
        const msg = (data as { message?: string }).message ?? (data as { error?: string }).error ?? `HTTP ${r.status}`;
        setTtsError(msg);
        return;
      }
      if (!r.ok) {
        setTtsError(`TTS failed: HTTP ${r.status}`);
        return;
      }
      const blob = await r.blob();
      stopTtsPlayback();
      const url = URL.createObjectURL(blob);
      activeAudioUrlRef.current = url;
      const audio = new Audio(url);
      activeAudioRef.current = audio;
      audio.onended = () => {
        if (activeAudioUrlRef.current === url) activeAudioUrlRef.current = null;
        if (activeAudioRef.current === audio) activeAudioRef.current = null;
        URL.revokeObjectURL(url);
        setIsTtsPlaying(false);
      };
      audio.onerror = () => {
        if (activeAudioUrlRef.current === url) activeAudioUrlRef.current = null;
        if (activeAudioRef.current === audio) activeAudioRef.current = null;
        URL.revokeObjectURL(url);
        setIsTtsPlaying(false);
      };
      try {
        await audio.play();
      } catch {
        stopTtsPlayback();
      }
    } catch (e) {
      setTtsError(e instanceof Error ? e.message : "TTS request failed");
      stopTtsPlayback();
    }
  }, [messages, getOpsToken, buildTtsHeaders, stopTtsPlayback]);

  const nodes = nodeData?.nodes ?? [];
  const jobs = (jobsData || []) as Array<{ status?: string; type?: string; node?: string; title?: string }>;
  const onlineCount = nodes.filter((n) => n.status === "online").length;
  const totalNodes = nodes.length;
  const recentMessages = messages?.slice(-7) ?? [];
  const presenceSignals = useMemo(
    () => ({
      voiceActive: isRecording || isTranscribing,
      gpuActive:
        nodes.some((node) => (node.gpuUtil ?? 0) >= 20 || (node.vramUsed != null && node.vramTotal != null)) ||
        jobs.some((job) => job.status === "running" && /^comfyui\./.test(job.type ?? "")),
      securityAlert: Boolean(nodeError) || nodes.some((node) => node.status === "offline" || Boolean(node.reason)),
      roboticsActive:
        jobs.some(
          (job) =>
            job.status === "running" &&
            /phobos|cyberus|robot|servo|arm/i.test(`${job.node ?? ""} ${job.type ?? ""} ${job.title ?? ""}`)
        ) ||
        nodes.some((node) => /phobos|cyberus/i.test(`${node.name} ${node.type}`)),
      intensityScale: isDesktop ? 1 : 0.86,
    }),
    [isRecording, isTranscribing, nodeError, nodes, jobs, isDesktop]
  );
  useAstraPresenceSource("chat", presenceSignals);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(217,70,239,0.08),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_30%)]" />
      <AstraPresence
        variant="dashboard"
        signals={presenceSignals}
        className="hidden xl:block"
      />

      <header className="relative z-10 sticky top-0 border-b border-cyan-300/10 bg-[rgba(3,8,22,0.72)] backdrop-blur-2xl">
        <div className="flex flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-slate-950/80 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
            <div>
              <p className="astra-ui-label text-[0.68rem] text-cyan-100/50">Astra Command Center</p>
              <h1 className="astra-logo text-lg text-white">ASTRA</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-100/55">
            <button
              data-testid="btn-live-toggle"
              onClick={() => setLive((l) => !l)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
                live ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"
              )}
            >
              <Radio className={cn("h-3 w-3", live && "animate-pulse")} />
              {live ? "LIVE" : "PAUSED"}
            </button>
            <button
              data-testid="btn-refresh-messages"
              onClick={() => {
                refresh();
                refreshNodes();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 transition-colors hover:border-cyan-300/20 hover:bg-cyan-300/8 hover:text-cyan-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync
            </button>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              {onlineCount}/{totalNodes || 4} nodes
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 grid gap-4 px-4 pb-28 pt-4 lg:px-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(340px,0.8fr)] md:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          drag={isDesktop}
          dragConstraints={isDesktop ? { left: -12, right: 12, top: -8, bottom: 8 } : undefined}
          dragElastic={0.08}
          dragMomentum={false}
          className="overflow-hidden rounded-lg border border-cyan-300/12 bg-[rgba(4,10,24,0.68)] shadow-[0_0_60px_rgba(34,211,238,0.08)] lg:cursor-grab lg:active:cursor-grabbing backdrop-blur-2xl"
          style={{ touchAction: isDesktop ? "none" : "pan-y" }}
        >
          <div className="border-b border-cyan-300/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="astra-ui-label text-[0.65rem] text-cyan-100/50">Command feed</p>
                <h2 className="astra-heading mt-1 text-sm text-cyan-50">System telemetry and AI traffic</h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-cyan-100/45">
                <Activity className="h-3.5 w-3.5 text-cyan-300" />
                <span className="astra-ui-label text-[11px] text-cyan-100/45">{isLoading ? "Indexing" : "Streaming"}</span>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="max-h-[58vh] overflow-y-auto px-4 py-4 md:max-h-[60vh]">
            {isLoading ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-cyan-100/60">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
                <p className="astra-ui-label text-xs">Initializing uplink</p>
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/15 bg-cyan-300/8 shadow-[0_0_35px_rgba(34,211,238,0.14)]">
                  <Bot className="h-9 w-9 text-cyan-200" />
                </div>
                <div className="space-y-2">
                  <h3 className="astra-heading text-xl text-white">Welcome to Astra</h3>
                  <p className="max-w-sm text-sm leading-6 text-cyan-50/65">
                    The command center is online. Send a prompt, open a node view, or push a system command.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role !== "user" && (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/8 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div className={cn("max-w-[85%] space-y-1", msg.role === "user" && "items-end text-right")}>
                      <div
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-sm leading-6 shadow-[0_0_24px_rgba(0,0,0,0.18)]",
                          msg.role === "user"
                            ? "border-cyan-300/15 bg-slate-950/65 text-cyan-50"
                            : "border-white/5 bg-white/[0.03] text-white"
                        )}
                      >
                        {msg.role === "assistant" && msg.type === "text" ? (
                          <div>{msg.content}</div>
                        ) : msg.role === "assistant" ? (
                          <div className="space-y-2">
                            {msg.content && <p className="astra-terminal-text text-cyan-100/60">{msg.content}</p>}
                            <MessageCard type={msg.type} metadata={msg.metadata} />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>{msg.content}</div>
                            {msg.metadata?.attachments && (
                              <div className="flex flex-wrap gap-2">
                                {msg.metadata.attachments.map((at: any) => (
                                  <div key={at.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] pr-3">
                                    <div className="h-8 w-8 overflow-hidden rounded-lg bg-slate-800">
                                      {at.thumb_url ? <img src={at.thumb_url} className="h-full w-full object-cover" /> : <Bot className="m-2 h-4 w-4 text-cyan-200" />}
                                    </div>
                                    <span className="max-w-[120px] truncate astra-terminal-text text-slate-300">{at.id}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="px-1 astra-terminal-text text-cyan-100/30">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/15 bg-white/[0.04] text-cyan-100">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          drag={isDesktop}
          dragConstraints={isDesktop ? { left: -12, right: 12, top: -8, bottom: 8 } : undefined}
          dragElastic={0.08}
          dragMomentum={false}
          className="overflow-hidden rounded-lg border border-cyan-300/12 bg-[rgba(4,10,24,0.68)] shadow-[0_0_60px_rgba(34,211,238,0.08)] lg:cursor-grab lg:active:cursor-grabbing backdrop-blur-2xl"
          style={{ touchAction: isDesktop ? "none" : "pan-y" }}
        >
          <div className="border-b border-cyan-300/10 px-4 py-3">
            <p className="astra-ui-label text-[0.65rem] text-cyan-100/50">Node map</p>
            <h2 className="astra-heading mt-1 text-sm text-cyan-50">Live mesh and system body</h2>
          </div>
          <div className="space-y-4 p-4">
            <div className="relative flex h-64 items-center justify-center rounded-lg border border-cyan-300/10 bg-slate-950/55">
              <div className="absolute inset-8 rounded-full border border-cyan-300/10" />
              <div className="absolute inset-16 rounded-full border border-cyan-300/15" />
              <div className="absolute inset-24 rounded-full border border-cyan-300/10" />
              <div className="absolute h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.9)]" />
              {nodes.map((node, index) => {
                const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * 88;
                const y = Math.sin(angle) * 88;
                return (
                  <motion.div
                    key={node.name}
                    className="absolute"
                    animate={{ x: [x, x + Math.sin(index) * 4, x], y: [y, y + Math.cos(index) * 4, y] }}
                    transition={{ duration: 8 + index, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]",
                      node.status === "online" ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : node.status === "offline" ? "border-red-400/20 bg-red-500/10 text-red-100" : "border-yellow-400/20 bg-yellow-500/10 text-yellow-50"
                    )}>
                      <span className={cn("h-2 w-2 rounded-full", node.status === "online" ? "bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" : node.status === "offline" ? "bg-red-400" : "bg-yellow-300")} />
                      {node.name}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-cyan-300/10 bg-white/[0.03] p-3">
                <p className="astra-ui-label text-[0.65rem] text-cyan-100/45">Mesh health</p>
                <p className="mt-2 text-2xl font-semibold text-white">{onlineCount}/{totalNodes || 4}</p>
                <p className="astra-ui-label text-xs text-cyan-100/55">Nodes online</p>
              </div>
              <div className="rounded-lg border border-cyan-300/10 bg-white/[0.03] p-3">
                <p className="astra-ui-label text-[0.65rem] text-cyan-100/45">Signal</p>
                <p className="mt-2 text-2xl font-semibold text-white">{live ? "Stable" : "Paused"}</p>
                <p className="astra-ui-label text-xs text-cyan-100/55">Telemetry stream</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          drag={isDesktop}
          dragConstraints={isDesktop ? { left: -12, right: 12, top: -8, bottom: 8 } : undefined}
          dragElastic={0.08}
          dragMomentum={false}
          className="overflow-hidden rounded-lg border border-cyan-300/12 bg-[rgba(4,10,24,0.68)] shadow-[0_0_60px_rgba(34,211,238,0.08)] lg:cursor-grab lg:active:cursor-grabbing backdrop-blur-2xl md:col-span-2 xl:col-span-1"
          style={{ touchAction: isDesktop ? "none" : "pan-y" }}
        >
          <div className="border-b border-cyan-300/10 px-4 py-3">
            <p className="astra-ui-label text-[0.65rem] text-cyan-100/50">Telemetry</p>
            <h2 className="astra-heading mt-1 text-sm text-cyan-50">Command deck and voice layer</h2>
          </div>
          <div className="space-y-4 p-4">
            <div className="grid gap-3">
              <div className="rounded-lg border border-cyan-300/10 bg-slate-950/55 p-3">
                <div className="flex items-center justify-between text-xs text-cyan-100/45">
                  <span className="astra-ui-label text-xs">Message stream</span>
                  <span className="astra-terminal-text text-cyan-100/45">{messages?.length ?? 0} entries</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-2 rounded-full bg-cyan-300/15">
                    <div className="h-2 w-[76%] rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500" />
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div className="h-2 w-[42%] rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-cyan-300/10 bg-white/[0.03] p-3">
                  <p className="astra-ui-label text-[0.65rem] text-cyan-100/45">Live</p>
                  <p className="mt-2 text-lg font-semibold text-white">{live ? "On" : "Off"}</p>
                </div>
                <div className="rounded-lg border border-cyan-300/10 bg-white/[0.03] p-3">
                  <p className="astra-ui-label text-[0.65rem] text-cyan-100/45">Nodes</p>
                  <p className="mt-2 text-lg font-semibold text-white">{nodeData?.checkedAt ? "Fresh" : "Idle"}</p>
                </div>
              </div>

              <div className="rounded-lg border border-cyan-300/10 bg-slate-950/55 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="astra-ui-label text-xs text-cyan-100/45">Voice controls</span>
                  <span className="astra-terminal-text text-cyan-100/30">{isRecording ? "Recording" : isTranscribing ? "Transcribing" : "Standby"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-2 text-xs text-cyan-100/55">
                    <Switch checked={autoSendAfterStt} onCheckedChange={setAutoSendAfterStt} />
                    <span className="astra-ui-label text-xs text-cyan-100/55">Auto-send</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-cyan-100/55">
                    <Switch checked={speakReplies} onCheckedChange={setSpeakReplies} />
                    <span className="astra-ui-label text-xs text-cyan-100/55">Speak replies</span>
                  </label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full border-cyan-300/15 bg-white/5 text-cyan-50 hover:bg-cyan-300/10"
                  onClick={handleSpeakLastReply}
                  disabled={isTtsPlaying || !messages?.length || messages[messages.length - 1]?.role !== "assistant"}
                >
                  <Volume2 className={cn("h-4 w-4", isTtsPlaying && "animate-pulse")} />
                  Speak last reply
                </Button>
                {ttsError && <p className="mt-2 text-xs text-red-300">{ttsError}</p>}
              </div>
            </div>

            <div className="rounded-lg border border-cyan-300/10 bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-cyan-100/45">
                <Radar className="h-3.5 w-3.5 text-cyan-300" />
                <span className="astra-ui-label text-xs text-cyan-100/45">Diagnostics</span>
              </div>
              <div className="space-y-2 text-sm text-cyan-50/75">
                <div className="flex items-center justify-between"><span className="astra-ui-label">AI Core</span><span className="astra-terminal-text text-cyan-300">Online</span></div>
                <div className="flex items-center justify-between"><span className="astra-ui-label">Robotics Network</span><span className="astra-terminal-text text-cyan-300">Online</span></div>
                <div className="flex items-center justify-between"><span className="astra-ui-label">Data Nodes</span><span className="astra-terminal-text text-cyan-300">Online</span></div>
                <div className="flex items-center justify-between"><span className="astra-ui-label">Security Layer</span><span className="astra-terminal-text text-fuchsia-300">Active</span></div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="md:col-span-2 xl:col-span-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-lg border border-cyan-300/12 bg-[rgba(4,10,24,0.76)] p-3 shadow-[0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-2xl",
              isDragging && "border-cyan-300/35 bg-cyan-300/8"
            )}
          >
            {isDragging && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-cyan-300/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-cyan-100">
                  <Paperclip className="h-5 w-5" />
                  Drop to attach
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                <AnimatePresence>
                  {attachments.map((at) => (
                    <motion.div
                      key={at.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-white/[0.03] pr-2"
                    >
                      <div className="h-8 w-8 overflow-hidden rounded-lg bg-slate-800">
                        {at.thumb_url ? <img src={at.thumb_url} className="h-full w-full object-cover" /> : <Bot className="m-2 h-4 w-4 text-cyan-200" />}
                      </div>
                      <span className="max-w-[120px] truncate font-mono text-[10px] text-slate-300">{at.id}</span>
                      <button onClick={() => removeAttachment(at.id)} className="px-1 text-slate-400 hover:text-red-300">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-cyan-300/10 pt-3 lg:flex-row lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onPointerDown={startRecording}
                  onPointerUp={stopRecording}
                  onPointerLeave={isRecording ? stopRecording : undefined}
                  disabled={isTranscribing}
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-colors",
                    isRecording ? "border-red-400/30 bg-red-500/15 text-red-200" : "border-white/10 bg-white/5 text-cyan-100 hover:border-cyan-300/20 hover:bg-cyan-300/8"
                  )}
                >
                  <Mic className={cn("h-5 w-5", isRecording && "animate-pulse")} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    refresh();
                    refreshNodes();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-cyan-100/55 hover:border-cyan-300/20 hover:bg-cyan-300/8 hover:text-cyan-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="astra-ui-label text-xs text-cyan-100/55">Sync</span>
                </button>
              </div>

              <div className="flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Issue a command to Astra..."
                  className="min-h-[56px] w-full resize-none rounded-lg border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-cyan-100/30 focus:border-cyan-300/30 focus:outline-none focus:ring-0"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="hidden items-center gap-2 text-xs text-cyan-100/55 lg:flex">
                  <Switch checked={autoSendAfterStt} onCheckedChange={setAutoSendAfterStt} />
                  <span className="astra-ui-label text-xs text-cyan-100/55">Auto-send</span>
                </label>
                <button
                  type="button"
                  onClick={() => setSpeakReplies((value) => !value)}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-xs transition-colors",
                    speakReplies ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/20 hover:bg-cyan-300/8"
                  )}
                >
                  <Volume2 className="h-4 w-4" />
                  <span className="astra-ui-label text-xs">Voice</span>
                </button>
                <button
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && attachments.length === 0) || isPending}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300 px-4 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-transform hover:-translate-y-0.5 hover:bg-cyan-200 disabled:translate-y-0 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span className="astra-ui-label text-sm text-slate-950">Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
