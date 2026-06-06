import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CreditCard, CheckCircle, XCircle, Search, DollarSign, TrendingUp,
  Clock, Eye, RefreshCw, ChevronDown, ChevronUp, Coins
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const AdminRecharge = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: requests, refetch } = useQuery({
    queryKey: ["admin-recharges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recharge_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Get user profiles for all requests
  const userIds = [...new Set(requests?.map((r) => r.user_id) ?? [])];
  const { data: profiles } = useQuery({
    queryKey: ["recharge-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase.from("profiles")
        .select("user_id, username, display_name, avatar_url, coins_balance")
        .in("user_id", userIds);
      if (error) throw error;
      return data;
    },
    enabled: userIds.length > 0,
  });

  const getProfile = (uid: string) => profiles?.find((p) => p.user_id === uid);

  const updateStatus = async (id: string, status: string, _userId: string, _coinsAmount: number) => {
    if (status === "approved") {
      const { error } = await supabase.rpc("approve_recharge", { p_request_id: id });
      if (error) { toast.error(error.message); return; }
    } else if (status === "rejected") {
      const { error } = await supabase.rpc("reject_recharge", { p_request_id: id });
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`Request ${status}`);
    refetch();
  };

  const filtered = requests?.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search) {
      const p = getProfile(r.user_id);
      const s = search.toLowerCase();
      return p?.username?.toLowerCase().includes(s) || p?.display_name?.toLowerCase().includes(s) || r.payment_reference?.toLowerCase().includes(s) || r.payment_method.toLowerCase().includes(s);
    }
    return true;
  });

  const pendingCount = requests?.filter((r) => r.status === "pending").length ?? 0;
  const totalApproved = requests?.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.amount), 0) ?? 0;
  const totalCoins = requests?.filter((r) => r.status === "approved").reduce((s, r) => s + r.coins_amount, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Recharge Management</h1>
        <button onClick={() => refetch()} className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Total Requests</span></div>
          <p className="text-2xl font-bold text-foreground">{requests?.length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">Pending</span></div>
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-accent" /><span className="text-xs text-muted-foreground">Revenue</span></div>
          <p className="text-2xl font-bold text-foreground">${totalApproved.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Coins className="w-4 h-4 text-online" /><span className="text-xs text-muted-foreground">Coins Distributed</span></div>
          <p className="text-2xl font-bold text-foreground">{totalCoins.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by user, method, reference..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-bold ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && <span className="ml-1 bg-warning text-warning-foreground px-1.5 rounded-full text-[10px]">{pendingCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Coins</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Method</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((r) => {
                const p = getProfile(r.user_id);
                return (
                  <>
                    <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{(p?.display_name ?? "?")[0]}</span>}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{p?.display_name ?? p?.username ?? "Unknown"}</p>
                            <p className="text-[10px] text-muted-foreground">Bal: {p?.coins_balance?.toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">${Number(r.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-accent font-bold">{r.coins_amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-bold">{r.payment_method}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{r.payment_reference ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === "approved" ? "bg-online/10 text-online" : r.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {r.status === "pending" && (
                            <>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(r.id, "approved", r.user_id, r.coins_amount)}
                                className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20" title="Approve">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(r.id, "rejected", r.user_id, r.coins_amount)}
                                className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Reject">
                                <XCircle className="w-3.5 h-3.5" />
                              </motion.button>
                            </>
                          )}
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="Details">
                            <Eye className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={8} className="px-4 py-3 bg-muted/5">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div><p className="text-[10px] text-muted-foreground">Request ID</p><p className="text-xs font-mono text-foreground">{r.id}</p></div>
                            <div><p className="text-[10px] text-muted-foreground">Payment Method</p><p className="text-xs font-semibold text-foreground">{r.payment_method}</p></div>
                            <div><p className="text-[10px] text-muted-foreground">Payment Ref</p><p className="text-xs font-mono text-foreground">{r.payment_reference ?? "None"}</p></div>
                            <div><p className="text-[10px] text-muted-foreground">Processed By</p><p className="text-xs text-foreground">{r.processed_by ? r.processed_by.slice(0, 8) + "..." : "Not yet"}</p></div>
                            <div><p className="text-[10px] text-muted-foreground">Created</p><p className="text-xs text-foreground">{new Date(r.created_at).toLocaleString()}</p></div>
                            <div><p className="text-[10px] text-muted-foreground">Updated</p><p className="text-xs text-foreground">{new Date(r.updated_at).toLocaleString()}</p></div>
                            <div><p className="text-[10px] text-muted-foreground">Rate</p><p className="text-xs text-foreground">{(r.coins_amount / Number(r.amount)).toFixed(0)} coins/$</p></div>
                            <div><p className="text-[10px] text-muted-foreground">User Balance</p><p className="text-xs font-bold text-accent">{p?.coins_balance?.toLocaleString() ?? 0} coins</p></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!filtered || filtered.length === 0) && <EmptyState icon={CreditCard} title="No Data Available" subtitle="Recharge records will appear here once users submit requests" />}
      </div>
    </div>
  );
};

export default AdminRecharge;
