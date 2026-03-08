import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Gift, DoorOpen, Users, Ban } from "lucide-react";

const AdminLogs = () => {
  // Combine recent activity from multiple tables
  const { data: activity } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const [gifts, rooms, bans, reports] = await Promise.all([
        supabase.from("gift_transactions").select("id, coins_spent, created_at, gifts(gift_name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("voice_rooms").select("id, room_name, created_at, is_live").order("created_at", { ascending: false }).limit(10),
        supabase.from("bans").select("id, reason, created_at, ban_type").order("created_at", { ascending: false }).limit(10),
        supabase.from("reports").select("id, reason, status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const logs = [
        ...(gifts.data?.map((g: any) => ({
          type: "gift" as const,
          icon: Gift,
          text: `Gift sent: ${g.gifts?.gift_name ?? "Unknown"} (${g.coins_spent} coins)`,
          time: g.created_at,
          color: "text-accent",
        })) ?? []),
        ...(rooms.data?.map((r) => ({
          type: "room" as const,
          icon: DoorOpen,
          text: `Room ${r.is_live ? "created" : "closed"}: ${r.room_name}`,
          time: r.created_at,
          color: "text-info",
        })) ?? []),
        ...(bans.data?.map((b) => ({
          type: "ban" as const,
          icon: Ban,
          text: `User banned: ${b.reason} (${b.ban_type})`,
          time: b.created_at,
          color: "text-destructive",
        })) ?? []),
        ...(reports.data?.map((r) => ({
          type: "report" as const,
          icon: Users,
          text: `Report: ${r.reason} [${r.status}]`,
          time: r.created_at,
          color: "text-warning",
        })) ?? []),
      ];

      return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 30);
    },
  });

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6 text-primary" /> Activity Logs
      </h1>

      <div className="space-y-2">
        {activity?.map((log, i) => (
          <div key={`${log.type}-${i}`} className="flex items-start gap-3 bg-card rounded-xl p-3 shadow-card">
            <div className={`w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <log.icon className={`w-4 h-4 ${log.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{log.text}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(log.time).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {(!activity || activity.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No activity yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
