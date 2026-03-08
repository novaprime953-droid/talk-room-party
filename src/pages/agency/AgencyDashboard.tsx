import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, DollarSign, TrendingUp, Activity, Calendar, ArrowUpRight, Gift } from "lucide-react";

const AgencyDashboard = () => {
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
    queryKey: ["agency-hosts", agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*, profiles!hosts_user_id_fkey(username, display_name, avatar_url, is_online)")
        .eq("agency_id", agency!.id)
        .order("total_earnings", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  // Recent gift transactions for agency hosts
  const hostUserIds = hosts?.map((h) => h.user_id) ?? [];
  const { data: recentGifts } = useQuery({
    queryKey: ["agency-recent-gifts", hostUserIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("*, gifts(gift_name, coin_value)")
        .in("receiver_id", hostUserIds)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: hostUserIds.length > 0,
  });

  const totalEarnings = hosts?.reduce((sum, h) => sum + Number(h.total_earnings), 0) ?? 0;
  const monthlyEarnings = hosts?.reduce((sum, h) => sum + Number(h.monthly_earnings), 0) ?? 0;
  const commission = Number(agency?.commission_rate ?? 10);
  const agencyEarnings = Number(agency?.total_earnings ?? 0);
  const activeHosts = hosts?.filter((h) => h.status === "active").length ?? 0;
  const onlineHosts = hosts?.filter((h: any) => h.profiles?.is_online).length ?? 0;

  const stats = [
    { label: "Agency Earnings", value: `$${agencyEarnings.toFixed(2)}`, icon: DollarSign, color: "text-accent" },
    { label: "Monthly Revenue", value: `$${monthlyEarnings.toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
    { label: "Total Hosts", value: `${hosts?.length ?? 0}`, sub: `${activeHosts} active`, icon: Users, color: "text-online" },
    { label: "Commission Rate", value: `${commission}%`, sub: `$${(totalEarnings * commission / 100).toFixed(2)} earned`, icon: Activity, color: "text-warning" },
  ];

  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No Agency Found</h2>
        <p className="text-muted-foreground text-sm">You don't own an agency yet. Contact an admin to create one.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">{agency.agency_name}</h1>
        <p className="text-sm text-muted-foreground">
          Agency Dashboard • Status: <span className={agency.status === "approved" ? "text-online" : "text-warning"}>{agency.status}</span>
          {onlineHosts > 0 && <> • <span className="text-online">{onlineHosts} online</span></>}
        </p>
      </div>

      {agency.status === "pending" && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-warning">⏳ Your agency is pending approval. Some features may be limited.</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            {(s as any).sub && <p className="text-[10px] text-muted-foreground mt-0.5">{(s as any).sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Hosts */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Top Hosts</h3>
            <span className="text-[10px] text-muted-foreground">{hosts?.length ?? 0} total</span>
          </div>
          {hosts && hosts.length > 0 ? (
            <div className="space-y-3">
              {hosts.slice(0, 8).map((h: any, i: number) => (
                <div key={h.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {h.profiles?.avatar_url ? <img src={h.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(h.profiles?.display_name ?? "H")[0]}</span>}
                      </div>
                      {h.profiles?.is_online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-online rounded-full border-2 border-card" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</p>
                      <p className="text-[10px] text-muted-foreground">Lv.{h.level} • {h.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">${Number(h.monthly_earnings).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">${Number(h.total_earnings).toFixed(2)} total</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No hosts recruited yet.</p>}
        </div>

        {/* Recent Gift Income */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Recent Gift Income</h3>
            <Gift className="w-4 h-4 text-accent" />
          </div>
          {recentGifts && recentGifts.length > 0 ? (
            <div className="space-y-2.5">
              {recentGifts.map((g: any) => {
                const host = hosts?.find((h) => h.user_id === g.receiver_id);
                return (
                  <div key={g.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{(host as any)?.profiles?.display_name ?? "Host"}</p>
                      <p className="text-[10px] text-muted-foreground">{g.gifts?.gift_name} × {g.quantity}</p>
                    </div>
                    <span className="text-accent font-bold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {g.coins_spent}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-muted-foreground">No recent gifts</p>}
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;
