import { motion } from "framer-motion";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notifications
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                onClick={() => !n.is_read && markRead.mutate(n.id)}
                className={`p-4 rounded-xl cursor-pointer transition-colors ${
                  n.is_read ? "bg-card" : "bg-primary/5 border border-primary/20"
                } shadow-card`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {n.is_read && <CheckCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-12">No notifications yet</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
