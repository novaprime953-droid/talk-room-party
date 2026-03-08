import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, TrendingUp, UserMinus, Search, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AgencyHosts = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"earnings" | "level" | "name">("earnings");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedHost, setExpandedHost] = useState<string | null>(null);

  const { data: agency } = useQuery({
    queryKey: ["my-agency"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("*").eq("owner_id", user!.id).maybeSingle();
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
        .select("*, profiles!hosts_user_id_fkey(username, display_name, avatar_url, email, is_online, level, coins_balance)")
        .eq("agency_id", agency!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  // Gift history for expanded host
  const { data: hostGifts } = useQuery({
    queryKey: ["host-gifts", expandedHost],
    queryFn: async () => {
      const host = hosts?.find((h) => h.id === expandedHost);
      if (!host) return [];
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("*, gifts(gift_name, coin_value)")
        .eq("receiver_id", host.user_id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!expandedHost,
  });

  const removeHost = async (hostId: string) => {
    if (!confirm("Remove this host from your agency?")) return;
    const { error } = await supabase.from("hosts").update({ agency_id: null }).eq("id", hostId);
    if (error) toast.error(error.message);
    else { toast.success("Host removed from agency"); refetch(); }
  };

  const updateHostStatus = async (hostId: string, status: string) => {
    const { error } = await supabase.from("hosts").update({ status }).eq("id", hostId);
    if (error) toast.error(error.message);
    else { toast.success(`Host ${status}`); refetch(); }
  };

  const sorted = hosts?.filter((h: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return h.profiles?.display_name?.toLowerCase().includes(s) || h.profiles?.username?.toLowerCase().includes(s);
  }).sort((a: any, b: any) => {
    let cmp = 0;
    if (sortBy === "earnings") cmp = Number(b.total_earnings) - Number(a.total_earnings);
    else if (sortBy === "level") cmp = b.level - a.level;
    else cmp = (a.profiles?.display_name ?? "").localeCompare(b.profiles?.display_name ?? "");
    return sortAsc ? -cmp : cmp;
  });

  const commRate = Number(agency?.commission_rate ?? 10) / 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Manage Hosts</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{hosts?.length ?? 0} hosts</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-lg font-bold text-online">{hosts?.filter((h) => h.status === "active").length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Online Now</p>
          <p className="text-lg font-bold text-primary">{hosts?.filter((h: any) => h.profiles?.is_online).length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Your Commission</p>
          <p className="text-lg font-bold text-accent">${(hosts?.reduce((s, h) => s + Number(h.total_earnings), 0) ?? 0 * commRate).toFixed(2)}</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search hosts..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["earnings", "level", "name"] as const).map((s) => (
            <button key={s} onClick={() => { if (sortBy === s) setSortAsc(!sortAsc); else { setSortBy(s); setSortAsc(false); } }}
              className={`px-2.5 py-2 rounded-xl text-[10px] font-bold flex items-center gap-0.5 ${sortBy === s ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {sortBy === s && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
            </button>
          ))}
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
              {sorted?.map((h: any) => (
                <>
                  <tr key={h.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {h.profiles?.avatar_url ? <img src={h.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(h.profiles?.display_name ?? "H")[0]}</span>}
                          </div>
                          {h.profiles?.is_online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-online rounded-full border-2 border-card" />}
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
                      <button onClick={() => updateHostStatus(h.id, h.status === "active" ? "inactive" : "active")}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer ${h.status === "active" ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"}`}>
                        {h.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setExpandedHost(expandedHost === h.id ? null : h.id)}
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeHost(h.id)}
                          className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Remove">
                          <UserMinus className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                  {expandedHost === h.id && (
                    <tr key={`${h.id}-detail`}>
                      <td colSpan={6} className="px-4 py-3 bg-muted/5">
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Your Cut</p>
                            <p className="text-sm font-bold text-primary">${(Number(h.total_earnings) * commRate).toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Monthly Cut</p>
                            <p className="text-sm font-bold text-accent">${(Number(h.monthly_earnings) * commRate).toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Joined</p>
                            <p className="text-sm font-medium text-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Recent Gifts Received</p>
                        {hostGifts && hostGifts.length > 0 ? (
                          <div className="space-y-1">
                            {hostGifts.map((g: any) => (
                              <div key={g.id} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{g.gifts?.gift_name} × {g.quantity}</span>
                                <span className="text-accent font-bold">{g.coins_spent} coins</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-[10px] text-muted-foreground">No recent gifts</p>}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {(!sorted || sorted.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No hosts in your agency</p>}
      </div>
    </div>
  );
};

export default AgencyHosts;
