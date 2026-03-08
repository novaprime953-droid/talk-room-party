import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Percent, Users } from "lucide-react";

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
  const totalCommission = totalHostEarnings * (rate / 100);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Commission Tracking</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Commission Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{rate}%</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Total Commission</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalCommission.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-online" />
            <span className="text-xs text-muted-foreground">Active Hosts</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{hosts?.filter((h) => h.status === "active").length ?? 0}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Per-Host Commission</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host Earned</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Your Commission</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {hosts?.map((h: any) => (
                <tr key={h.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3 font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</td>
                  <td className="px-4 py-3 text-foreground">${Number(h.total_earnings).toFixed(2)}</td>
                  <td className="px-4 py-3 text-primary font-bold">${(Number(h.total_earnings) * rate / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      h.status === "active" ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"
                    }`}>{h.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!hosts || hosts.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No commission data available</p>
        )}
      </div>
    </div>
  );
};

export default AgencyCommissions;
