import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Users, DoorOpen, DollarSign, Shield, TrendingUp, Activity, Building, Send, Coins, Gift, Mic, CreditCard, Bell, BarChart3, Plus, UserPlus, Target, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type RoleType = "super_admin" | "admin" | "business_dev" | "coins_seller";

const roleButtons: { label: string; role: RoleType; icon: typeof Shield; color: string }[] = [
  { label: "Add Super Admin", role: "super_admin", icon: Shield, color: "bg-destructive/10 text-destructive border-destructive/20" },
  { label: "Add Admin", role: "admin", icon: Shield, color: "bg-primary/10 text-primary border-primary/20" },
  { label: "Add BD", role: "business_dev", icon: Target, color: "bg-accent/20 text-accent-foreground border-accent/30" },
  { label: "Add Coins Seller", role: "coins_seller", icon: Coins, color: "bg-warning/10 text-warning border-warning/20" },
];

const OwnerDashboard = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coinSearch, setCoinSearch] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [coinNote, setCoinNote] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Role creation dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createRole, setCreateRole] = useState<RoleType>("admin");
  const [formData, setFormData] = useState({ username: "", email: "", password: "", phone: "", status: "active" });
  const [creating, setCreating] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["owner-stats"],
    queryFn: async () => {
      const [users, rooms, liveRooms, recharges, withdrawals, hosts, agencies, admins, gifts, coinTx] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("voice_rooms").select("id", { count: "exact", head: true }),
        supabase.from("voice_rooms").select("id", { count: "exact", head: true }).eq("is_live", true),
        supabase.from("recharge_requests").select("amount").eq("status", "approved"),
        supabase.from("withdrawal_requests").select("amount").eq("status", "approved"),
        supabase.from("hosts").select("id", { count: "exact", head: true }),
        supabase.from("agencies").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin", "manager"]),
        supabase.from("gift_transactions").select("coins_spent"),
        supabase.from("coin_transactions").select("amount").eq("type", "recharge"),
      ]);
      const totalRecharges = recharges.data?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
      const totalWithdrawals = withdrawals.data?.reduce((s, w) => s + Number(w.amount), 0) ?? 0;
      const totalGiftVolume = gifts.data?.reduce((s, g) => s + g.coins_spent, 0) ?? 0;
      return {
        totalUsers: users.count ?? 0,
        totalRooms: rooms.count ?? 0,
        liveRooms: liveRooms.count ?? 0,
        totalRevenue: totalRecharges,
        netRevenue: totalRecharges - totalWithdrawals,
        totalHosts: hosts.count ?? 0,
        totalAgencies: agencies.count ?? 0,
        totalAdmins: admins.count ?? 0,
        totalGiftVolume,
      };
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["owner-transfer-limits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_settings").select("*").eq("key", "coin_transfer_limits").maybeSingle();
      if (error) throw error;
      return data?.value as { min: number; max: number } | null;
    },
  });

  const { data: searchUsers } = useQuery({
    queryKey: ["owner-coin-search", coinSearch],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("user_id, username, display_name, avatar_url, coins_balance, level")
        .or(`username.ilike.%${coinSearch}%,display_name.ilike.%${coinSearch}%,email.ilike.%${coinSearch}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: coinSearch.length >= 2 && !selectedUser,
  });

  const sendCoins = async () => {
    if (!selectedUser) { toast.error("Select a user"); return; }
    const amount = parseInt(coinAmount);
    const min = settings?.min ?? 1;
    const max = settings?.max ?? 999999999;
    if (!amount || amount < min || amount > max) {
      toast.error(`Amount must be between ${min.toLocaleString()} and ${max.toLocaleString()}`);
      return;
    }
    const { error } = await supabase.rpc("owner_send_coins", {
      p_owner_id: user!.id,
      p_target_id: selectedUser.user_id,
      p_amount: amount,
      p_description: coinNote || `Owner sent ${amount} coins`,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Sent ${amount.toLocaleString()} coins to ${selectedUser.display_name ?? selectedUser.username}!`);
      setCoinAmount("");
      setCoinNote("");
      setSelectedUser(null);
      setCoinSearch("");
    }
  };

  const openCreateDialog = (role: RoleType) => {
    setCreateRole(role);
    setFormData({ username: "", email: "", password: "", phone: "", status: "active" });
    setCreateDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    try {
      const res = await supabase.functions.invoke("admin-api", {
        body: {
          email: formData.email.trim(),
          password: formData.password,
          username: formData.username.trim() || undefined,
          display_name: formData.username.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          role: createRole,
        },
        headers: { "x-action-path": "/create-user" },
      });

      // The edge function uses URL path routing, so we need to call it differently
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
      queryClient.invalidateQueries({ queryKey: ["owner-stats"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const roleLabels: Record<RoleType, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    business_dev: "Business Developer",
    coins_seller: "Coins Seller",
  };

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { label: "Active Rooms", value: `${stats?.liveRooms ?? 0} / ${stats?.totalRooms ?? 0}`, icon: DoorOpen, color: "text-online" },
    { label: "Total Hosts", value: stats?.totalHosts ?? 0, icon: Mic, color: "text-accent" },
    { label: "Agencies", value: stats?.totalAgencies ?? 0, icon: Building, color: "text-info" },
    { label: "Total Revenue", value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-accent" },
    { label: "Net Revenue", value: `$${(stats?.netRevenue ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-online" },
    { label: "Gift Volume", value: (stats?.totalGiftVolume ?? 0).toLocaleString(), icon: Gift, color: "text-warning" },
    { label: "Admins", value: stats?.totalAdmins ?? 0, icon: Shield, color: "text-destructive" },
  ];

  const panels = [
    { label: "Admin Panel", desc: "Full system management", path: "/admin", icon: Shield },
    { label: "Agency Panel", desc: "Agency management", path: "/agency", icon: Building },
    { label: "BizDev Panel", desc: "Campaigns & promotions", path: "/bizdev", icon: TrendingUp },
    { label: "Host Center", desc: "Host dashboard", path: "/host", icon: Mic },
    { label: "Coins Seller", desc: "Recharge management", path: "/seller", icon: Coins },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-7 h-7 text-warning" />
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Owner Dashboard</h1>
          <p className="text-xs text-muted-foreground">Full system overview • Unlimited coins • All privileges</p>
        </div>
      </div>

      {/* Role Creation Buttons */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.03 }} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-[10px] text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Send Coins */}
      <div className="bg-card rounded-2xl p-5 shadow-card mb-6">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent" /> Send Coins (Unlimited · No Deduction)
        </h3>
        <p className="text-[10px] text-muted-foreground mb-3">
          Transfer limits: {(settings?.min ?? 1).toLocaleString()} – {(settings?.max ?? 999999999).toLocaleString()} coins.
          Adjust in <button onClick={() => navigate("/owner/settings")} className="text-primary underline">Settings</button>.
        </p>

        {!selectedUser ? (
          <div className="space-y-3">
            <Input placeholder="Search user by name or email..." value={coinSearch} onChange={(e) => setCoinSearch(e.target.value)} />
            {searchUsers && searchUsers.length > 0 && (
              <div className="divide-y divide-border/30 rounded-xl border border-border/50 overflow-hidden max-h-48 overflow-y-auto">
                {searchUsers.map((p) => (
                  <button key={p.user_id} onClick={() => { setSelectedUser(p); setCoinSearch(p.display_name ?? p.username ?? ""); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/10 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(p.display_name ?? "U")[0]}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.display_name ?? p.username}</p>
                        <p className="text-[10px] text-muted-foreground">Lv.{p.level} • {p.coins_balance?.toLocaleString()} coins</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(selectedUser.display_name ?? "U")[0]}</span>}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{selectedUser.display_name ?? selectedUser.username}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedUser.coins_balance?.toLocaleString()} coins</p>
                </div>
              </div>
              <button onClick={() => { setSelectedUser(null); setCoinSearch(""); }} className="text-xs text-muted-foreground">Change</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input type="number" placeholder={`Amount (${(settings?.min ?? 1).toLocaleString()} - ${(settings?.max ?? 999999999).toLocaleString()})`} value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} />
              <Input placeholder="Note (optional)" value={coinNote} onChange={(e) => setCoinNote(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[1000, 5000, 10000, 50000, 100000, 1000000].map((a) => (
                <button key={a} onClick={() => setCoinAmount(String(a))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${coinAmount === String(a) ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"}`}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={sendCoins}
              className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Send Coins
            </motion.button>
          </div>
        )}
      </div>

      {/* Panel Access */}
      <h3 className="font-bold text-foreground mb-3">Quick Access to All Panels</h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {panels.map((p) => (
          <Link key={p.path} to={p.path} className="bg-card rounded-2xl p-4 shadow-card hover:bg-muted/30 transition-colors">
            <p.icon className="w-5 h-5 text-primary mb-2" />
            <p className="font-semibold text-foreground text-sm">{p.label}</p>
            <p className="text-[10px] text-muted-foreground">{p.desc}</p>
          </Link>
        ))}
      </div>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <UserPlus className="w-5 h-5 text-primary" />
              Create {roleLabels[createRole]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Username</Label>
              <Input
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Email *</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Password *</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Phone</Label>
              <Input
                type="tel"
                placeholder="Phone number (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Assigned Role</Label>
              <div className="px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground font-medium">
                {roleLabels[createRole]}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCreateUser}
              disabled={creating}
              className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create {roleLabels[createRole]}
                </>
              )}
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerDashboard;
