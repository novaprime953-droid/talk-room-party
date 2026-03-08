import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Gift, Coins, TrendingUp, Star, DoorOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HostDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: host } = useQuery({
    queryKey: ["my-host-record", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("hosts").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile-host", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentGifts } = useQuery({
    queryKey: ["my-recent-gifts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("*, gifts(gift_name, icon_url, coin_value), sender:sender_id(username, display_name, avatar_url)")
        .eq("receiver_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myRooms } = useQuery({
    queryKey: ["my-rooms-count", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("voice_rooms").select("id, is_live").eq("host_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: pendingWithdrawals } = useQuery({
    queryKey: ["my-pending-withdrawals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawal_requests").select("id").eq("user_id", user!.id).eq("status", "pending");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const liveRooms = myRooms?.filter((r) => r.is_live).length ?? 0;

  const stats = [
    { label: "Total Earnings", value: `$${Number(host?.total_earnings ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-online" },
    { label: "Monthly", value: `$${Number(host?.monthly_earnings ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-accent" },
    { label: "Coin Balance", value: (profile?.coins_balance ?? 0).toLocaleString(), icon: Coins, color: "text-primary" },
    { label: "Host Level", value: host?.level ?? 1, icon: Star, color: "text-accent" },
    { label: "My Rooms", value: myRooms?.length ?? 0, icon: DoorOpen, color: "text-info" },
    { label: "Pending Withdrawals", value: pendingWithdrawals?.length ?? 0, icon: DollarSign, color: "text-warning" },
  ];

  const quickLinks = [
    { label: "View Earnings", path: "/host/earnings" },
    { label: "Gifts Received", path: "/host/gifts" },
    { label: "Request Withdrawal", path: "/host/withdrawals" },
    { label: "Room Statistics", path: "/host/rooms" },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Host Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 shadow-card">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Live Status */}
      {liveRooms > 0 && (
        <div className="bg-online/10 border border-online/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-3 h-3 bg-online rounded-full animate-pulse" />
          <span className="text-sm font-bold text-online">{liveRooms} room{liveRooms > 1 ? "s" : ""} live now</span>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {quickLinks.map((link) => (
          <motion.button key={link.path} whileTap={{ scale: 0.97 }} onClick={() => navigate(link.path)}
            className="bg-card rounded-2xl p-3 shadow-card text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors text-left">
            {link.label}
          </motion.button>
        ))}
      </div>

      {/* Recent Gifts */}
      <div className="bg-card rounded-2xl shadow-card">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Gift className="w-4 h-4 text-accent" /> Recent Gifts
          </h3>
        </div>
        {recentGifts && recentGifts.length > 0 ? (
          <div className="divide-y divide-border/30">
            {recentGifts.map((g: any) => (
              <div key={g.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                  {g.sender?.avatar_url ? (
                    <img src={g.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{(g.sender?.display_name ?? "U").charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {g.sender?.display_name ?? g.sender?.username ?? "Someone"} sent {g.gifts?.gift_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{new Date(g.created_at).toLocaleString()}</p>
                </div>
                <span className="text-xs font-bold text-accent flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {g.coins_spent}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">No gifts received yet</p>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
