import { useState } from "react";
import { Bell, Search, Coins } from "lucide-react";
import { motion } from "framer-motion";
import RoomCard from "@/components/RoomCard";
import { useLiveRooms } from "@/hooks/useRooms";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

const categories = [
  { label: "🔥 All", value: "all" },
  { label: "🎵 Music", value: "music" },
  { label: "💬 Chat", value: "chat" },
  { label: "🎮 Gaming", value: "gaming" },
  { label: "💕 Dating", value: "dating" },
  { label: "📚 Education", value: "education" },
  { label: "🌍 Language", value: "language" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const { data: rooms, isLoading } = useLiveRooms(activeCategory);
  const { data: profile } = useProfile();
  const { data: unreadCount } = useUnreadCount();

  const filteredRooms = rooms?.filter((r) =>
    !search || r.room_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold text-gradient-primary">
            Talk Room
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-full"
            >
              <Coins className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-accent">
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
        <div className="flex items-center gap-2 bg-muted/30 rounded-2xl px-4 py-2.5 mb-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms, users..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.value)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeCategory === cat.value
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Live Now Banner */}
      <div className="px-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-2xl p-4 glow-primary relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
          <p className="text-xs font-semibold text-primary-foreground/80 mb-1">🔴 Live Now</p>
          <h2 className="font-display font-bold text-lg text-primary-foreground mb-1">
            Weekly Talent Show
          </h2>
          <p className="text-xs text-primary-foreground/70 mb-3">
            Win up to 10,000 coins! Join now
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/events")}
            className="bg-primary-foreground/20 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-primary-foreground"
          >
            View Events →
          </motion.button>
        </motion.div>
      </div>

      {/* Rooms Grid */}
      <div className="px-4">
        <h2 className="font-display font-bold text-lg text-foreground mb-3">
          {activeCategory === "all" ? "Popular Rooms" : `${activeCategory} Rooms`}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : filteredRooms && filteredRooms.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                id={room.id}
                name={room.room_name}
                host="Host"
                hostAvatar=""
                listeners={room.listener_count}
                speakers={0}
                isLive={room.is_live}
                isPrivate={room.privacy_type === "private"}
                tags={[room.category]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No rooms found</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/create")}
              className="mt-3 gradient-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold"
            >
              Create a Room
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
