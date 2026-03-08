import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Shield, Crown, BarChart3, Settings, Ban, Coins, Gift, Building, FileText, Bell, Activity, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const adminStats = [
  { label: "Total Users", value: "145.2K", change: "+2.3%" },
  { label: "Active Rooms", value: "1,234", change: "+12%" },
  { label: "Revenue", value: "$45.8K", change: "+8.5%" },
  { label: "Reports", value: "23", change: "-15%" },
];

const quickActions = [
  { icon: Ban, label: "Ban User", color: "text-destructive" },
  { icon: Gift, label: "Send Gift", color: "text-primary" },
  { icon: Bell, label: "Broadcast", color: "text-info" },
  { icon: FileText, label: "Reports", color: "text-warning" },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<Panel>("owner");

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
              <span className={`text-[10px] font-bold ${stat.change.startsWith("+") ? "text-online" : "text-destructive"}`}>
                {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="font-display font-bold text-sm text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.95 }}
              className="bg-card rounded-2xl p-3 flex flex-col items-center gap-2 shadow-card"
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-[10px] font-semibold text-foreground">{action.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-2.5 mb-6 border border-border/50">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users, rooms, reports..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Management Sections */}
        <h2 className="font-display font-bold text-sm text-foreground mb-3">Management</h2>
        <div className="space-y-2">
          {[
            { icon: Users, label: "User Management", count: "145.2K users" },
            { icon: Activity, label: "Live Rooms Monitor", count: "1,234 active" },
            { icon: Coins, label: "Transactions", count: "3,456 today" },
            { icon: Gift, label: "Gift Management", count: "89 gifts" },
            { icon: Building, label: "Agency Management", count: "34 agencies" },
            { icon: FileText, label: "Reports & Appeals", count: "23 pending" },
            { icon: Ban, label: "Banned Users", count: "156 banned" },
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
