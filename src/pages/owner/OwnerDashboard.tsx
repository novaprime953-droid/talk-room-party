import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Users, DoorOpen, DollarSign, Shield, TrendingUp, Activity, Building } from "lucide-react";
import { Link } from "react-router-dom";

const OwnerDashboard = () => {
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
          <p className="text-xs text-muted-foreground">Full system overview and control</p>
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
