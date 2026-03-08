import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Plus, Trash2, Crown, Edit, UserPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Database } from "@/integrations/supabase/types";
import { motion } from "framer-motion";

type AppRole = Database["public"]["Enums"]["app_role"];

const adminRoles: AppRole[] = ["super_admin", "admin", "manager", "business_dev", "coins_seller", "agency_owner", "host"];

const OwnerAdmins = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("admin");
  const [tab, setTab] = useState<"all" | "create">("all");

  const { data: admins, refetch } = useQuery({
    queryKey: ["owner-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*, profiles:user_id(user_id, username, display_name, email, avatar_url)")
        .in("role", ["owner", "super_admin", "admin", "manager", "business_dev", "coins_seller", "agency_owner", "host"])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: searchResults } = useQuery({
    queryKey: ["owner-search-users", search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, email, avatar_url")
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });

  const addRole = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: selectedRole,
      granted_by: user!.id,
    });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("User already has this role");
      else toast.error(error.message);
    } else {
      toast.success(`Role "${selectedRole}" assigned!`);
      refetch();
      setSearch("");
    }
  };

  const removeRole = async (roleId: string, role: string, userName: string) => {
    if (role === "owner") { toast.error("Cannot remove owner role"); return; }
    if (!confirm(`Remove "${role}" role from ${userName}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) toast.error(error.message);
    else { toast.success("Role removed"); refetch(); }
  };

  const removeAllRoles = async (userId: string, userName: string) => {
    if (!confirm(`Remove ALL admin roles from ${userName}? They will keep the "user" role.`)) return;
    const { error } = await supabase.from("user_roles").delete()
      .eq("user_id", userId)
      .neq("role", "owner")
      .neq("role", "user");
    if (error) toast.error(error.message);
    else { toast.success(`All admin roles removed from ${userName}`); refetch(); }
  };

  const updateRole = async (roleId: string, oldRole: string) => {
    if (oldRole === "owner") { toast.error("Cannot change owner role"); return; }
    const { error } = await supabase.from("user_roles").update({ role: editRole }).eq("id", roleId);
    if (error) toast.error(error.message);
    else { toast.success("Role updated"); setEditingId(null); refetch(); }
  };

  // Group admins by user
  const groupedAdmins = admins?.reduce((acc: any, a: any) => {
    const uid = a.profiles?.user_id;
    if (!uid) return acc;
    if (!acc[uid]) acc[uid] = { profile: a.profiles, roles: [] };
    acc[uid].roles.push({ id: a.id, role: a.role, created_at: a.created_at });
    return acc;
  }, {} as Record<string, any>) ?? {};

  const tabs = [
    { key: "all", label: "All Admins" },
    { key: "create", label: "Create Admin" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Admin Management</h1>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "create" && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" /> Create Admin / Assign Role
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <Input placeholder="Search user by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as AppRole)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm"
            >
              {adminRoles.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          {searchResults && searchResults.length > 0 && (
            <div className="divide-y divide-border/30 rounded-xl border border-border/50 overflow-hidden">
              {searchResults.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(p.display_name ?? "U")[0]}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.display_name ?? p.username}</p>
                      <p className="text-[10px] text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                  <button onClick={() => addRole(p.user_id)} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
                    Assign {selectedRole.replace(/_/g, " ")}
                  </button>
                </div>
              ))}
            </div>
          )}
          {search.length >= 2 && (!searchResults || searchResults.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
          )}
        </div>
      )}

      {tab === "all" && (
        <div className="space-y-3">
          {Object.entries(groupedAdmins).map(([uid, data]: [string, any]) => (
            <div key={uid} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {data.profile.avatar_url ? <img src={data.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{(data.profile.display_name ?? "U")[0]}</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {data.roles.some((r: any) => r.role === "owner") && <Crown className="w-4 h-4 text-warning" />}
                      <p className="font-semibold text-foreground">{data.profile.display_name ?? data.profile.username}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{data.profile.email}</p>
                  </div>
                </div>
                {!data.roles.some((r: any) => r.role === "owner") && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeAllRoles(uid, data.profile.display_name ?? data.profile.username)}
                    className="px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20"
                  >
                    Remove All Roles
                  </motion.button>
                )}
              </div>
              <div className="px-4 py-2 space-y-1">
                {data.roles.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      {editingId === r.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as AppRole)}
                          className="px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs"
                        >
                          {adminRoles.map((ar) => <option key={ar} value={ar}>{ar.replace(/_/g, " ")}</option>)}
                        </select>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          r.role === "owner" ? "bg-warning/10 text-warning"
                            : r.role === "super_admin" ? "bg-destructive/10 text-destructive"
                            : r.role === "admin" ? "bg-primary/10 text-primary"
                            : "bg-muted/30 text-muted-foreground"
                        }`}>{r.role.replace(/_/g, " ")}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">since {new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.role !== "owner" && (
                      <div className="flex gap-1">
                        {editingId === r.id ? (
                          <>
                            <button onClick={() => updateRole(r.id, r.role)} className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold">Save</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[10px] font-bold">Cancel</button>
                          </>
                        ) : (
                          <>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setEditingId(r.id); setEditRole(r.role); }}
                              className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="Edit role">
                              <Edit className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeRole(r.id, r.role, data.profile.display_name ?? "User")}
                              className="p-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Remove role">
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(groupedAdmins).length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No admin roles assigned yet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerAdmins;
