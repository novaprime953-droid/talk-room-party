import { useState } from "react";
import { Search, Ban, Shield, Send, Coins, Plus } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useUserRoles } from "@/hooks/useAdmin";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
const allRoles: AppRole[] = ["super_admin", "admin", "manager", "business_dev", "coins_seller", "agency_owner", "host"];

const AdminUsers = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { data: users, refetch } = useAdminUsers(search || undefined);
  const { data: myRoles } = useUserRoles();
  const isOwner = myRoles?.includes("owner");

  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [roleUserId, setRoleUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");

  const handleBan = async (userId: string, username: string) => {
    if (!confirm(`Ban user ${username}?`)) return;
    const { error } = await supabase.from("bans").insert({
      user_id: userId,
      banned_by: user!.id,
      reason: "Admin action",
    });
    if (error) toast.error(error.message);
    else toast.success(`${username} has been banned`);
  };

  const handleSendCoins = async (targetId: string, targetName: string) => {
    const amount = parseInt(coinAmount);
    if (!amount || amount < 1) { toast.error("Enter valid amount"); return; }
    const { error } = await supabase.rpc("owner_send_coins", {
      p_owner_id: user!.id,
      p_target_id: targetId,
      p_amount: amount,
      p_description: `Admin sent ${amount} coins`,
    });
    if (error) toast.error(error.message);
    else { toast.success(`Sent ${amount.toLocaleString()} coins to ${targetName}`); setCoinAmount(""); setSendingTo(null); }
  };

  const handleAddRole = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: selectedRole,
      granted_by: user!.id,
    });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("Already has this role");
      else toast.error(error.message);
    } else { toast.success(`Role "${selectedRole}" assigned`); setRoleUserId(null); refetch(); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">User Management</h1>

      <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-2.5 mb-6 border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, name, or email..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
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
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(u.display_name ?? "U").charAt(0)}</span>}
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
                        <span key={r.role} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{r.role}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleBan(u.user_id, u.username)}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Ban">
                        <Ban className="w-3.5 h-3.5" />
                      </motion.button>
                      {isOwner && (
                        <>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSendingTo(sendingTo === u.user_id ? null : u.user_id)}
                            className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20" title="Send coins">
                            <Coins className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setRoleUserId(roleUserId === u.user_id ? null : u.user_id)}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="Add role">
                            <Shield className="w-3.5 h-3.5" />
                          </motion.button>
                        </>
                      )}
                    </div>
                    {sendingTo === u.user_id && (
                      <div className="flex gap-2 mt-2">
                        <Input type="number" placeholder="Amount" min="1" className="w-28 h-8 text-xs" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} />
                        <button onClick={() => handleSendCoins(u.user_id, u.display_name ?? u.username)} className="px-3 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-bold">Send</button>
                      </div>
                    )}
                    {roleUserId === u.user_id && (
                      <div className="flex gap-2 mt-2">
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                          className="px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs">
                          {allRoles.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                        </select>
                        <button onClick={() => handleAddRole(u.user_id)} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">Assign</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!users || users.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No users found</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
