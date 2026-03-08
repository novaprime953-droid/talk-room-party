import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Shield, Crown, BarChart3, Settings, Ban, Coins, Gift, Building, FileText, Bell, Activity, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminStats, useAdminUsers, useReports, useUserRoles } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Panel = "owner" | "superadmin" | "admin" | "manage" | "business" | "agency" | "host" | "seller";

const panels: { id: Panel; label: string; icon: any; color: string; desc: string }[] = [
  { id: "owner", label: "Owner Panel", icon: Crown, color: "text-accent", desc: "Full system control" },
  { id: "superadmin", label: "Super Admin", icon: Shield, color: "text-destructive", desc: "System management" },
  { id: "admin", label: "Admin Panel", icon: Shield, color: "text-primary", desc: "User & content moderation" },
  { id: "manage", label: "Manage Panel", icon: Settings, color: "text-info", desc: "Room & event management" },
  { id: "business", label: "Business Dev", icon: BarChart3, color: "text-online", desc: "Analytics & growth" },
  { id: "agency", label: "Agency Panel", icon: Building, color: "text-secondary", desc: "Agency management" },
  { id: "host", label: "Host Center", icon: Users, color: "text-warning", desc: "Host tools & earnings" },
  { id: "seller", label: "Coins Seller", icon: Coins, color: "text-accent", desc: "Coin sales & recharge" },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activePanel, setActivePanel] = useState<Panel>("owner");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: stats } = useAdminStats();
  const { data: users } = useAdminUsers(searchTerm || undefined);
  const { data: reports } = useReports("pending");
  const { data: roles } = useUserRoles();

  const hasAccess = roles?.some((r) =>
    ["admin", "super_admin", "owner", "manager", "business_dev", "coins_seller"].includes(r)
  );

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display font-bold text-xl text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          You don't have permission to access the admin panel.
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
          className="gradient-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold"
        >
          Go Home
        </motion.button>
      </div>
    );
  }

  const adminStats = [
    { label: "Total Users", value: stats?.totalUsers?.toLocaleString() ?? "0" },
    { label: "Active Rooms", value: stats?.activeRooms?.toLocaleString() ?? "0" },
    { label: "Pending Reports", value: stats?.pendingReports?.toLocaleString() ?? "0" },
    { label: "Revenue", value: "$0" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl text-foreground">Admin Dashboard</h1>
        </div>

        {/* Panel Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {panels.map((panel) => (
            <motion.button
              key={panel.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivePanel(panel.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                activePanel === panel.id
                  ? "gradient-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border/50"
              }`}
            >
              <panel.icon className="w-3.5 h-3.5" />
              {panel.label}
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {adminStats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-[10px] text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-2.5 mb-6 border border-border/50">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users, rooms, reports..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Users list */}
        {users && users.length > 0 && (
          <>
            <h2 className="font-display font-bold text-sm text-foreground mb-3">Users</h2>
            <div className="space-y-2 mb-6">
              {users.slice(0, 10).map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-foreground">
                        {(u.display_name ?? u.username ?? "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {u.display_name ?? u.username ?? "User"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{u.email} · Lv.{u.level}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {u.user_roles?.map((r: any) => (
                      <span key={r.role} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {r.role}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pending Reports */}
        {reports && reports.length > 0 && (
          <>
            <h2 className="font-display font-bold text-sm text-foreground mb-3">
              Pending Reports ({reports.length})
            </h2>
            <div className="space-y-2 mb-6">
              {reports.slice(0, 5).map((r: any) => (
                <div key={r.id} className="bg-card rounded-xl p-3 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.reason}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        By {r.reporter?.username ?? "Unknown"} → {r.reported?.username ?? "Unknown"}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-bold">
                      {r.status}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-2">{r.description}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Management Sections */}
        <h2 className="font-display font-bold text-sm text-foreground mb-3">Management</h2>
        <div className="space-y-2">
          {[
            { icon: Users, label: "User Management", count: `${stats?.totalUsers ?? 0} users` },
            { icon: Activity, label: "Live Rooms Monitor", count: `${stats?.activeRooms ?? 0} active` },
            { icon: Coins, label: "Transactions", count: "" },
            { icon: Gift, label: "Gift Management", count: "" },
            { icon: Building, label: "Agency Management", count: "" },
            { icon: FileText, label: "Reports & Appeals", count: `${stats?.pendingReports ?? 0} pending` },
            { icon: Ban, label: "Banned Users", count: "" },
            { icon: Settings, label: "App Settings", count: "" },
          ].map((item) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 bg-card rounded-xl p-3 shadow-card"
            >
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                {item.count && <p className="text-[10px] text-muted-foreground">{item.count}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
