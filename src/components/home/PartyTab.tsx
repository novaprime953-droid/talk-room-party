import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, Clock } from "lucide-react";
import RoomCard from "@/components/RoomCard";
import EmptyState from "@/components/EmptyState";
import { useLiveRooms } from "@/hooks/useRooms";

const sortOptions = [
  { label: "Popular", value: "popular", icon: TrendingUp },
  { label: "New", value: "new", icon: Sparkles },
  { label: "Trending", value: "trending", icon: Clock },
];

const PartyTab = () => {
  const [sort, setSort] = useState("popular");
  const { data: rooms, isLoading } = useLiveRooms();

  const sortedRooms = rooms ? [...rooms].sort((a, b) => {
    if (sort === "new") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "trending") return b.listener_count - a.listener_count;
    return b.listener_count - a.listener_count; // popular
  }) : [];

  return (
    <div className="space-y-4">
      {/* Sort options */}
      <div className="flex gap-2">
        {sortOptions.map(opt => (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSort(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              sort === opt.value
                ? "gradient-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <opt.icon className="w-3 h-3" />
            {opt.label}
          </motion.button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-44 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : sortedRooms.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {sortedRooms.map((room) => {
            const hp = room.profiles as any;
            return (
              <RoomCard
                key={room.id}
                id={room.id}
                name={room.room_name}
                host={hp?.display_name ?? hp?.username ?? "Host"}
                hostAvatar={hp?.avatar_url ?? ""}
                listeners={room.listener_count}
                speakers={0}
                isLive={room.is_live}
                isPrivate={room.privacy_type === "private"}
                tags={[room.category]}
                coverImage={room.cover_image}
                countryFlag={room.country ? getFlagEmoji(room.country) : undefined}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState title="No Rooms Live" description="Be the first to go live!" />
      )}
    </div>
  );
};

function getFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🌍";
  return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export default PartyTab;
