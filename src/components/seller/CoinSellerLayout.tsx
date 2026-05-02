import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Send, CreditCard, ShieldCheck, History, Menu, X, ArrowLeft, Coins, Wallet, UserSearch, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/useAdmin";
import { motion } from "framer-motion";
import GlobalSearch from "@/components/admin/GlobalSearch";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/seller" },
  { label: "Send Coins", icon: Send, path: "/seller/send" },
  { label: "Wallet", icon: Wallet, path: "/seller/wallet" },
  { label: "Recharge Requests", icon: CreditCard, path: "/seller/recharges" },
  { label: "Verify Payments", icon: ShieldCheck, path: "/seller/verify" },
  { label: "Transaction History", icon: History, path: "/seller/history" },
  { label: "Payment Methods", icon: Wallet, path: "/seller/payments" },
  { label: "Wallet Search", icon: UserSearch, path: "/seller/wallets" },
  { label: "Recharge Packages", icon: Package, path: "/seller/packages" },
];

const CoinSellerLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: roles } = useUserRoles();

  const hasAccess = roles?.some((r) => ["coins_seller", "admin", "super_admin", "owner"].includes(r));

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Coins className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display font-bold text-xl text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          You need the Coins Seller role to access this panel.
        </p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
          className="gradient-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold">
          Go Home
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4 gap-3">
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-muted">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Coins className="w-4 h-4 text-primary" />
        <span className="font-display font-bold text-foreground">Coins Seller</span>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 flex items-center px-4 border-b border-border gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-foreground">Coins Seller</span>
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
          <GlobalSearch basePath="/seller" />
          <div className="flex-1" />
        </header>
        <div className="p-4 lg:p-6 max-w-6xl pb-24 lg:pb-6">{children}</div>
      </main>
    </div>
  );
};

export default CoinSellerLayout;
