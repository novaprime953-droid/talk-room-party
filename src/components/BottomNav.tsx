import { Home, Compass, Radio, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Radio, label: "Go Live", path: "/create", isCenter: true },
  { icon: MessageCircle, label: "Chats", path: "/social" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenPrefixes = ["/room/", "/admin", "/owner", "/agency", "/bizdev", "/host", "/seller"];
  if (hiddenPrefixes.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-lg px-3 pb-2">
        <div className="glass-card rounded-3xl border border-border/40 shadow-lift flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          if ((tab as any).isCenter) {
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className="relative -mt-8"
              >
                <div className="w-16 h-16 rounded-full gradient-sunset animate-gradient flex items-center justify-center shadow-lift glow-primary ring-4 ring-background">
                  <tab.icon className="w-7 h-7 text-primary-foreground" strokeWidth={2.4} />
                </div>
                <span className="block text-[9px] font-bold text-gradient-sunset text-center mt-1">{tab.label}</span>
              </button>
            );
          }
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3 min-w-0"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-2xl gradient-ember/20 -z-10"
                  style={{ background: "hsl(18 100% 60% / 0.15)" }}
                />
              )}
              <tab.icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-primary drop-shadow-[0_0_10px_hsl(18_100%_60%_/_0.6)]" : "text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground/80"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
