import { useState } from "react";
import { Search, Crown, CalendarDays, Bell, Wallet, Flame, Sparkles, Globe, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlobalSearch from "@/components/admin/GlobalSearch";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import MineTab from "@/components/home/MineTab";
import PartyTab from "@/components/home/PartyTab";
import EventsTab from "@/components/home/EventsTab";
import BannerSlider from "@/components/home/BannerSlider";
import LeaderboardPage from "@/pages/LeaderboardPage";
import LiveStoriesBar from "@/components/home/LiveStoriesBar";
import StoriesBar from "@/components/home/StoriesBar";

const tabs = [
  { key: "featured", label: "Featured", icon: Sparkles },
  { key: "party", label: "Nearby", icon: Globe },
  { key: "mine", label: "New", icon: Zap },
  { key: "hot", label: "Hot", icon: Flame },
  { key: "events", label: "Events", icon: CalendarDays },  
];

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("featured");
  const { data: profile } = useProfile();
  const unread = useUnreadCount();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Premium Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-2xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h1 className="text-xl font-display font-bold neon-text text-foreground">
            Talk<span className="text-gradient-primary">Room</span>
          </h1>
          <div className="flex items-center gap-2">
            <GlobalSearch
              basePath=""
              trigger={
                <button className="p-2 rounded-full glass text-muted-foreground hover:text-foreground transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              }
            />
            <button
              onClick={() => navigate("/notifications")}
              className="relative p-2 rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="w-5 h-5" />
              {(unread?.data ?? 0) > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-live text-[8px] font-bold text-white flex items-center justify-center">
                  {unread?.data}
                </div>
              )}
            </button>
            <button
              onClick={() => navigate("/wallet")}
              className="p-2 rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
            >
              <Wallet className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 pb-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "gradient-primary text-primary-foreground shadow-sm glow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("ranking")}
            className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "ranking"
                ? "bg-gradient-to-r from-accent to-warning text-accent-foreground shadow-sm glow-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Rank
          </motion.button>
        </div>
      </div>

      {/* Live Stories Bar */}
      {["featured", "party", "hot"].includes(activeTab) && (
        <>
          <StoriesBar />
          <LiveStoriesBar />
        </>
      )}

      {/* Banner */}
      {["featured", "party", "mine"].includes(activeTab) && (
        <div className="pt-2 pb-1">
          <BannerSlider />
        </div>
      )}

      {/* Tab Content */}
      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "mine" && <MineTab />}
            {activeTab === "featured" && <PartyTab />}
            {activeTab === "party" && <PartyTab />}
            {activeTab === "hot" && <PartyTab />}
            {activeTab === "events" && <EventsTab />}
            {activeTab === "ranking" && <LeaderboardPage embedded />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomePage;
