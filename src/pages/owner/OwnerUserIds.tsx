import { useState } from "react";
import { Search, Hash, CheckCircle, AlertTriangle, History, User, ArrowRight, Shield, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type ViewMode = "search" | "history";

const OwnerUserIds = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newId, setNewId] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [updating, setUpdating] = useState(false);

  // Search users by numeric ID or name
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["id-mgmt-search", searchQuery],
    queryFn: async () => {
      const q = searchQuery.trim();
      if (!q) return [];
      const isNumeric = /^\d+$/.test(q);
      const { data, error } = isNumeric
        ? await supabase.from("profiles")
            .select("user_id, display_name, username, avatar_url, user_id_number, level, vip_level, email")
            .eq("user_id_number", parseInt(q)).limit(20)
        : await supabase.from("profiles")
            .select("user_id, display_name, username, avatar_url, user_id_number, level, vip_level, email")
            .or(`username.ilike.%${q}%,display_name.ilike.%${q}%,email.ilike.%${q}%`)
            .order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: searchQuery.trim().length >= 1,
  });

  // ID change history
  const { data: history } = useQuery({
    queryKey: ["id-change-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("id_change_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: viewMode === "history",
  });

  const checkAvailability = async () => {
    const num = parseInt(newId);
    if (!num || num < 1 || newId.length > 10) {
      toast.error("Enter a valid numeric ID (1-10 digits)");
      return;
    }
    setChecking(true);
    const { data } = await supabase.from("profiles").select("user_id").eq("user_id_number", num).maybeSingle();
    setAvailable(!data);
    setChecking(false);
  };

  const updateUserId = async () => {
    if (!editingUser || !newId || available !== true) return;
    setUpdating(true);
    const num = parseInt(newId);
    const oldId = editingUser.user_id_number;

    const { error } = await supabase.from("profiles").update({ user_id_number: num }).eq("user_id", editingUser.user_id);
    if (error) { toast.error(error.message); setUpdating(false); return; }

    await supabase.from("id_change_history").insert({
      user_id: editingUser.user_id,
      old_id: oldId || 0,
      new_id: num,
      changed_by: user!.id,
    });

    toast.success(`ID updated: ${oldId ?? "none"} → ${num}`);
    setEditingUser(null);
    setNewId("");
    setAvailable(null);
    setUpdating(false);
    queryClient.invalidateQueries({ queryKey: ["id-mgmt-search"] });
    queryClient.invalidateQueries({ queryKey: ["id-change-history"] });
  };

  const copyId = (id: number) => {
    navigator.clipboard.writeText(String(id));
    toast.success("ID copied");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> User ID Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Search, view, and assign custom numeric IDs</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-muted/20 rounded-xl p-1">
        <button onClick={() => setViewMode("search")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            viewMode === "search" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}>
          <Search className="w-3.5 h-3.5" /> Search & Edit
        </button>
        <button onClick={() => setViewMode("history")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            viewMode === "history" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}>
          <History className="w-3.5 h-3.5" /> Change History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "search" ? (
          <motion.div key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-3 border border-border/50 shadow-sm mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by numeric ID, name, or email..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-muted-foreground text-xs">✕</button>
              )}
            </div>

            {/* Info Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              <Hash className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Each user has a unique <span className="text-primary font-semibold">numeric ID</span> (1-10 digits). 
                Search by ID number, display name, or email to find and edit user IDs.
              </p>
            </div>

            {/* Results */}
            {searching && <p className="text-center text-muted-foreground text-xs py-6">Searching...</p>}

            {searchQuery.trim().length > 0 && !searching && searchResults?.length === 0 && (
              <div className="text-center py-10">
                <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No users found</p>
                <p className="text-[10px] text-muted-foreground/60">Try a different ID or name</p>
              </div>
            )}

            {!searchQuery.trim() && (
              <div className="text-center py-10">
                <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Enter a numeric ID or name to search</p>
              </div>
            )}

            <div className="space-y-2">
              {searchResults?.map((u: any) => (
                <motion.div key={u.user_id} layout
                  className="bg-card rounded-2xl border border-border/30 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-11 h-11 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden ring-2 ring-border/30">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <User className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{u.display_name ?? u.username ?? "Unknown"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-md">
                          <Hash className="w-2.5 h-2.5" />{u.user_id_number ?? "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Lv.{u.level}</span>
                        {u.vip_level > 0 && <span className="text-[10px] text-accent font-bold">VIP {u.vip_level}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {u.user_id_number && (
                        <button onClick={() => copyId(u.user_id_number)} className="p-1.5 rounded-lg hover:bg-muted/30">
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => { setEditingUser(editingUser?.user_id === u.user_id ? null : u); setNewId(""); setAvailable(null); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          editingUser?.user_id === u.user_id
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}>
                        {editingUser?.user_id === u.user_id ? "Close" : "Edit ID"}
                      </motion.button>
                    </div>
                  </div>

                  {/* Edit Panel */}
                  <AnimatePresence>
                    {editingUser?.user_id === u.user_id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-border/20 space-y-3">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Current: <span className="font-bold text-foreground">{u.user_id_number ?? "Not set"}</span></span>
                            <ArrowRight className="w-3 h-3" />
                            <span>New: <span className="font-bold text-primary">{newId || "..."}</span></span>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={newId}
                              onChange={(e) => { setNewId(e.target.value.slice(0, 10)); setAvailable(null); }}
                              placeholder="Enter new numeric ID"
                              className="h-10 text-sm"
                              min="1"
                            />
                            <button onClick={checkAvailability} disabled={checking || !newId}
                              className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold whitespace-nowrap disabled:opacity-50">
                              {checking ? "..." : "Check"}
                            </button>
                          </div>
                          {available === true && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="flex items-center gap-1.5 text-green-400 text-xs bg-green-400/10 rounded-lg px-3 py-2">
                              <CheckCircle className="w-3.5 h-3.5" /> This ID is available!
                            </motion.div>
                          )}
                          {available === false && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="flex items-center gap-1.5 text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2">
                              <AlertTriangle className="w-3.5 h-3.5" /> This ID is already taken
                            </motion.div>
                          )}
                          <button onClick={updateUserId} disabled={available !== true || updating}
                            className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-opacity">
                            {updating ? "Updating..." : "Confirm ID Change"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="space-y-2">
              {history?.map((h: any) => (
                <div key={h.id} className="bg-card rounded-xl p-3.5 border border-border/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className="text-muted-foreground">{h.old_id}</span>
                      <ArrowRight className="w-3 h-3 text-primary" />
                      <span className="text-primary">{h.new_id}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(h.created_at).toLocaleDateString()} · {new Date(h.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!history || history.length === 0) && (
                <div className="text-center py-10">
                  <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No ID changes yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OwnerUserIds;
