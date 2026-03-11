import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Crown, LayoutDashboard, Users, Shield, Settings, BarChart3, DollarSign,
  Menu, X, ArrowLeft, Building, Mic, Target, Coins, DoorOpen, Gift,
  CreditCard, ArrowUpRight, Bell, FileText, Trophy, Calendar, Megaphone,
  Activity, Swords, LogOut, Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/useAdmin";
import { motion, AnimatePresence } from "framer-motion";

const navSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/owner" },
      { label: "Analytics", icon: BarChart3, path: "/owner/analytics" },
      { label: "Activity Logs", icon: Activity, path: "/owner/logs" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Users", icon: Users, path: "/owner/users" },
      { label: "Admin Management", icon: Shield, path: "/owner/admins" },
      { label: "Hosts", icon: Mic, path: "/owner/hosts" },
      { label: "Agencies", icon: Building, path: "/owner/agencies" },
      { label: "Rooms", icon: DoorOpen, path: "/owner/rooms" },
    ],
  },
  {
    label: "Economy",
    items: [
      { label: "Gifts", icon: Gift, path: "/owner/gifts" },
      { label: "Coin Packages", icon: Coins, path: "/owner/coins" },
      { label: "Recharge Records", icon: CreditCard, path: "/owner/recharge" },
      { label: "Withdrawals", icon: ArrowUpRight, path: "/owner/withdrawals" },
      { label: "Revenue", icon: DollarSign, path: "/owner/revenue" },
      { label: "Seller Recharges", icon: Coins, path: "/owner/seller-recharges" },
    ],
  },
  {
    label: "Moderation",
    items: [
      { label: "Reports", icon: FileText, path: "/owner/reports" },
      { label: "Notifications", icon: Bell, path: "/owner/notifications" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Leaderboards", icon: Trophy, path: "/owner/leaderboards" },
      { label: "Competitions", icon: Swords, path: "/owner/competitions" },
      { label: "Events", icon: Calendar, path: "/owner/events" },
      { label: "Promotions", icon: Megaphone, path: "/owner/promotions" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", icon: Settings, path: "/owner/settings" },
    ],
  },
];

const quickLinks = [
  { label: "Agency Panel", icon: Building, path: "/agency" },
  { label: "BizDev Panel", icon: Target, path: "/bizdev" },
  { label: "Host Center", icon: Mic, path: "/host" },
  { label: "Coins Seller", icon: Coins, path: "/seller" },
];

const OwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: roles, isLoading } = useUserRoles();
  const isOwner = roles?.includes("owner");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Crown className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display font-bold text-xl text-foreground mb-2">Owner Access Only</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          This panel is restricted to the system owner.
        </p>
        <Link to="/" className="gradient-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border/50 flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-warning" />
            <span className="font-display font-bold text-foreground">Owner Panel</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4 no-scrollbar">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/owner"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1">Quick Access</p>
            <div className="space-y-0.5">
              {quickLinks.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

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
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="lg:hidden p-1 text-foreground">
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

        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
