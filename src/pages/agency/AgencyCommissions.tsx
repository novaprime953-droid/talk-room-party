import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Percent, Users, TrendingUp, DollarSign } from "lucide-react";
import EmptyState from "@/components/EmptyState";

const AgencyCommissions = () => {
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
    queryKey: ["agency-hosts-commission", agency?.id],
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

  const rate = Number(agency?.commission_rate ?? 10);
  const totalHostEarnings = hosts?.reduce((s, h) => s + Number(h.total_earnings), 0) ?? 0;
  const monthlyHostEarnings = hosts?.reduce((s, h) => s + Number(h.monthly_earnings), 0) ?? 0;
  const totalCommission = totalHostEarnings * (rate / 100);
  const monthlyCommission = monthlyHostEarnings * (rate / 100);
  const activeCount = hosts?.filter((h) => h.status === "active").length ?? 0;

  // Calculate each host's contribution percentage
  const hostContributions = hosts?.map((h) => ({
    ...h,
    contribution: totalHostEarnings > 0 ? (Number(h.total_earnings) / totalHostEarnings) * 100 : 0,
  }));

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Commission Tracking</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><Percent className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Commission Rate</span></div>
          <p className="text-2xl font-bold text-foreground">{rate}%</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><PieChart className="w-4 h-4 text-accent" /><span className="text-xs text-muted-foreground">Total Commission</span></div>
          <p className="text-2xl font-bold text-foreground">${totalCommission.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">Monthly Commission</span></div>
          <p className="text-2xl font-bold text-foreground">${monthlyCommission.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-online" /><span className="text-xs text-muted-foreground">Active Hosts</span></div>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
        </div>
      </div>

      {/* Revenue Distribution Bar */}
      {hostContributions && hostContributions.length > 0 && totalHostEarnings > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
          <h3 className="font-semibold text-foreground mb-3">Revenue Distribution</h3>
          <div className="flex rounded-full overflow-hidden h-4 bg-muted/30">
            {hostContributions.filter((h) => h.contribution > 0).map((h: any, i: number) => {
              const colors = ["bg-primary", "bg-accent", "bg-online", "bg-warning", "bg-destructive"];
              return (
                <div key={h.id} className={`${colors[i % colors.length]} relative group`} style={{ width: `${h.contribution}%` }} title={`${h.profiles?.display_name}: ${h.contribution.toFixed(1)}%`} />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {hostContributions.filter((h) => h.contribution > 0).slice(0, 5).map((h: any, i: number) => {
              const colors = ["bg-primary", "bg-accent", "bg-online", "bg-warning", "bg-destructive"];
              return (
                <div key={h.id} className="flex items-center gap-1.5 text-[10px]">
                  <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                  <span className="text-muted-foreground">{h.profiles?.display_name} ({h.contribution.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Per-Host Commission</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Monthly Earned</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Total Earned</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Your Commission</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Share</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {hostContributions?.map((h: any, i: number) => (
                <tr key={h.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</td>
                  <td className="px-4 py-3 text-accent font-bold">${Number(h.monthly_earnings).toFixed(2)}</td>
                  <td className="px-4 py-3 text-foreground">${Number(h.total_earnings).toFixed(2)}</td>
                  <td className="px-4 py-3 text-primary font-bold">${(Number(h.total_earnings) * rate / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${h.contribution}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{h.contribution.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${h.status === "active" ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"}`}>{h.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!hosts || hosts.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No commission data available</p>}
      </div>
    </div>
  );
};

export default AgencyCommissions;
