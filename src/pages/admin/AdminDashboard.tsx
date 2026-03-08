import { motion } from "framer-motion";
import { Users, DoorOpen, FileText, Coins, TrendingUp, Activity, Gift, Building, Mic, Crown, DollarSign } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { data: stats } = useAdminStats();

  const { data: extraStats } = useQuery({
    queryKey: ["admin-extra-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [hosts, activeHosts, agencies, coinTx, dailyRecharges, recentGifts] = await Promise.all([
        supabase.from("hosts").select("id", { count: "exact", head: true }),
        supabase.from("hosts").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("agencies").select("id", { count: "exact", head: true }),
        supabase.from("coin_transactions").select("id", { count: "exact", head: true }),
        supabase.from("recharge_requests").select("amount").eq("status", "approved").gte("created_at", today.toISOString()),
        supabase.from("gift_transactions").select("coins_spent"),
      ]);

      const dailyRevenue = dailyRecharges.data?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
      const totalGiftVolume = recentGifts.data?.reduce((s, g) => s + g.coins_spent, 0) ?? 0;

      return {
        totalHosts: hosts.count ?? 0,
        activeHosts: activeHosts.count ?? 0,
        totalAgencies: agencies.count ?? 0,
        totalCoinTx: coinTx.count ?? 0,
        dailyRevenue,
        totalGiftVolume,
      };
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, created_at, level")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const statCards = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers ?? 0, color: "text-primary" },
    { icon: DoorOpen, label: "Active Voice Rooms", value: stats?.activeRooms ?? 0, color: "text-online" },
    { icon: Mic, label: "Total Hosts", value: extraStats?.totalHosts ?? 0, color: "text-accent" },
    { icon: Building, label: "Total Agencies", value: extraStats?.totalAgencies ?? 0, color: "text-info" },
    { icon: Coins, label: "Total Coin Transactions", value: (extraStats?.totalCoinTx ?? 0).toLocaleString(), color: "text-warning" },
    { icon: DollarSign, label: "Daily Revenue", value: `$${(extraStats?.dailyRevenue ?? 0).toFixed(2)}`, color: "text-online" },
    { icon: Activity, label: "Active Hosts", value: extraStats?.activeHosts ?? 0, color: "text-secondary" },
    { icon: FileText, label: "Pending Reports", value: stats?.pendingReports ?? 0, color: "text-destructive" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-7 h-7 text-warning" />
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Owner Panel Dashboard</h1>
          <p className="text-xs text-muted-foreground">Main control center • Full system overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-4 shadow-card"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Users */}
      <h2 className="font-display font-bold text-lg text-foreground mb-3">Recent Signups</h2>
      <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers?.map((u) => (
                <tr key={u.user_id} className="border-b border-border/30 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-foreground">
                            {(u.display_name ?? u.username ?? "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{u.display_name ?? u.username}</p>
                        <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">Lv.{u.level}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
