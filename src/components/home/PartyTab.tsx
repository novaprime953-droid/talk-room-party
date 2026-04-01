import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Globe } from "lucide-react";
import RoomCard from "@/components/RoomCard";
import EmptyState from "@/components/EmptyState";
import { useLiveRooms } from "@/hooks/useRooms";

const countries = [
  { code: "all", flag: "⭐", name: "Recommend" },
  { code: "PK", flag: "🇵🇰", name: "PK" },
  { code: "IN", flag: "🇮🇳", name: "IN" },
  { code: "AE", flag: "🇦🇪", name: "AE" },
  { code: "SA", flag: "🇸🇦", name: "SA" },
  { code: "US", flag: "🇺🇸", name: "US" },
  { code: "TR", flag: "🇹🇷", name: "TR" },
  { code: "EG", flag: "🇪🇬", name: "EG" },
  { code: "BD", flag: "🇧🇩", name: "BD" },
];

const PartyTab = () => {
  const [filter, setFilter] = useState("all");
  const { data: rooms, isLoading } = useLiveRooms();

  const filteredRooms = rooms
    ? filter === "all"
      ? rooms
      : rooms.filter((r: any) => r.country === filter)
    : [];

  return (
    <div className="space-y-4">
      {/* Filter: Recommend + Countries */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {countries.map((c) => (
          <motion.button
            key={c.code}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(c.code)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filter === c.code
                ? "gradient-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <span className="text-sm">{c.flag}</span>
            {c.name}
          </motion.button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredRooms.map((room: any) => {
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
                coverImage={room.cover_image}
                countryFlag={room.country ? getFlagEmoji(room.country) : undefined}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState title="No Rooms Live" subtitle="Be the first to go live!" />
      )}
    </div>
  );
};

function getFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🌍";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export default PartyTab;
