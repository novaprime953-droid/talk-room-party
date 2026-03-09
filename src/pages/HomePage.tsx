import { useState } from "react";
import { Bell, Search, Coins, Home, PartyPopper, CalendarDays, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import MineTab from "@/components/home/MineTab";
import PartyTab from "@/components/home/PartyTab";
import EventsTab from "@/components/home/EventsTab";
import CountryTab from "@/components/home/CountryTab";

const tabs = [
  { key: "mine", label: "Mine", icon: Home },
  { key: "party", label: "Party", icon: PartyPopper },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "country", label: "Country", icon: Globe },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mine");
  const [search, setSearch] = useState("");
  const { data: profile } = useProfile();
  const { data: unreadCount } = useUnreadCount();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-display font-bold text-gradient-primary">Talk Room</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-full"
            >
              <Coins className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-bold text-accent">
                {profile?.coins_balance?.toLocaleString() ?? "0"}
              </span>
            </button>
            <button
              onClick={() => navigate("/notifications")}
              className="relative p-2 text-muted-foreground"
            >
              <Bell className="w-5 h-5" />
              {(unreadCount ?? 0) > 0 && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-live rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary-foreground">
                    {unreadCount! > 9 ? "9+" : unreadCount}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
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

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/30 rounded-2xl p-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
            {activeTab === "events" && <EventsTab />}
            {activeTab === "country" && <CountryTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomePage;
