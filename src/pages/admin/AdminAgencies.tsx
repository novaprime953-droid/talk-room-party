import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building, CheckCircle, XCircle, Plus, Search, Eye, Edit, DollarSign, Users, TrendingUp, UserCog, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

const AdminAgencies = () => {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [description, setDescription] = useState("");
  const [commission, setCommission] = useState("10");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editComm, setEditComm] = useState("");
  const [search, setSearch] = useState("");

  const { data: agencies, refetch } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Get owner profiles for all agencies
  const ownerIds = agencies?.map((a) => a.owner_id) ?? [];
  const { data: ownerProfiles } = useQuery({
    queryKey: ["agency-owner-profiles", ownerIds],
    queryFn: async () => {
      if (ownerIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, email")
        .in("user_id", ownerIds);
      if (error) throw error;
      return data;
    },
    enabled: ownerIds.length > 0,
  });

  // Get host counts per agency
  const agencyIds = agencies?.map((a) => a.id) ?? [];
  const { data: hostCounts } = useQuery({
    queryKey: ["agency-host-counts", agencyIds],
    queryFn: async () => {
      if (agencyIds.length === 0) return {};
      const { data, error } = await supabase
        .from("hosts")
        .select("agency_id")
        .in("agency_id", agencyIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((h) => { if (h.agency_id) counts[h.agency_id] = (counts[h.agency_id] || 0) + 1; });
      return counts;
    },
    enabled: agencyIds.length > 0,
  });

  // Expanded agency hosts
  const { data: expandedHosts } = useQuery({
    queryKey: ["agency-expanded-hosts", expandedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*, profiles!hosts_user_id_fkey(username, display_name, avatar_url)")
        .eq("agency_id", expandedId!)
        .order("total_earnings", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!expandedId,
  });

  const { data: ownerResults } = useQuery({
    queryKey: ["agency-owner-search", ownerSearch],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("user_id, username, display_name").or(`username.ilike.%${ownerSearch}%,display_name.ilike.%${ownerSearch}%`).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: ownerSearch.length >= 2,
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("agencies").update({ status, approved_by: user!.id }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Agency ${status}`); refetch(); }
  };

  const createAgency = async (ownerId: string) => {
    if (!agencyName.trim()) { toast.error("Agency name required"); return; }
    const { error } = await supabase.from("agencies").insert({
      agency_name: agencyName.trim(),
      description: description.trim() || null,
      commission_rate: parseFloat(commission) || 10,
      owner_id: ownerId,
      status: "approved",
      approved_by: user!.id,
    });
    if (error) { toast.error(error.message); return; }
    // Assign agency_owner role
    await supabase.from("user_roles").insert({ user_id: ownerId, role: "agency_owner" as any, granted_by: user!.id });
    toast.success("Agency created!");
    setAgencyName(""); setDescription(""); setOwnerSearch(""); setShowAdd(false); refetch();
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("agencies").update({
      agency_name: editName.trim(),
      description: editDesc.trim() || null,
      commission_rate: parseFloat(editComm) || 10,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Agency updated"); setEditId(null); refetch(); }
  };

  const changeOwner = async (agencyId: string, newOwnerId: string, oldOwnerId: string) => {
    const { error } = await supabase.from("agencies").update({ owner_id: newOwnerId }).eq("id", agencyId);
    if (error) { toast.error(error.message); return; }
    // Grant agency_owner to new, check if old still owns agencies
    await supabase.from("user_roles").insert({ user_id: newOwnerId, role: "agency_owner" as any, granted_by: user!.id });
    const { data: otherAgencies } = await supabase.from("agencies").select("id").eq("owner_id", oldOwnerId);
    if (!otherAgencies || otherAgencies.length === 0) {
      await supabase.from("user_roles").delete().eq("user_id", oldOwnerId).eq("role", "agency_owner");
    }
    toast.success("Owner changed"); refetch();
  };

  const getOwner = (ownerId: string) => ownerProfiles?.find((p) => p.user_id === ownerId);

  const filtered = agencies?.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      const owner = getOwner(a.owner_id);
      return a.agency_name.toLowerCase().includes(s) || (owner?.username?.toLowerCase().includes(s) ?? false) || (owner?.display_name?.toLowerCase().includes(s) ?? false);
    }
    return true;
  });

  const totalEarnings = agencies?.reduce((s, a) => s + Number(a.total_earnings), 0) ?? 0;
  const pendingCount = agencies?.filter((a) => a.status === "pending").length ?? 0;
  const approvedCount = agencies?.filter((a) => a.status === "approved").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Agency Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20">
          <Plus className="w-4 h-4" /> Add Agency
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Building className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Total Agencies</span></div>
          <p className="text-2xl font-bold text-foreground">{agencies?.length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-online" /><span className="text-xs text-muted-foreground">Approved</span></div>
          <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><XCircle className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">Pending</span></div>
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-accent" /><span className="text-xs text-muted-foreground">Total Earnings</span></div>
          <p className="text-2xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Add Agency */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
              <h3 className="font-semibold text-foreground mb-3">Create New Agency</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <Input placeholder="Agency name" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
                <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Input type="number" placeholder="Commission %" value={commission} onChange={(e) => setCommission(e.target.value)} />
              </div>
              <Input placeholder="Search owner by username..." className="mb-3" value={ownerSearch} onChange={(e) => setOwnerSearch(e.target.value)} />
              {ownerResults && ownerResults.length > 0 && (
                <div className="divide-y divide-border/30 rounded-xl border border-border/50 overflow-hidden">
                  {ownerResults.map((p) => (
                    <div key={p.user_id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/10">
                      <p className="text-sm font-semibold text-foreground">{p.display_name ?? p.username}</p>
                      <button onClick={() => createAgency(p.user_id)} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">Create for this user</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search agencies or owners..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agency Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Agency</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Commission</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Hosts</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Earnings</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((a) => {
                const owner = getOwner(a.owner_id);
                const hCount = (hostCounts as Record<string, number>)?.[a.id] ?? 0;
                const isExpanded = expandedId === a.id;
                const isEditing = editId === a.id;

                return (
                  <motion.tr key={a.id} layout className="border-b border-border/30 last:border-0 hover:bg-muted/10 align-top">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs" />
                          <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8 text-xs" placeholder="Description" />
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-foreground">{a.agency_name}</p>
                          <p className="text-[10px] text-muted-foreground">{a.description ?? "No description"}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {owner?.avatar_url ? <img src={owner.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{(owner?.display_name ?? "?")[0]}</span>}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{owner?.display_name ?? owner?.username ?? "Unknown"}</p>
                          <p className="text-[10px] text-muted-foreground">@{owner?.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input type="number" value={editComm} onChange={(e) => setEditComm(e.target.value)} className="h-8 text-xs w-20" />
                      ) : (
                        <span className="text-foreground font-medium">{Number(a.commission_rate)}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-foreground"><Users className="w-3 h-3 text-muted-foreground" />{hCount}</span>
                    </td>
                    <td className="px-4 py-3 text-accent font-bold">${Number(a.total_earnings).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.status === "approved" ? "bg-online/10 text-online" : a.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.status === "pending" && (
                          <>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(a.id, "approved")} className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20" title="Approve"><CheckCircle className="w-3.5 h-3.5" /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(a.id, "rejected")} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Reject"><XCircle className="w-3.5 h-3.5" /></motion.button>
                          </>
                        )}
                        {a.status === "rejected" && (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(a.id, "approved")} className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20" title="Re-approve"><CheckCircle className="w-3.5 h-3.5" /></motion.button>
                        )}
                        {a.status === "approved" && (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(a.id, "rejected")} className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20" title="Suspend"><XCircle className="w-3.5 h-3.5" /></motion.button>
                        )}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setExpandedId(isExpanded ? null : a.id)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="View Hosts"><Eye className="w-3.5 h-3.5" /></motion.button>
                        {isEditing ? (
                          <>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => saveEdit(a.id)} className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20" title="Save"><CheckCircle className="w-3.5 h-3.5" /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50" title="Cancel"><XCircle className="w-3.5 h-3.5" /></motion.button>
                          </>
                        ) : (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditId(a.id); setEditName(a.agency_name); setEditDesc(a.description ?? ""); setEditComm(String(a.commission_rate)); }} className="p-1.5 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50" title="Edit"><Edit className="w-3.5 h-3.5" /></motion.button>
                        )}
                      </div>

                      {/* Expanded: Hosts + Change Owner */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Agency Hosts</p>
                          {expandedHosts && expandedHosts.length > 0 ? (
                            <div className="space-y-1.5">
                              {expandedHosts.map((h: any) => (
                                <div key={h.id} className="flex items-center justify-between text-xs bg-muted/10 rounded-lg px-2 py-1.5">
                                  <span className="font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</span>
                                  <span className="text-accent font-bold">${Number(h.total_earnings).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          ) : <p className="text-[10px] text-muted-foreground">No hosts</p>}
                          
                          <ChangeOwnerWidget agencyId={a.id} currentOwnerId={a.owner_id} onChanged={() => { refetch(); setExpandedId(null); }} userId={user!.id} changeOwner={changeOwner} />
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!filtered || filtered.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No agencies found</p>}
      </div>
    </div>
  );
};

// Sub-component for changing agency owner
const ChangeOwnerWidget = ({ agencyId, currentOwnerId, onChanged, userId, changeOwner }: {
  agencyId: string; currentOwnerId: string; onChanged: () => void; userId: string;
  changeOwner: (agencyId: string, newOwnerId: string, oldOwnerId: string) => Promise<void>;
}) => {
  const [search, setSearch] = useState("");
  const { data: results } = useQuery({
    queryKey: ["change-owner-search", search, agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("user_id, username, display_name")
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
        .neq("user_id", currentOwnerId)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });

  return (
    <div className="mt-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Change Owner</p>
      <Input placeholder="Search new owner..." className="h-7 text-xs mb-1" value={search} onChange={(e) => setSearch(e.target.value)} />
      {results?.map((p) => (
        <div key={p.user_id} className="flex items-center justify-between text-xs bg-muted/10 rounded-lg px-2 py-1.5 mb-1">
          <span className="font-semibold text-foreground">{p.display_name ?? p.username}</span>
          <button onClick={async () => { await changeOwner(agencyId, p.user_id, currentOwnerId); onChanged(); }} className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">Transfer</button>
        </div>
      ))}
    </div>
  );
};

export default AdminAgencies;
