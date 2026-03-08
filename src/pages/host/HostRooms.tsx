import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DoorOpen, Users, MessageSquare, Coins, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const HostRooms = () => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: rooms } = useQuery({
    queryKey: ["host-my-rooms", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_rooms")
        .select("*")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: roomStats } = useQuery({
    queryKey: ["host-room-stats", user?.id],
    queryFn: async () => {
      if (!rooms?.length) return {};
      const roomIds = rooms.map((r) => r.id);
      const [messages, participants, gifts] = await Promise.all([
        supabase.from("room_messages").select("room_id").in("room_id", roomIds),
        supabase.from("room_participants").select("room_id, user_id").in("room_id", roomIds),
        supabase.from("gift_transactions").select("room_id, coins_spent").in("room_id", roomIds),
      ]);
      const stats: Record<string, { messages: number; participants: number; revenue: number }> = {};
      roomIds.forEach((id) => { stats[id] = { messages: 0, participants: 0, revenue: 0 }; });
      messages.data?.forEach((m) => { if (stats[m.room_id]) stats[m.room_id].messages++; });
      participants.data?.forEach((p) => { if (stats[p.room_id]) stats[p.room_id].participants++; });
      gifts.data?.forEach((g) => { if (g.room_id && stats[g.room_id]) stats[g.room_id].revenue += g.coins_spent; });
      return stats;
    },
    enabled: !!rooms && rooms.length > 0,
  });

  const liveCount = rooms?.filter((r) => r.is_live).length ?? 0;
  const totalRevenue = Object.values(roomStats ?? {}).reduce((s, r) => s + r.revenue, 0);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <DoorOpen className="w-6 h-6 text-accent" /> Room Statistics
      </h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-lg font-bold text-foreground">{rooms?.length ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Total Rooms</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-lg font-bold text-online">{liveCount}</p>
          <p className="text-[10px] text-muted-foreground">Live Now</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <Coins className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-accent">{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total Revenue</p>
        </div>
      </div>

      <div className="space-y-3">
        {rooms?.map((room) => {
          const stats = roomStats?.[room.id];
          return (
            <motion.div key={room.id} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === room.id ? null : room.id)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {room.is_live && <Radio className="w-3.5 h-3.5 text-online animate-pulse" />}
                    <h3 className="font-bold text-sm text-foreground">{room.room_name}</h3>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    room.is_live ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"
                  }`}>{room.is_live ? "LIVE" : room.status}</span>
                </div>
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {stats?.participants ?? 0}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {stats?.messages ?? 0}</span>
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-accent" /> {(stats?.revenue ?? 0).toLocaleString()}</span>
                  <span className="capitalize">{room.category}</span>
                </div>
              </div>
              {expanded === room.id && (
                <div className="border-t border-border/30 px-4 py-3 bg-muted/10">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Created:</span> <span className="text-foreground font-medium">{new Date(room.created_at).toLocaleDateString()}</span></div>
                    <div><span className="text-muted-foreground">Max Seats:</span> <span className="text-foreground font-medium">{room.max_seats}</span></div>
                    <div><span className="text-muted-foreground">Privacy:</span> <span className="text-foreground font-medium capitalize">{room.privacy_type}</span></div>
                    <div><span className="text-muted-foreground">Listeners:</span> <span className="text-foreground font-medium">{room.listener_count}</span></div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        {(!rooms || rooms.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No rooms created yet</p>
        )}
      </div>
    </div>
  );
};

export default HostRooms;
