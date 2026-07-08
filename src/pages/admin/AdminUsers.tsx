import { useState } from "react";
import { Search, Ban, Shield, Coins, Trash2, RefreshCw, CheckCircle, XCircle, Eye } from "lucide-react";
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

  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"coins" | "role" | "ban" | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");
  const [banReason, setBanReason] = useState("");
  const [banType, setBanType] = useState("permanent");

  const openAction = (userId: string, type: "coins" | "role" | "ban") => {
    if (actionUserId === userId && actionType === type) {
      setActionUserId(null); setActionType(null);
    } else {
      setActionUserId(userId); setActionType(type);
    }
  };

  const handleBan = async (userId: string, username: string) => {
    if (!banReason.trim()) { toast.error("Ban reason required"); return; }
    const { error } = await supabase.from("bans").insert({
      user_id: userId,
      banned_by: user!.id,
      reason: banReason.trim(),
      ban_type: banType,
      expires_at: banType === "temporary" ? new Date(Date.now() + 7 * 86400000).toISOString() : null,
    });
    if (error) toast.error(error.message);
    else { toast.success(`${username} banned`); setBanReason(""); setActionUserId(null); setActionType(null); }
  };

  const handleUnban = async (userId: string, username: string) => {
    const { error } = await supabase.from("bans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    if (error) toast.error(error.message);
    else toast.success(`${username} unbanned`);
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
    else { toast.success(`Sent ${amount.toLocaleString()} coins to ${targetName}`); setCoinAmount(""); setActionUserId(null); setActionType(null); }
  };

  const handleAddRole = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: selectedRole, granted_by: user!.id });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("Already has this role");
      else toast.error(error.message);
    } else { toast.success(`Role "${selectedRole}" assigned`); setActionUserId(null); setActionType(null); refetch(); }
  };

  const handleResetAccount = async (userId: string, username: string) => {
    if (!confirm(`Reset ${username}'s account? This will set coins to 0, level to 1, XP to 0.`)) return;
    const { error } = await supabase.from("profiles").update({ coins_balance: 0, level: 1, xp: 0 }).eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success(`${username}'s account reset`); refetch(); }
  };

  const handleDeleteAccount = async (userId: string, username: string) => {
    if (!confirm(`⚠️ DELETE ${username}'s profile? This removes their profile data. This action cannot be undone!`)) return;
    // Delete related data first
    await supabase.from("user_roles").delete().eq("user_id", userId).neq("role", "owner");
    await supabase.from("room_participants").delete().eq("user_id", userId);
    await supabase.from("notifications").delete().eq("user_id", userId);
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success(`${username}'s profile deleted`); refetch(); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">User Management</h1>

      <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-2.5 mb-6 border border-border/50">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by numeric ID, username, name, or email..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Coins</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Roles</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u: any) => {
                const isOwnerUser = u.user_roles?.some((r: any) => r.role === "owner");
                return (
                  <tr key={u.id} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                          {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(u.display_name ?? "U").charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{u.display_name ?? u.username}</p>
                          <p className="text-[10px] text-muted-foreground">@{u.username} • {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">Lv.{u.level}</td>
                    <td className="px-4 py-3 text-accent font-bold">{u.coins_balance?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.user_roles?.map((r: any) => (
                          <span key={r.role} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            r.role === "owner" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                          }`}>{r.role}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.is_online ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"}`}>
                        {u.is_online ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex gap-1 flex-wrap">
                          {!isOwnerUser && (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openAction(u.user_id, "ban")}
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Ban/Unban">
                              <Ban className="w-3.5 h-3.5" />
                            </motion.button>
                          )}
                          {isOwner && (
                            <>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => openAction(u.user_id, "coins")}
                                className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20" title="Send coins">
                                <Coins className="w-3.5 h-3.5" />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => openAction(u.user_id, "role")}
                                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="Add role">
                                <Shield className="w-3.5 h-3.5" />
                              </motion.button>
                              {!isOwnerUser && (
                                <>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleResetAccount(u.user_id, u.username)}
                                    className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20" title="Reset account">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </motion.button>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteAccount(u.user_id, u.username)}
                                    className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete account">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </motion.button>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleUnban(u.user_id, u.display_name ?? u.username)}
                                    className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20" title="Unban">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </motion.button>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        {/* Inline action panels */}
                        {actionUserId === u.user_id && actionType === "coins" && (
                          <div className="flex gap-2 items-center">
                            <Input type="number" placeholder="Amount (1+)" min="1" className="w-28 h-8 text-xs" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} />
                            <button onClick={() => handleSendCoins(u.user_id, u.display_name ?? u.username)} className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-bold">Send</button>
                          </div>
                        )}
                        {actionUserId === u.user_id && actionType === "role" && (
                          <div className="flex gap-2 items-center">
                            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                              className="px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs">
                              {allRoles.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                            </select>
                            <button onClick={() => handleAddRole(u.user_id)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">Assign</button>
                          </div>
                        )}
                        {actionUserId === u.user_id && actionType === "ban" && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <select value={banType} onChange={(e) => setBanType(e.target.value)}
                                className="px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs">
                                <option value="permanent">Permanent</option>
                                <option value="temporary">Temporary (7 days)</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <Input placeholder="Ban reason..." className="h-8 text-xs" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
                              <button onClick={() => handleBan(u.user_id, u.username)} className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold whitespace-nowrap">Ban User</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!users || users.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No users found</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
