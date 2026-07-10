import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Mic, StopCircle, Image as ImageIcon, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSendDM, useThreadMessages, useOrCreateThreadWith, useMarkThreadRead } from "@/hooks/useDMs";
import { useQuery } from "@tanstack/react-query";
import FramedAvatar from "@/components/FramedAvatar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const MessageThreadPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const send = useSendDM();
  const markRead = useMarkThreadRead();
  const { data: thread } = useOrCreateThreadWith(userId);
  const { data: messages } = useThreadMessages(thread?.id);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recStartRef = useRef<number>(0);

  const { data: other } = useQuery({
    queryKey: ["profile-basic", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await sb.from("profiles").select("user_id, user_id_number, username, display_name, avatar_url").eq("user_id", userId).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (thread?.id) markRead.mutate(thread.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, messages?.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  const sendText = async () => {
    if (!input.trim() || !userId) return;
    const content = input.trim();
    setInput("");
    try {
      await send.mutateAsync({ receiverId: userId, content, mediaType: "text" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send");
    }
  };

  const uploadAndSend = async (file: Blob, mediaType: "voice" | "image", duration?: number, ext = "webm") => {
    if (!user || !userId) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("dm-media").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("dm-media").createSignedUrl(path, 60 * 60 * 24 * 30);
      const url = signed?.signedUrl;
      if (!url) throw new Error("failed to sign url");
      await send.mutateAsync({ receiverId: userId, mediaUrl: url, mediaType, duration });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      recStartRef.current = Date.now();
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const duration = Math.round((Date.now() - recStartRef.current) / 1000);
        stream.getTracks().forEach((t) => t.stop());
        await uploadAndSend(blob, "voice", duration, "webm");
      };
      mr.start();
      setRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    await uploadAndSend(file, "image", undefined, file.name.split(".").pop() ?? "jpg");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40 px-3 py-2 flex items-center gap-3">
        <button onClick={() => navigate("/messages")} className="p-2 rounded-full hover:bg-muted/30">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button onClick={() => other && navigate(`/u/${other.user_id_number ?? other.user_id}`)} className="flex items-center gap-2 flex-1 min-w-0">
          <FramedAvatar src={other?.avatar_url} name={other?.display_name ?? other?.username ?? "User"} size="sm" />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-bold text-sm text-foreground truncate">{other?.display_name ?? other?.username ?? "User"}</p>
            <p className="text-[10px] text-muted-foreground">ID: {other?.user_id_number ?? "—"}</p>
          </div>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 pb-40 space-y-2">
        {(messages ?? []).length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">Say hi to start the conversation 👋</div>
        )}
        {(messages ?? []).map((m: any) => {
          const mine = m.sender_id === user?.id;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${mine ? "text-primary-foreground rounded-br-sm" : "bg-muted/40 text-foreground rounded-bl-sm"}`}
                   style={mine ? { background: "var(--gradient-sunset)" } : undefined}>
                {m.media_type === "voice" && m.media_url && (
                  <VoicePlayer url={m.media_url} duration={m.duration_seconds ?? 0} mine={mine} />
                )}
                {m.media_type === "image" && m.media_url && (
                  <img src={m.media_url} alt="attachment" className="rounded-xl max-w-[240px] max-h-[300px] object-cover" />
                )}
                {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                <p className={`text-[9px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-3 py-3 bg-background/95 backdrop-blur-xl border-t border-border/40 flex items-center gap-2 z-30">
        <label className="p-2 rounded-full hover:bg-muted/40 cursor-pointer">
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
          <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
        </label>
        {!recording ? (
          <>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Type a message"
              className="flex-1 h-11 px-4 rounded-full bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              disabled={uploading}
            />
            {input.trim() ? (
              <motion.button whileTap={{ scale: 0.9 }} onClick={sendText} className="w-11 h-11 rounded-full flex items-center justify-center text-primary-foreground shadow-lift" style={{ background: "var(--gradient-sunset)" }}>
                <Send className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.9 }} onClick={startRecording} className="w-11 h-11 rounded-full flex items-center justify-center text-primary-foreground shadow-lift" style={{ background: "var(--gradient-sunset)" }}>
                <Mic className="w-5 h-5" />
              </motion.button>
            )}
          </>
        ) : (
          <>
            <div className="flex-1 h-11 rounded-full bg-destructive/15 text-destructive text-sm font-semibold flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" /> Recording…
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={stopRecording} className="w-11 h-11 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground">
              <StopCircle className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
};

const VoicePlayer = ({ url, duration, mine }: { url: string; duration: number; mine: boolean }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  const min = Math.floor(duration / 60);
  const sec = duration % 60;
  return (
    <button onClick={toggle} className={`flex items-center gap-2 min-w-[140px] py-1 ${mine ? "text-primary-foreground" : "text-foreground"}`}>
      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${mine ? "bg-white/25" : "bg-primary/20"}`}>
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </span>
      <div className={`flex-1 h-1 rounded-full ${mine ? "bg-white/30" : "bg-muted-foreground/30"}`}>
        <div className={`h-full rounded-full w-1/2 ${mine ? "bg-white" : "bg-primary"}`} />
      </div>
      <span className="text-[10px] font-bold tabular-nums">{`${min}:${sec.toString().padStart(2, "0")}`}</span>
    </button>
  );
};

export default MessageThreadPage;