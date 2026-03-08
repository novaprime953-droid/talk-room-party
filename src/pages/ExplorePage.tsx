import { motion } from "framer-motion";
import { Search, TrendingUp, Users, Globe } from "lucide-react";
import { useState } from "react";
import RoomCard from "@/components/RoomCard";
import { useLiveRooms } from "@/hooks/useRooms";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useNavigate } from "react-router-dom";

const ExplorePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: rooms } = useLiveRooms();
  const { data: topHosts } = useLeaderboard("hosts");

  const filteredRooms = rooms?.filter((r) =>
    !search || r.room_name.toLowerCase().includes(search.toLowerCase())
  );

  const liveCount = rooms?.length ?? 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-display font-bold text-foreground mb-4">Explore</h1>

        <div className="flex items-center gap-2 bg-muted/30 rounded-2xl px-4 py-2.5 mb-6">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms, hosts, topics..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Globe, label: "Rooms Live", value: liveCount.toLocaleString(), color: "text-primary" },
            { icon: Users, label: "Top Hosts", value: (topHosts?.length ?? 0).toString(), color: "text-online" },
            { icon: TrendingUp, label: "Trending", value: Math.min(liveCount, 10).toString(), color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-3 text-center shadow-card">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Top Hosts */}
        {topHosts && topHosts.length > 0 && (
          <>
            <h2 className="font-display font-bold text-lg text-foreground mb-3">🌟 Top Hosts</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6">
              {topHosts.slice(0, 10).map((host: any, i: number) => (
                <motion.div
                  key={host.id}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1.5 min-w-[70px]"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
                      i === 0 ? "ring-2 ring-accent glow-gold" : "ring-1 ring-border"
                    } bg-muted/50 overflow-hidden`}
                  >
                    {host.profiles?.avatar_url ? (
                      <img src={host.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-foreground">
                        {(host.profiles?.display_name ?? "H").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-foreground truncate w-full text-center">
                    {host.profiles?.display_name ?? host.profiles?.username ?? "Host"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Lv.{host.level}</span>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Rooms */}
        <h2 className="font-display font-bold text-lg text-foreground mb-3">🔥 Trending</h2>
        {filteredRooms && filteredRooms.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                id={room.id}
                name={room.room_name}
                host={room.profiles?.display_name ?? room.profiles?.username ?? "Host"}
                hostAvatar={room.profiles?.avatar_url ?? ""}
                listeners={room.listener_count}
                speakers={0}
                isLive={room.is_live}
                isPrivate={room.privacy_type === "private"}
                tags={[room.category]}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">No live rooms right now</p>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
