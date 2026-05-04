import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Plus, label: "Live", path: "/create", isCenter: true },
  { icon: MessageCircle, label: "Messages", path: "/social" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenPrefixes = ["/room/", "/admin", "/owner", "/agency", "/bizdev", "/host", "/seller"];
  if (hiddenPrefixes.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-2xl border-t border-border/30 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          if ((tab as any).isCenter) {
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className="relative -mt-6"
              >
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg glow-primary">
                  <tab.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <span className="block text-[9px] font-bold text-primary text-center mt-0.5">{tab.label}</span>
              </button>
            );
          }
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-4"
            >
              <tab.icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-primary drop-shadow-[0_0_8px_hsl(264,100%,60%,0.5)]" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground/70"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-6 h-0.5 rounded-full gradient-primary glow-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
