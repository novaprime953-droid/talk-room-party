import { motion } from "framer-motion";
import { Gift, Send } from "lucide-react";
import { useState } from "react";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  type?: "system" | "gift" | "chat";
}

const mockMessages: ChatMessage[] = [
  { id: "1", user: "System", message: "Welcome to the room! 🎉", type: "system" },
  { id: "2", user: "Sarah", message: "Hey everyone! Happy to be here", type: "chat" },
  { id: "3", user: "Mike", message: "🎤 Great vibes tonight!", type: "chat" },
  { id: "4", user: "Luna", message: "sent a 🌹 Rose to the host", type: "gift" },
  { id: "5", user: "Alex", message: "Can I get on the mic?", type: "chat" },
];

const RoomChat = () => {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {mockMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-3 py-1.5 rounded-xl inline-block max-w-[85%] ${
              msg.type === "system"
                ? "bg-muted/30 w-full text-center"
                : msg.type === "gift"
                ? "gradient-gold/10 border border-accent/20"
                : "bg-muted/40"
            }`}
          >
            {msg.type !== "system" && (
              <span className={`text-xs font-bold ${msg.type === "gift" ? "text-accent" : "text-primary"}`}>
                {msg.user}{" "}
              </span>
            )}
            <span className="text-xs text-foreground/80">{msg.message}</span>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
        <button className="p-2 rounded-full bg-accent/10 text-accent">
          <Gift className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say something..."
          className="flex-1 bg-muted/30 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full gradient-primary text-primary-foreground"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default RoomChat;
