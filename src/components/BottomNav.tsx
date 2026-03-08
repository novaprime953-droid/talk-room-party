import { Home, Search, Plus, Trophy, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: Plus, label: "Create", path: "/create" },
  { icon: Trophy, label: "Rank", path: "/leaderboard" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on room pages
  if (location.pathname.startsWith("/room/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const isCreate = tab.label === "Create";

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3"
            >
              {isCreate ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="gradient-primary rounded-2xl p-3 -mt-5 glow-primary"
                >
                  <tab.icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
              ) : (
                <>
                  <tab.icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-semibold transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-0.5 w-5 h-0.5 rounded-full gradient-primary"
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
