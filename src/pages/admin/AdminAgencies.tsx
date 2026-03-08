import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building, CheckCircle, XCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const AdminAgencies = () => {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [description, setDescription] = useState("");
  const [commission, setCommission] = useState("10");
  const [ownerSearch, setOwnerSearch] = useState("");

  const { data: agencies, refetch } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
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
    const { error } = await supabase.from("agencies").update({ status }).eq("id", id);
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
    });
    if (error) toast.error(error.message);
    else {
      // Also assign agency_owner role
      await supabase.from("user_roles").insert({ user_id: ownerId, role: "agency_owner" as any, granted_by: user!.id }).then(() => {});
      toast.success("Agency created!");
      setAgencyName(""); setDescription(""); setOwnerSearch(""); setShowAdd(false); refetch();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Agency Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20">
          <Plus className="w-4 h-4" /> Add Agency
        </button>
      </div>

      {showAdd && (
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
      )}

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Agency</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Commission</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Earnings</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies?.map((a) => (
                <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{a.agency_name}</p>
                    <p className="text-[10px] text-muted-foreground">{a.description ?? "No description"}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">{Number(a.commission_rate)}%</td>
                  <td className="px-4 py-3 text-accent font-bold">${Number(a.total_earnings).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.status === "approved" ? "bg-online/10 text-online" : a.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === "pending" && (
                      <div className="flex gap-1">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(a.id, "approved")} className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20"><CheckCircle className="w-3.5 h-3.5" /></motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(a.id, "rejected")} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><XCircle className="w-3.5 h-3.5" /></motion.button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!agencies || agencies.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No agencies found</p>}
      </div>
    </div>
  );
};

export default AdminAgencies;
