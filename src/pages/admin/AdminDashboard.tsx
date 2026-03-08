import { useState } from "react";
import { motion } from "framer-motion";
import { Users, DoorOpen, FileText, Coins, Activity, Building, Mic, Crown, DollarSign, Shield, Target, UserPlus } from "lucide-react";
import { useAdminStats, useUserRoles } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type RoleType = "super_admin" | "admin" | "business_dev" | "coins_seller";

const roleButtons: { label: string; role: RoleType; icon: typeof Shield; color: string }[] = [
  { label: "Add Super Admin", role: "super_admin", icon: Shield, color: "bg-destructive/10 text-destructive border-destructive/20" },
  { label: "Add Admin", role: "admin", icon: Shield, color: "bg-primary/10 text-primary border-primary/20" },
  { label: "Add BD", role: "business_dev", icon: Target, color: "bg-accent/20 text-accent-foreground border-accent/30" },
  { label: "Add Coins Seller", role: "coins_seller", icon: Coins, color: "bg-warning/10 text-warning border-warning/20" },
];

const roleLabels: Record<RoleType, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  business_dev: "Business Developer",
  coins_seller: "Coins Seller",
};

const AdminDashboard = () => {
  const { data: stats } = useAdminStats();
  const { session } = useAuth();
  const { data: roles } = useUserRoles();
  const queryClient = useQueryClient();
  const isOwner = roles?.includes("owner");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createRole, setCreateRole] = useState<RoleType>("admin");
  const [formData, setFormData] = useState({ username: "", email: "", password: "", phone: "", status: "active" });
  const [creating, setCreating] = useState(false);

  const { data: extraStats } = useQuery({
    queryKey: ["admin-extra-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [hosts, activeHosts, agencies, coinTx, dailyRecharges] = await Promise.all([
        supabase.from("hosts").select("id", { count: "exact", head: true }),
        supabase.from("hosts").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("agencies").select("id", { count: "exact", head: true }),
        supabase.from("coin_transactions").select("id", { count: "exact", head: true }),
        supabase.from("recharge_requests").select("amount").eq("status", "approved").gte("created_at", today.toISOString()),
      ]);
      return {
        totalHosts: hosts.count ?? 0,
        activeHosts: activeHosts.count ?? 0,
        totalAgencies: agencies.count ?? 0,
        totalCoinTx: coinTx.count ?? 0,
        dailyRevenue: dailyRecharges.data?.reduce((s, r) => s + Number(r.amount), 0) ?? 0,
      };
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, created_at, level")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const openCreateDialog = (role: RoleType) => {
    setCreateRole(role);
    setFormData({ username: "", email: "", password: "", phone: "", status: "active" });
    setCreateDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) { toast.error("Email and password are required"); return; }
    if (formData.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setCreating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            username: formData.username.trim() || undefined,
            display_name: formData.username.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            role: createRole,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create user");
      toast.success(`${roleLabels[createRole]} created successfully!`);
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-users"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const statCards = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers ?? 0, color: "text-primary" },
    { icon: DoorOpen, label: "Active Voice Rooms", value: stats?.activeRooms ?? 0, color: "text-online" },
    { icon: Mic, label: "Total Hosts", value: extraStats?.totalHosts ?? 0, color: "text-accent" },
    { icon: Building, label: "Total Agencies", value: extraStats?.totalAgencies ?? 0, color: "text-info" },
    { icon: Coins, label: "Total Coin Transactions", value: (extraStats?.totalCoinTx ?? 0).toLocaleString(), color: "text-warning" },
    { icon: DollarSign, label: "Daily Revenue", value: `$${(extraStats?.dailyRevenue ?? 0).toFixed(2)}`, color: "text-online" },
    { icon: Activity, label: "Active Hosts", value: extraStats?.activeHosts ?? 0, color: "text-secondary" },
    { icon: FileText, label: "Pending Reports", value: stats?.pendingReports ?? 0, color: "text-destructive" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-7 h-7 text-warning" />
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Owner Panel Dashboard</h1>
          <p className="text-xs text-muted-foreground">Main control center • Full system overview</p>
        </div>
      </div>

      {/* Role Creation Buttons - Owner only */}
      {isOwner && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {roleButtons.map((rb) => (
            <motion.button
              key={rb.role}
              whileTap={{ scale: 0.97 }}
              onClick={() => openCreateDialog(rb.role)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border font-semibold text-sm transition-colors ${rb.color} hover:opacity-90`}
            >
              <div className="w-8 h-8 rounded-xl bg-background/50 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <span>{rb.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 shadow-card">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <h2 className="font-display font-bold text-lg text-foreground mb-3">Recent Signups</h2>
      <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers?.map((u) => (
                <tr key={u.user_id} className="border-b border-border/30 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-foreground">{(u.display_name ?? u.username ?? "U").charAt(0).toUpperCase()}</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{u.display_name ?? u.username}</p>
                        <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">Lv.{u.level}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <UserPlus className="w-5 h-5 text-primary" /> Create {roleLabels[createRole]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Username</Label>
              <Input placeholder="Enter username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Email *</Label>
              <Input type="email" placeholder="Enter email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Password *</Label>
              <Input type="password" placeholder="Minimum 6 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Phone</Label>
              <Input type="tel" placeholder="Phone number (optional)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Assigned Role</Label>
              <div className="px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground font-medium">{roleLabels[createRole]}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateUser} disabled={creating}
              className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {creating ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create {roleLabels[createRole]}</>}
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;