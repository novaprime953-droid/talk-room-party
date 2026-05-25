import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, DollarSign, Gift, ArrowUpRight, DoorOpen, Trophy, Menu, X, ArrowLeft, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlobalSearch from "@/components/admin/GlobalSearch";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/host" },
  { label: "Earnings", icon: DollarSign, path: "/host/earnings" },
  { label: "Gifts Received", icon: Gift, path: "/host/gifts" },
  { label: "Withdrawals", icon: ArrowUpRight, path: "/host/withdrawals" },
  { label: "Room Stats", icon: DoorOpen, path: "/host/rooms" },
  { label: "Host Level", icon: Trophy, path: "/host/level" },
];

const HostLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: roles } = useUserRoles();

  const hasAccess = roles?.some((r) => ["host", "admin", "super_admin", "owner", "manager"].includes(r));

  if (!hasAccess) {
    return <Navigate to="/agency-center" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-muted">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Mic className="w-4 h-4 text-primary" />
        <span className="font-display font-bold text-foreground">Host Center</span>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 flex items-center px-4 border-b border-border gap-2">
          <Mic className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Host Center</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted">
            <ArrowLeft className="w-4 h-4" /> Back to App
          </Link>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0">
        <header className="sticky top-14 lg:top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <GlobalSearch basePath="/host" />
          <div className="flex-1" />
        </header>
        <div className="p-4 lg:p-6 max-w-6xl pb-24 lg:pb-6">{children}</div>
      </main>
    </div>
  );
};

export default HostLayout;
