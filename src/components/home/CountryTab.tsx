import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import RoomCard from "@/components/RoomCard";
import EmptyState from "@/components/EmptyState";
import { useRoomsByCountry } from "@/hooks/useRooms";

const countries = [
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "GB", name: "UK", flag: "🇬🇧" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
];

const CountryTab = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: rooms, isLoading } = useRoomsByCountry(selected ?? "");

  if (selected) {
    const country = countries.find(c => c.code === selected);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-lg">{country?.flag}</span>
          {country?.name} Rooms
        </button>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => <div key={i} className="h-44 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {rooms.map((room: any) => {
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
                  countryFlag={country?.flag}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState title="No Rooms" description={`No active rooms in ${country?.name} right now`} />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {countries.map(c => (
        <motion.button
          key={c.code}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelected(c.code)}
          className="bg-card rounded-2xl p-4 flex flex-col items-center gap-2 shadow-card border border-border/50 hover:border-primary/30 transition-colors"
        >
          <span className="text-3xl">{c.flag}</span>
          <span className="text-xs font-bold text-foreground">{c.name}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default CountryTab;
