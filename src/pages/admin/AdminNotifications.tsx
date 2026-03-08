import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: recent } = useQuery({
    queryKey: ["admin-notifications-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("type", "system")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const sendBroadcast = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Fill in both fields"); return; }
    setSending(true);
    try {
      // Get all user IDs
      const { data: users } = await supabase.from("profiles").select("user_id");
      if (users && users.length > 0) {
        const notifications = users.map((u) => ({
          user_id: u.user_id,
          title: title.trim(),
          message: message.trim(),
          type: "system",
        }));
        // Insert in batches of 100
        for (let i = 0; i < notifications.length; i += 100) {
          await supabase.from("notifications").insert(notifications.slice(i, i + 100));
        }
        toast.success(`Sent to ${users.length} users`);
        setTitle("");
        setMessage("");
      }
    } catch {
      toast.error("Failed to send");
    }
    setSending(false);
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Broadcast Notifications</h1>

      <div className="bg-card rounded-2xl p-5 shadow-card mb-8">
        <h2 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Send System Notification
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title..."
            className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message content..."
            rows={3}
            className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={sendBroadcast}
            disabled={sending}
            className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Broadcast to All Users"}
          </motion.button>
        </div>
      </div>

      <h2 className="font-display font-bold text-sm text-foreground mb-3">Recent Broadcasts</h2>
      <div className="space-y-2">
        {recent?.map((n) => (
          <div key={n.id} className="bg-card rounded-xl p-3 shadow-card">
            <p className="text-sm font-bold text-foreground">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
            <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
        {(!recent || recent.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-6">No broadcasts sent</p>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
