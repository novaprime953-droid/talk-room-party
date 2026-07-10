import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useDMThreads } from "@/hooks/useDMs";
import { useAuth } from "@/hooks/useAuth";
import FramedAvatar from "@/components/FramedAvatar";
import SunsetOrbs from "@/components/SunsetOrbs";

const formatTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: threads, isLoading } = useDMThreads();
  const [q, setQ] = useState("");

  const filtered = (threads ?? []).filter((t: any) => {
    if (!q.trim()) return true;
    const query = q.toLowerCase();
    const name = (t.other?.display_name ?? t.other?.username ?? "").toLowerCase();
    const num = String(t.other?.user_id_number ?? "");
    return name.includes(query) || num.includes(query);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative overflow-hidden">
        <SunsetOrbs variant="hero" />
        <div className="relative px-4 pt-6 pb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full glass-card">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-display font-black text-2xl text-foreground">Messages</h1>
          </div>
          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or ID"
              className="w-full h-11 pl-11 pr-4 rounded-full glass-card text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-2">
        {isLoading && <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Message someone from their profile to start chatting.</p>
          </div>
        )}
        <div className="space-y-1">
          {filtered.map((t: any, i: number) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => navigate(`/messages/${t.other?.user_id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/30 transition-colors text-left"
            >
              <FramedAvatar src={t.other?.avatar_url} name={t.other?.display_name ?? t.other?.username ?? "User"} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-foreground truncate">
                    {t.other?.display_name ?? t.other?.username ?? "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(t.last_message_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className={`text-xs truncate ${t.unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                    {t.last_sender_id === user?.id ? "You: " : ""}
                    {t.last_message_preview ?? "Say hi 👋"}
                  </span>
                  {t.unread > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black text-primary-foreground flex items-center justify-center" style={{ background: "var(--gradient-sunset)" }}>
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;