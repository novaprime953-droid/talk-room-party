import { useState } from "react";
import { Search, Hash, CheckCircle, AlertTriangle, History } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

const OwnerUserIds = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { data: users, refetch } = useAdminUsers(search || undefined);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newId, setNewId] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: history } = useQuery({
    queryKey: ["id-change-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("id_change_history").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const checkAvailability = async () => {
    const num = parseInt(newId);
    if (!num || num < 1) { toast.error("Enter a valid numeric ID"); return; }
    setChecking(true);
    const { data } = await supabase.from("profiles").select("user_id").eq("user_id_number", num).maybeSingle();
    setAvailable(!data);
    setChecking(false);
  };

  const updateUserId = async () => {
    if (!editingUser || !newId || available !== true) return;
    const num = parseInt(newId);
    const oldId = editingUser.user_id_number;

    // Update profile
    const { error } = await supabase.from("profiles").update({ user_id_number: num }).eq("user_id", editingUser.user_id);
    if (error) { toast.error(error.message); return; }

    // Log history
    await supabase.from("id_change_history").insert({
      user_id: editingUser.user_id,
      old_id: oldId || 0,
      new_id: num,
      changed_by: user!.id,
    });

    toast.success(`ID updated: ${oldId} → ${num}`);
    setEditingUser(null); setNewId(""); setAvailable(null);
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display font-bold text-2xl text-foreground">User ID Management</h1>
        <button onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-xs font-bold text-muted-foreground">
          <History className="w-3.5 h-3.5" /> History
        </button>
      </div>

      {showHistory ? (
        <div className="space-y-2 mb-6">
          <h2 className="font-bold text-sm text-foreground mb-3">ID Change History</h2>
          {history?.map((h: any) => (
            <div key={h.id} className="bg-card rounded-xl p-3 shadow-card border border-border/30 flex items-center gap-3">
              <Hash className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">{h.old_id} → {h.new_id}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {(!history || history.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No ID changes yet</p>}
        </div>
      ) : (
        <>
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning">Changing a user's ID will affect their identity across the platform. Only numeric values are allowed.</p>
          </div>

          <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-2.5 mb-4 border border-border/50">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </div>

          <div className="space-y-2">
            {users?.map((u: any) => (
              <div key={u.id} className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-foreground">{(u.display_name ?? "U")[0]}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{u.display_name ?? u.username}</p>
                    <p className="text-[10px] text-muted-foreground">Current ID: <span className="text-primary font-bold">{u.user_id_number ?? "Not set"}</span></p>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingUser(u); setNewId(""); setAvailable(null); }}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold">
                    <Hash className="w-3 h-3 inline mr-1" />Edit ID
                  </motion.button>
                </div>

                {editingUser?.user_id === u.user_id && (
                  <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                    <div className="flex gap-2">
                      <Input type="number" value={newId} onChange={(e) => { setNewId(e.target.value); setAvailable(null); }}
                        placeholder="Enter new numeric ID" className="h-9 text-xs" min="1" />
                      <button onClick={checkAvailability} disabled={checking}
                        className="px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-bold whitespace-nowrap">
                        {checking ? "..." : "Check"}
                      </button>
                    </div>
                    {available === true && (
                      <div className="flex items-center gap-1 text-online text-xs"><CheckCircle className="w-3 h-3" /> ID is available!</div>
                    )}
                    {available === false && (
                      <div className="flex items-center gap-1 text-destructive text-xs"><AlertTriangle className="w-3 h-3" /> ID already taken</div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingUser(null); setNewId(""); setAvailable(null); }}
                        className="flex-1 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground">Cancel</button>
                      <button onClick={updateUserId} disabled={available !== true}
                        className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold disabled:opacity-50">Update ID</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {(!users || users.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No users found</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default OwnerUserIds;
