import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

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

  const totalRevenue = hosts?.reduce((s, h) => s + Number(h.total_earnings), 0) ?? 0;
  const monthlyRevenue = hosts?.reduce((s, h) => s + Number(h.monthly_earnings), 0) ?? 0;
  const commissionRate = Number(agency?.commission_rate ?? 10) / 100;
  const agencyEarnings = Number(agency?.total_earnings ?? 0);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Earnings Report</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Agency Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${agencyEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Hosts Monthly</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${monthlyRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-online" />
            <span className="text-xs text-muted-foreground">Hosts Lifetime</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Host Earnings Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Monthly</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Your Cut</th>
              </tr>
            </thead>
            <tbody>
              {hosts?.map((h: any) => (
                <tr key={h.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3 font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</td>
                  <td className="px-4 py-3 text-accent font-bold">${Number(h.monthly_earnings).toFixed(2)}</td>
                  <td className="px-4 py-3 text-foreground">${Number(h.total_earnings).toFixed(2)}</td>
                  <td className="px-4 py-3 text-primary font-bold">${(Number(h.total_earnings) * commissionRate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!hosts || hosts.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No earnings data yet</p>
        )}
      </div>
    </div>
  );
};

export default AgencyEarnings;
