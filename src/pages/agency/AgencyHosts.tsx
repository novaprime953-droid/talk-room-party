import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, TrendingUp, UserMinus } from "lucide-react";
import { toast } from "sonner";

const AgencyHosts = () => {
  const { user } = useAuth();

  const { data: agency } = useQuery({
    queryKey: ["my-agency"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("id").eq("owner_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: hosts, refetch } = useQuery({
    queryKey: ["agency-hosts-full", agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*, profiles!hosts_user_id_fkey(username, display_name, avatar_url, email)")
        .eq("agency_id", agency!.id)
        .order("total_earnings", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  const removeHost = async (hostId: string) => {
    const { error } = await supabase.from("hosts").update({ agency_id: null }).eq("id", hostId);
    if (error) toast.error(error.message);
    else { toast.success("Host removed from agency"); refetch(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Manage Hosts</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{hosts?.length ?? 0} hosts</span>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Monthly</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hosts?.map((h: any) => (
                <tr key={h.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {h.profiles?.avatar_url ? (
                          <img src={h.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{(h.profiles?.display_name ?? "H")[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</p>
                        <p className="text-[10px] text-muted-foreground">{h.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">Lv.{h.level}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-accent">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-bold">${Number(h.monthly_earnings).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">${Number(h.total_earnings).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      h.status === "active" ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"
                    }`}>{h.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeHost(h.id)}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                      title="Remove from agency"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!hosts || hosts.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No hosts in your agency</p>
        )}
      </div>
    </div>
  );
};

export default AgencyHosts;
