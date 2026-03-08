import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

const AgencyEarnings = () => {
  const { user } = useAuth();

  const { data: agency } = useQuery({
    queryKey: ["my-agency"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("*").eq("owner_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: hosts } = useQuery({
    queryKey: ["agency-hosts-earnings", agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*, profiles!hosts_user_id_fkey(display_name, username)")
        .eq("agency_id", agency!.id)
        .order("total_earnings", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  // Gift transaction history for all agency hosts
  const hostUserIds = hosts?.map((h) => h.user_id) ?? [];
  const { data: giftHistory } = useQuery({
    queryKey: ["agency-gift-history", hostUserIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("*, gifts(gift_name)")
        .in("receiver_id", hostUserIds)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: hostUserIds.length > 0,
  });

  const totalRevenue = hosts?.reduce((s, h) => s + Number(h.total_earnings), 0) ?? 0;
  const monthlyRevenue = hosts?.reduce((s, h) => s + Number(h.monthly_earnings), 0) ?? 0;
  const commissionRate = Number(agency?.commission_rate ?? 10) / 100;
  const agencyEarnings = Number(agency?.total_earnings ?? 0);
  const topEarner = hosts?.[0];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Earnings Report</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-accent" /><span className="text-xs text-muted-foreground">Agency Total</span></div>
          <p className="text-2xl font-bold text-foreground">${agencyEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Monthly Revenue</span></div>
          <p className="text-2xl font-bold text-foreground">${monthlyRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Your cut: ${(monthlyRevenue * commissionRate).toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-online" /><span className="text-xs text-muted-foreground">Lifetime Revenue</span></div>
          <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Your cut: ${(totalRevenue * commissionRate).toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">Top Earner</span></div>
          <p className="text-lg font-bold text-foreground">{(topEarner as any)?.profiles?.display_name ?? "—"}</p>
          <p className="text-[10px] text-accent font-bold">${Number(topEarner?.total_earnings ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Host Earnings Table */}
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Host Earnings Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Monthly</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Your Cut</th>
                </tr>
              </thead>
              <tbody>
                {hosts?.map((h: any, i: number) => (
                  <tr key={h.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</td>
                    <td className="px-4 py-3 text-accent font-bold">${Number(h.monthly_earnings).toFixed(2)}</td>
                    <td className="px-4 py-3 text-foreground">${Number(h.total_earnings).toFixed(2)}</td>
                    <td className="px-4 py-3 text-primary font-bold">${(Number(h.total_earnings) * commissionRate).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!hosts || hosts.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No earnings data yet</p>}
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Recent Gift Transactions</h3>
          </div>
          <div className="divide-y divide-border/30">
            {giftHistory?.map((g: any) => {
              const host = hosts?.find((h) => h.user_id === g.receiver_id);
              return (
                <div key={g.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{(host as any)?.profiles?.display_name ?? "Host"}</p>
                    <p className="text-[10px] text-muted-foreground">{g.gifts?.gift_name} × {g.quantity} • {new Date(g.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{g.coins_spent}</p>
                    <p className="text-[10px] text-primary font-bold">+{(g.coins_spent * commissionRate).toFixed(0)} yours</p>
                  </div>
                </div>
              );
            })}
            {(!giftHistory || giftHistory.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No transactions yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyEarnings;
