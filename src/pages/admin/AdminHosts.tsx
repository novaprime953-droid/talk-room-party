import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mic, TrendingUp } from "lucide-react";

const AdminHosts = () => {
  const { data: hosts, isLoading } = useQuery({
    queryKey: ["admin-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*, profiles!hosts_user_id_fkey(username, display_name, avatar_url, email), agencies(agency_name)")
        .order("total_earnings", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Host Management</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mic className="w-4 h-4" />
          <span>{hosts?.length ?? 0} hosts</span>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Agency</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Monthly</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {hosts?.map((h: any) => (
                <tr key={h.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                        {h.profiles?.avatar_url ? (
                          <img src={h.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{(h.profiles?.display_name ?? "H").charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</p>
                        <p className="text-[10px] text-muted-foreground">{h.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{h.agencies?.agency_name ?? "Independent"}</td>
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
                    }`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>}
        {!isLoading && (!hosts || hosts.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No hosts registered</p>
        )}
      </div>
    </div>
  );
};

export default AdminHosts;
