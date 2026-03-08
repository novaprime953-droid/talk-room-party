import { useState } from "react";
import { Search, Ban, Shield } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const { data: users, refetch } = useAdminUsers(search || undefined);

  const handleBan = async (userId: string, username: string) => {
    if (!confirm(`Ban user ${username}?`)) return;
    const { error } = await supabase.from("bans").insert({
      user_id: userId,
      banned_by: (await supabase.auth.getUser()).data.user!.id,
      reason: "Admin action",
    });
    if (error) toast.error(error.message);
    else toast.success(`${username} has been banned`);
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">User Management</h1>

      <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-2.5 mb-6 border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, name, or email..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Coins</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Roles</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u: any) => (
                <tr key={u.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{(u.display_name ?? "U").charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{u.display_name ?? u.username}</p>
                        <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-foreground">Lv.{u.level}</td>
                  <td className="px-4 py-3 text-accent font-bold">{u.coins_balance?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.user_roles?.map((r: any) => (
                        <span key={r.role} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                          {r.role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleBan(u.user_id, u.username)}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Ban user"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!users || users.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
