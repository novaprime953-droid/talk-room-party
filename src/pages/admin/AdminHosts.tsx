import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mic, TrendingUp, Plus, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AdminHosts = () => {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [hostSearch, setHostSearch] = useState("");

  const { data: hosts, isLoading, refetch } = useQuery({
    queryKey: ["admin-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*, profiles!hosts_user_id_fkey(username, display_name, avatar_url, email), agencies(agency_name)")
        .order("total_earnings", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: searchResults } = useQuery({
    queryKey: ["host-add-search", hostSearch],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .or(`username.ilike.%${hostSearch}%,display_name.ilike.%${hostSearch}%`).limit(10);
      if (error) throw error;
      return data;
    },
    enabled: hostSearch.length >= 2,
  });

  const addHost = async (userId: string, name: string) => {
    const { data: existing } = await supabase.from("hosts").select("id").eq("user_id", userId).maybeSingle();
    if (existing) { toast.error("Already a host"); return; }
    const { error } = await supabase.from("hosts").insert({ user_id: userId });
    if (error) { toast.error(error.message); return; }
    // Also add host role
    await supabase.from("user_roles").insert({ user_id: userId, role: "host" as any, granted_by: user!.id });
    toast.success(`${name} is now a host!`);
    setHostSearch(""); setShowAdd(false); refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Host Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20">
          <Plus className="w-4 h-4" /> Add Host
        </button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
          <h3 className="font-semibold text-foreground mb-3">Add New Host</h3>
          <Input placeholder="Search user by username..." value={hostSearch} onChange={(e) => setHostSearch(e.target.value)} />
          {searchResults && searchResults.length > 0 && (
            <div className="divide-y divide-border/30 rounded-xl border border-border/50 overflow-hidden mt-3">
              {searchResults.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{(p.display_name ?? "U")[0]}</span>}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{p.display_name ?? p.username}</p>
                  </div>
                  <button onClick={() => addHost(p.user_id, p.display_name ?? p.username ?? "User")}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                    <UserPlus className="w-3 h-3" /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                        {h.profiles?.avatar_url ? <img src={h.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(h.profiles?.display_name ?? "H").charAt(0)}</span>}
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${h.status === "active" ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"}`}>{h.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>}
        {!isLoading && (!hosts || hosts.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No hosts registered</p>}
      </div>
    </div>
  );
};

export default AdminHosts;
