import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Plus, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const adminRoles: AppRole[] = ["super_admin", "admin", "manager", "business_dev", "coins_seller", "agency_owner"];

const OwnerAdmins = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");

  const { data: admins, refetch } = useQuery({
    queryKey: ["owner-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*, profiles:user_id(user_id, username, display_name, email, avatar_url)")
        .in("role", ["owner", "super_admin", "admin", "manager", "business_dev", "coins_seller", "agency_owner"])
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

  const removeRole = async (roleId: string, role: string) => {
    if (role === "owner") { toast.error("Cannot remove owner role"); return; }
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) toast.error(error.message);
    else { toast.success("Role removed"); refetch(); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Admin Management</h1>

      {/* Add role section */}
      <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Assign Role
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <Input placeholder="Search user by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as AppRole)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm"
          >
            {adminRoles.map((r) => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        {searchResults && searchResults.length > 0 && (
          <div className="divide-y divide-border/30 rounded-xl border border-border/50 overflow-hidden">
            {searchResults.map((p) => (
              <div key={p.user_id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{(p.display_name ?? "U")[0]}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.display_name ?? p.username}</p>
                    <p className="text-[10px] text-muted-foreground">{p.email}</p>
                  </div>
                </div>
                <button onClick={() => addRole(p.user_id)} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20">
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current admins */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Current Roles ({admins?.length ?? 0})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Since</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins?.map((a: any) => (
                <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {a.role === "owner" && <Crown className="w-3.5 h-3.5 text-warning" />}
                      <div>
                        <p className="font-semibold text-foreground">{a.profiles?.display_name ?? a.profiles?.username ?? "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground">{a.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      a.role === "owner" ? "bg-warning/10 text-warning"
                        : a.role === "super_admin" ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}>{a.role}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {a.role !== "owner" && (
                      <button onClick={() => removeRole(a.id, a.role)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerAdmins;
