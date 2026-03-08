import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Crown, LayoutDashboard, Users, Shield, Settings, BarChart3, DollarSign,
  Menu, X, ArrowLeft, Building, Mic, Target, Coins, Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/useAdmin";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/owner" },
  { label: "Admin Management", icon: Shield, path: "/owner/admins" },
  { label: "System Analytics", icon: BarChart3, path: "/owner/analytics" },
  { label: "Revenue", icon: DollarSign, path: "/owner/revenue" },
  { label: "Global Settings", icon: Settings, path: "/owner/settings" },
];

const quickLinks = [
  { label: "Admin Panel", icon: Shield, path: "/admin" },
  { label: "Agency Panel", icon: Building, path: "/agency" },
  { label: "BizDev Panel", icon: Target, path: "/bizdev" },
];

const OwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data: roles } = useUserRoles();
  const isOwner = roles?.includes("owner");

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
    <div className="flex min-h-screen bg-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-muted">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Crown className="w-4 h-4 text-warning" />
        <span className="font-display font-bold text-foreground">Owner Panel</span>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 flex items-center px-4 border-b border-border gap-2">
          <Crown className="w-5 h-5 text-warning" />
          <span className="font-display font-bold text-foreground">Owner Panel</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1">Main</p>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}

          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-1">Quick Access</p>
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0">
        <div className="p-4 lg:p-6 max-w-6xl">{children}</div>
      </main>
    </div>
  );
};

export default OwnerLayout;
