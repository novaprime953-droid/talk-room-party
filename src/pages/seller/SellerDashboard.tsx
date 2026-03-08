import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Coins, CreditCard, TrendingUp, Users, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: pendingRecharges } = useQuery({
    queryKey: ["seller-pending-recharges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recharge_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ["seller-recent-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*, profiles:user_id(username, display_name)")
        .in("type", ["seller_transfer", "recharge"])
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: todayStats } = useQuery({
    queryKey: ["seller-today-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("recharge_requests")
        .select("coins_amount, status")
        .gte("created_at", today.toISOString());
      if (error) throw error;
      const approved = data?.filter((r) => r.status === "approved") ?? [];
      const totalCoins = approved.reduce((s, r) => s + r.coins_amount, 0);
      return { totalRequests: data?.length ?? 0, approved: approved.length, totalCoins };
    },
  });

  const stats = [
    { label: "Pending Requests", value: pendingRecharges?.length ?? 0, icon: Clock, color: "text-warning" },
    { label: "Today's Requests", value: todayStats?.totalRequests ?? 0, icon: CreditCard, color: "text-info" },
    { label: "Approved Today", value: todayStats?.approved ?? 0, icon: ShieldCheck, color: "text-online" },
    { label: "Coins Distributed", value: (todayStats?.totalCoins ?? 0).toLocaleString(), icon: Coins, color: "text-accent" },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Coins Seller Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 shadow-card">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending Alert */}
      {(pendingRecharges?.length ?? 0) > 0 && (
        <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("/seller/recharges")}
          className="bg-warning/10 border border-warning/20 rounded-2xl p-4 mb-6 flex items-center gap-3 cursor-pointer">
          <Clock className="w-5 h-5 text-warning" />
          <span className="text-sm font-bold text-warning">{pendingRecharges?.length} pending recharge request{(pendingRecharges?.length ?? 0) > 1 ? "s" : ""} awaiting approval</span>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Send Coins", path: "/seller/send" },
          { label: "Process Recharges", path: "/seller/recharges" },
          { label: "Verify Payments", path: "/seller/verify" },
          { label: "Transaction History", path: "/seller/history" },
        ].map((link) => (
          <motion.button key={link.path} whileTap={{ scale: 0.97 }} onClick={() => navigate(link.path)}
            className="bg-card rounded-2xl p-3 shadow-card text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors text-left">
            {link.label}
          </motion.button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-2xl shadow-card">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-border/30">
          {recentTransactions?.map((t: any) => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {t.profiles?.display_name ?? t.profiles?.username ?? "User"}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.description ?? t.type} • {new Date(t.created_at).toLocaleString()}</p>
              </div>
              <span className="text-sm font-bold text-online">+{t.amount.toLocaleString()}</span>
            </div>
          ))}
          {(!recentTransactions || recentTransactions.length === 0) && (
            <p className="text-center text-muted-foreground text-sm py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
