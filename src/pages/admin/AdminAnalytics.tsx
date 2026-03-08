import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Users, Coins, Gift, DoorOpen } from "lucide-react";
import { motion } from "framer-motion";

const AdminAnalytics = () => {
  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [users, rooms, gifts, recharges, withdrawals, hosts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("voice_rooms").select("id", { count: "exact", head: true }),
        supabase.from("gift_transactions").select("coins_spent"),
        supabase.from("recharge_requests").select("amount, status").eq("status", "approved"),
        supabase.from("withdrawal_requests").select("amount, status").eq("status", "approved"),
        supabase.from("hosts").select("total_earnings"),
      ]);

      const totalGiftCoins = gifts.data?.reduce((sum, g) => sum + g.coins_spent, 0) ?? 0;
      const totalRecharges = recharges.data?.reduce((sum, r) => sum + Number(r.amount), 0) ?? 0;
      const totalWithdrawals = withdrawals.data?.reduce((sum, w) => sum + Number(w.amount), 0) ?? 0;
      const totalHostEarnings = hosts.data?.reduce((sum, h) => sum + Number(h.total_earnings), 0) ?? 0;

      return {
        totalUsers: users.count ?? 0,
        totalRooms: rooms.count ?? 0,
        totalGiftCoins,
        totalRecharges,
        totalWithdrawals,
        totalHostEarnings,
        netRevenue: totalRecharges - totalWithdrawals,
      };
    },
  });

  const metrics = [
    { icon: Users, label: "Total Users", value: data?.totalUsers?.toLocaleString() ?? "0", color: "text-primary" },
    { icon: DoorOpen, label: "Total Rooms Created", value: data?.totalRooms?.toLocaleString() ?? "0", color: "text-info" },
    { icon: Gift, label: "Total Gift Coins", value: data?.totalGiftCoins?.toLocaleString() ?? "0", color: "text-accent" },
    { icon: Coins, label: "Total Recharges", value: `$${data?.totalRecharges?.toFixed(2) ?? "0.00"}`, color: "text-online" },
    { icon: TrendingUp, label: "Total Withdrawals", value: `$${data?.totalWithdrawals?.toFixed(2) ?? "0.00"}`, color: "text-warning" },
    { icon: BarChart3, label: "Net Revenue", value: `$${data?.netRevenue?.toFixed(2) ?? "0.00"}`, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" /> Analytics
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-5 shadow-card"
          >
            <m.icon className={`w-5 h-5 ${m.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{m.value}</p>
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h2 className="font-display font-bold text-sm text-foreground mb-3">Revenue Breakdown</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Recharges (Income)</span>
            <span className="text-sm font-bold text-online">+${data?.totalRecharges?.toFixed(2) ?? "0.00"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Withdrawals (Outgoing)</span>
            <span className="text-sm font-bold text-destructive">-${data?.totalWithdrawals?.toFixed(2) ?? "0.00"}</span>
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Net Revenue</span>
            <span className={`text-sm font-bold ${(data?.netRevenue ?? 0) >= 0 ? "text-online" : "text-destructive"}`}>
              ${data?.netRevenue?.toFixed(2) ?? "0.00"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
