import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, DoorOpen, Gift, TrendingUp } from "lucide-react";

const OwnerAnalytics = () => {
  const { data } = useQuery({
    queryKey: ["owner-analytics"],
    queryFn: async () => {
      const [users, rooms, gifts, recharges] = await Promise.all([
        supabase.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("voice_rooms").select("created_at, is_live").limit(100),
        supabase.from("gift_transactions").select("coins_spent, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("recharge_requests").select("amount, status, created_at").order("created_at", { ascending: false }).limit(200),
      ]);
      const totalGiftRevenue = gifts.data?.reduce((s, g) => s + g.coins_spent, 0) ?? 0;
      const approvedRecharges = recharges.data?.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.amount), 0) ?? 0;
      return {
        recentUsers: users.data?.length ?? 0,
        totalRooms: rooms.data?.length ?? 0,
        liveRooms: rooms.data?.filter((r) => r.is_live).length ?? 0,
        totalGiftCoins: totalGiftRevenue,
        totalRechargeRevenue: approvedRecharges,
      };
    },
  });

  const metrics = [
    { label: "Recent Users (100)", value: data?.recentUsers ?? 0, icon: Users, color: "text-primary" },
    { label: "Total Rooms", value: data?.totalRooms ?? 0, icon: DoorOpen, color: "text-accent" },
    { label: "Live Now", value: data?.liveRooms ?? 0, icon: TrendingUp, color: "text-online" },
    { label: "Gift Volume (coins)", value: (data?.totalGiftCoins ?? 0).toLocaleString(), icon: Gift, color: "text-warning" },
    { label: "Recharge Revenue", value: `$${(data?.totalRechargeRevenue ?? 0).toFixed(2)}`, icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">System Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerAnalytics;
