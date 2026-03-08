import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Mic, Building, DoorOpen, Gift, Coins, CreditCard,
  ArrowUpRight, FileText, Bell, Trophy, Calendar, Megaphone, Settings,
  BarChart3, Activity, ChevronLeft, ChevronRight, Shield, Menu, X, LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useAdmin";

const menuSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
      { icon: Activity, label: "Activity Logs", path: "/admin/logs" },
    ],
  },
  {
    label: "Management",
    items: [
      { icon: Users, label: "Users", path: "/admin/users" },
      { icon: Mic, label: "Hosts", path: "/admin/hosts" },
      { icon: Building, label: "Agencies", path: "/admin/agencies" },
      { icon: DoorOpen, label: "Rooms", path: "/admin/rooms" },
    ],
  },
  {
    label: "Economy",
    items: [
      { icon: Gift, label: "Gifts", path: "/admin/gifts" },
      { icon: Coins, label: "Coin Packages", path: "/admin/coins" },
      { icon: CreditCard, label: "Recharge Records", path: "/admin/recharge" },
      { icon: ArrowUpRight, label: "Withdrawals", path: "/admin/withdrawals" },
    ],
  },
  {
    label: "Moderation",
    items: [
      { icon: FileText, label: "Reports", path: "/admin/reports" },
      { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { icon: Trophy, label: "Leaderboards", path: "/admin/leaderboards" },
      { icon: Calendar, label: "Events", path: "/admin/events" },
      { icon: Megaphone, label: "Promotions", path: "/admin/promotions" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: Settings, label: "Settings", path: "/admin/settings" },
    ],
  },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border/50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">Admin Panel</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4 no-scrollbar">
          {menuSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border/50">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Back to App</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {roles?.map((r) => (
              <span key={r} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                {r}
              </span>
            ))}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
