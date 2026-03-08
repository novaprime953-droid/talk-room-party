import { Bell, Search, Coins } from "lucide-react";
import { motion } from "framer-motion";
import RoomCard from "@/components/RoomCard";

const featuredRooms = [
  { id: "1", name: "🎶 Late Night Vibes - Music & Chill", host: "DJ Luna", hostAvatar: "", listeners: 234, speakers: 5, isLive: true, tags: ["Music", "Chill"] },
  { id: "2", name: "💬 Real Talk: Life, Love & Growth", host: "Sarah K", hostAvatar: "", listeners: 189, speakers: 3, isLive: true, tags: ["Talk", "Relationships"] },
  { id: "3", name: "🎮 Gaming Night - Among Us", host: "GamerX", hostAvatar: "", listeners: 567, speakers: 8, isLive: true, tags: ["Gaming", "Fun"] },
  { id: "4", name: "🌍 Arabic Lounge - أهلا وسهلا", host: "Ahmed", hostAvatar: "", listeners: 312, speakers: 6, isLive: true, isPrivate: true, tags: ["Arabic", "Social"] },
  { id: "5", name: "🎤 Open Mic Comedy Hour", host: "FunnyBones", hostAvatar: "", listeners: 445, speakers: 4, isLive: true, tags: ["Comedy", "Entertainment"] },
  { id: "6", name: "📚 Book Club: February Pick", host: "ReadWithMe", hostAvatar: "", listeners: 78, speakers: 2, isLive: false, tags: ["Books", "Culture"] },
];

const categories = ["🔥 Hot", "🎵 Music", "💬 Chat", "🎮 Gaming", "💕 Dating", "📚 Education", "🌍 Language"];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold text-gradient-primary">
            Talk Room
          </h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-full">
              <Coins className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-accent">2,450</span>
            </button>
            <button className="relative p-2 text-muted-foreground">
              <Bell className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-live rounded-full" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-muted/30 rounded-2xl px-4 py-2.5 mb-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search rooms, users..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                i === 0
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {cat}
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
            className="bg-primary-foreground/20 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-primary-foreground"
          >
            Join Event →
          </motion.button>
        </motion.div>
      </div>

      {/* Rooms Grid */}
      <div className="px-4">
        <h2 className="font-display font-bold text-lg text-foreground mb-3">
          Popular Rooms
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {featuredRooms.map((room) => (
            <RoomCard key={room.id} {...room} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
