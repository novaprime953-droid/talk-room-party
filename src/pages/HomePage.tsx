import { useState } from "react";
import { Search, Crown, Home, PartyPopper, CalendarDays, Globe, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import MineTab from "@/components/home/MineTab";
import PartyTab from "@/components/home/PartyTab";
import EventsTab from "@/components/home/EventsTab";
import CountryTab from "@/components/home/CountryTab";
import BannerSlider from "@/components/home/BannerSlider";
import LeaderboardPage from "@/pages/LeaderboardPage";

const tabs = [
  { key: "mine", label: "Mine", icon: Home },
  { key: "party", label: "Party", icon: PartyPopper },
  { key: "live", label: "Live", icon: Radio },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "country", label: "Country", icon: Globe },
  { key: "ranking", label: "Ranking", icon: Crown },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("party");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-display font-bold text-gradient-primary">Talk Room</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 text-muted-foreground">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab("ranking")}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-warning flex items-center justify-center shadow-lg"
            >
              <Crown className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Search (collapsible) */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 bg-muted/30 rounded-2xl px-4 py-2 mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search rooms, users..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Banner - only show on party/mine/live */}
      {["party", "mine", "live"].includes(activeTab) && (
        <div className="pt-3 pb-1">
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
            {activeTab === "party" && <PartyTab />}
            {activeTab === "live" && <PartyTab />}
            {activeTab === "events" && <EventsTab />}
            {activeTab === "country" && <CountryTab />}
            {activeTab === "ranking" && <LeaderboardPage embedded />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomePage;
