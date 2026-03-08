import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, DollarSign, TrendingUp, Activity } from "lucide-react";

const AgencyDashboard = () => {
  const { user } = useAuth();

  const { data: agency } = useQuery({
    queryKey: ["my-agency"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: hosts } = useQuery({
    queryKey: ["agency-hosts", agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*, profiles!hosts_user_id_fkey(username, display_name, avatar_url)")
        .eq("agency_id", agency!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  const totalEarnings = hosts?.reduce((sum, h) => sum + Number(h.total_earnings), 0) ?? 0;
  const monthlyEarnings = hosts?.reduce((sum, h) => sum + Number(h.monthly_earnings), 0) ?? 0;
  const commission = Number(agency?.commission_rate ?? 10);

  const stats = [
    { label: "Total Hosts", value: hosts?.length ?? 0, icon: Users, color: "text-primary" },
    { label: "Monthly Revenue", value: `$${monthlyEarnings.toFixed(2)}`, icon: TrendingUp, color: "text-accent" },
    { label: "Total Revenue", value: `$${totalEarnings.toFixed(2)}`, icon: DollarSign, color: "text-online" },
    { label: "Commission Rate", value: `${commission}%`, icon: Activity, color: "text-warning" },
  ];

  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No Agency Found</h2>
        <p className="text-muted-foreground text-sm">You don't own an agency yet. Create one from your profile.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">{agency.agency_name}</h1>
        <p className="text-sm text-muted-foreground">Agency Dashboard • Status: <span className={agency.status === "approved" ? "text-online" : "text-warning"}>{agency.status}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold text-foreground mb-3">Recent Hosts</h3>
        {hosts && hosts.length > 0 ? (
          <div className="space-y-3">
            {hosts.slice(0, 5).map((h: any) => (
              <div key={h.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {h.profiles?.avatar_url ? (
                      <img src={h.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{(h.profiles?.display_name ?? "H")[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</p>
                    <p className="text-[10px] text-muted-foreground">Lv.{h.level} • {h.status}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-accent">${Number(h.monthly_earnings).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hosts recruited yet.</p>
        )}
      </div>
    </div>
  );
};

export default AgencyDashboard;
