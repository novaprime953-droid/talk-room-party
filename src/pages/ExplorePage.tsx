import { motion } from "framer-motion";
import { Search, TrendingUp, Users, Globe } from "lucide-react";
import RoomCard from "@/components/RoomCard";

const trendingRooms = [
  { id: "10", name: "🎤 Karaoke Night - Sing Along!", host: "VocalStar", hostAvatar: "", listeners: 890, speakers: 6, isLive: true, tags: ["Karaoke"] },
  { id: "11", name: "🧠 Trivia Challenge: Science Edition", host: "QuizMaster", hostAvatar: "", listeners: 340, speakers: 4, isLive: true, tags: ["Trivia"] },
  { id: "12", name: "🎧 Lo-Fi Study Room", host: "ChillBeats", hostAvatar: "", listeners: 1200, speakers: 1, isLive: true, tags: ["Study", "Music"] },
  { id: "13", name: "💪 Motivation Monday Talk", host: "CoachMax", hostAvatar: "", listeners: 456, speakers: 3, isLive: true, tags: ["Motivation"] },
];

const topHosts = [
  { name: "DJ Luna", followers: "12.5K", avatar: "🎵" },
  { name: "Sarah K", followers: "8.3K", avatar: "💬" },
  { name: "GamerX", followers: "15.1K", avatar: "🎮" },
  { name: "Ahmed", followers: "9.7K", avatar: "🌍" },
  { name: "CoachMax", followers: "6.2K", avatar: "💪" },
];

const ExplorePage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-display font-bold text-foreground mb-4">Explore</h1>

        <div className="flex items-center gap-2 bg-muted/30 rounded-2xl px-4 py-2.5 mb-6">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search rooms, hosts, topics..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Globe, label: "Rooms Live", value: "1,234", color: "text-primary" },
            { icon: Users, label: "Online Now", value: "45.6K", color: "text-online" },
            { icon: TrendingUp, label: "Trending", value: "89", color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-3 text-center shadow-card">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Top Hosts */}
        <h2 className="font-display font-bold text-lg text-foreground mb-3">🌟 Top Hosts</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6">
          {topHosts.map((host, i) => (
            <motion.div
              key={host.name}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 min-w-[70px]"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                i === 0 ? "ring-2 ring-accent glow-gold" : "ring-1 ring-border"
              } bg-muted/50`}>
                {host.avatar}
              </div>
              <span className="text-[11px] font-semibold text-foreground truncate w-full text-center">
                {host.name}
              </span>
              <span className="text-[10px] text-muted-foreground">{host.followers}</span>
            </motion.div>
          ))}
        </div>

        {/* Trending Rooms */}
        <h2 className="font-display font-bold text-lg text-foreground mb-3">🔥 Trending</h2>
        <div className="grid grid-cols-2 gap-3">
          {trendingRooms.map((room) => (
            <RoomCard key={room.id} {...room} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
