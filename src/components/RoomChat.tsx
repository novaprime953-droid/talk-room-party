import { motion } from "framer-motion";
import { Gift, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  type: string;
  created_at: string;
  username?: string;
}

const RoomChat = ({ roomId }: { roomId: string }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("room_messages")
        .select("*, profiles:profiles!room_messages_user_id_fkey(username, display_name)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            message: m.message,
            type: m.type,
            created_at: m.created_at,
            username: m.profiles?.display_name ?? m.profiles?.username ?? "User",
          }))
        );
      }
    };
    load();
  }, [roomId]);

  // Realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "room_messages",
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        // Fetch username
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("user_id", newMsg.user_id)
          .single();

        setMessages((prev) => [
          ...prev,
          {
            id: newMsg.id,
            user_id: newMsg.user_id,
            message: newMsg.message,
            type: newMsg.type,
            created_at: newMsg.created_at,
            username: profile?.display_name ?? profile?.username ?? "User",
          },
        ]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const msg = input.trim();
    setInput("");
    await supabase.from("room_messages").insert({
      room_id: roomId,
      user_id: user.id,
      message: msg,
      type: "text",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-3 py-1.5 rounded-xl inline-block max-w-[85%] ${
              msg.type === "system"
                ? "bg-muted/30 w-full text-center"
                : msg.type === "gift"
                ? "border border-accent/20 bg-accent/5"
                : "bg-muted/40"
            }`}
          >
            {msg.type !== "system" && (
              <span className={`text-xs font-bold ${msg.type === "gift" ? "text-accent" : "text-primary"}`}>
                {msg.username}{" "}
              </span>
            )}
            <span className="text-xs text-foreground/80">{msg.message}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Say something..."
          className="flex-1 bg-muted/30 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={sendMessage}
          className="p-2 rounded-full gradient-primary text-primary-foreground"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default RoomChat;
