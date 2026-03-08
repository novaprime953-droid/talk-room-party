import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Users, DoorOpen, DollarSign, Shield, TrendingUp, Activity, Building, Send, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [coinSearch, setCoinSearch] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [coinNote, setCoinNote] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["owner-stats"],
    queryFn: async () => {
      const [users, rooms, recharges, withdrawals, hosts, agencies, admins] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("voice_rooms").select("id", { count: "exact", head: true }).eq("is_live", true),
        supabase.from("recharge_requests").select("amount").eq("status", "approved"),
        supabase.from("withdrawal_requests").select("amount").eq("status", "approved"),
        supabase.from("hosts").select("id", { count: "exact", head: true }),
        supabase.from("agencies").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin", "manager"]),
      ]);
      const totalRecharges = recharges.data?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
      const totalWithdrawals = withdrawals.data?.reduce((s, w) => s + Number(w.amount), 0) ?? 0;
      return {
        totalUsers: users.count ?? 0,
        liveRooms: rooms.count ?? 0,
        totalRevenue: totalRecharges,
        netRevenue: totalRecharges - totalWithdrawals,
        totalHosts: hosts.count ?? 0,
        totalAgencies: agencies.count ?? 0,
        totalAdmins: admins.count ?? 0,
      };
    },
  });

  const { data: searchUsers } = useQuery({
    queryKey: ["owner-coin-search", coinSearch],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("user_id, username, display_name, avatar_url, coins_balance")
        .or(`username.ilike.%${coinSearch}%,display_name.ilike.%${coinSearch}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: coinSearch.length >= 2,
  });

  const sendCoins = async (targetId: string, targetName: string) => {
    const amount = parseInt(coinAmount);
    if (!amount || amount < 1) { toast.error("Enter a valid amount (min 1)"); return; }
    const { data, error } = await supabase.rpc("owner_send_coins", {
      p_owner_id: user!.id,
      p_target_id: targetId,
      p_amount: amount,
      p_description: coinNote || `Owner sent ${amount} coins`,
    });
    if (error) toast.error(error.message);
    else { toast.success(`Sent ${amount.toLocaleString()} coins to ${targetName}!`); setCoinAmount(""); setCoinNote(""); }
  };

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { label: "Live Rooms", value: stats?.liveRooms ?? 0, icon: DoorOpen, color: "text-online" },
    { label: "Total Revenue", value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-accent" },
    { label: "Net Revenue", value: `$${(stats?.netRevenue ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-warning" },
    { label: "Hosts", value: stats?.totalHosts ?? 0, icon: Activity, color: "text-primary" },
    { label: "Agencies", value: stats?.totalAgencies ?? 0, icon: Building, color: "text-accent" },
    { label: "Admins", value: stats?.totalAdmins ?? 0, icon: Shield, color: "text-destructive" },
  ];

  const panels = [
    { label: "Admin Panel", desc: "Full system management", path: "/admin", icon: Shield },
    { label: "Agency Panel", desc: "Agency management", path: "/agency", icon: Building },
    { label: "BizDev Panel", desc: "Campaigns & promotions", path: "/bizdev", icon: TrendingUp },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-6 h-6 text-warning" />
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Owner Dashboard</h1>
          <p className="text-xs text-muted-foreground">Full system overview and control • Unlimited coins</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Send Coins Section */}
      <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Coins className="w-4 h-4 text-accent" /> Send Coins to User (Unlimited)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <Input placeholder="Search user..." value={coinSearch} onChange={(e) => setCoinSearch(e.target.value)} />
          <Input type="number" placeholder="Amount (1 - 999,999,999)" min="1" max="999999999" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} />
          <Input placeholder="Note (optional)" value={coinNote} onChange={(e) => setCoinNote(e.target.value)} />
        </div>
        {searchUsers && searchUsers.length > 0 && (
          <div className="divide-y divide-border/30 rounded-xl border border-border/50 overflow-hidden">
            {searchUsers.map((p) => (
              <div key={p.user_id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{(p.display_name ?? "U")[0]}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.display_name ?? p.username}</p>
                    <p className="text-[10px] text-muted-foreground">Balance: {p.coins_balance?.toLocaleString()} coins</p>
                  </div>
                </div>
                <button onClick={() => sendCoins(p.user_id, p.display_name ?? p.username ?? "User")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20">
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-foreground mb-3">Quick Access to Panels</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {panels.map((p) => (
          <Link key={p.path} to={p.path} className="bg-card rounded-2xl p-4 shadow-card hover:bg-muted/30 transition-colors">
            <p.icon className="w-5 h-5 text-primary mb-2" />
            <p className="font-semibold text-foreground text-sm">{p.label}</p>
            <p className="text-[10px] text-muted-foreground">{p.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OwnerDashboard;
