import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, TrendingUp, Coins, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const HostEarnings = () => {
  const { user } = useAuth();

  const { data: host } = useQuery({
    queryKey: ["host-earnings-record", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("hosts").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["host-coin-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .in("type", ["gift_received", "owner_gift", "recharge"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Group by day
  const dailyEarnings = transactions?.reduce((acc: Record<string, number>, t) => {
    const day = new Date(t.created_at).toLocaleDateString();
    acc[day] = (acc[day] || 0) + t.amount;
    return acc;
  }, {}) ?? {};

  const days = Object.entries(dailyEarnings).slice(0, 7);
  const maxDaily = Math.max(...days.map(([, v]) => v), 1);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-accent" /> Earnings Analytics
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Total Earnings", value: `$${Number(host?.total_earnings ?? 0).toFixed(2)}`, icon: DollarSign },
          { label: "This Month", value: `$${Number(host?.monthly_earnings ?? 0).toFixed(2)}`, icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-4 shadow-card">
            <s.icon className="w-5 h-5 text-accent mb-2" />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      {days.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
          <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Daily Earnings (Last 7 days)
          </h3>
          <div className="flex items-end gap-2 h-32">
            {days.map(([day, amount]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-accent">{amount > 0 ? `+${amount}` : amount}</span>
                <div className="w-full rounded-t-lg gradient-primary transition-all"
                  style={{ height: `${(Math.abs(amount) / maxDaily) * 100}%`, minHeight: "4px" }} />
                <span className="text-[8px] text-muted-foreground">{day.split("/").slice(0, 2).join("/")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-card rounded-2xl shadow-card">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-bold text-sm text-foreground">Transaction History</h3>
        </div>
        <div className="divide-y divide-border/30">
          {transactions?.map((t) => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">{t.description ?? t.type}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <span className={`text-sm font-bold ${t.amount > 0 ? "text-online" : "text-destructive"}`}>
                {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
              </span>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <p className="text-center text-muted-foreground text-sm py-8">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostEarnings;
