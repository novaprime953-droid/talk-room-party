import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UserPlus, Users, DollarSign, PieChart, Menu, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/agency" },
  { label: "Recruit Hosts", icon: UserPlus, path: "/agency/recruit" },
  { label: "Manage Hosts", icon: Users, path: "/agency/hosts" },
  { label: "Earnings", icon: DollarSign, path: "/agency/earnings" },
  { label: "Commissions", icon: PieChart, path: "/agency/commissions" },
];

const AgencyLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-muted">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-display font-bold text-foreground">Agency Panel</span>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 flex items-center px-4 border-b border-border gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Agency Panel</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
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

export default AgencyLayout;
