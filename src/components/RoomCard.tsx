import { motion } from "framer-motion";
import { Users, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RoomCardProps {
  id: string;
  name: string;
  host: string;
  hostAvatar: string;
  listeners: number;
  speakers: number;
  isLive: boolean;
  isPrivate?: boolean;
  tags?: string[];
  coverImage?: string;
  countryFlag?: string;
  memberAvatars?: string[];
}

const gradients = [
  "from-pink-500/30 to-purple-600/30",
  "from-blue-500/30 to-cyan-500/30",
  "from-amber-500/30 to-red-500/30",
  "from-green-500/30 to-teal-500/30",
  "from-violet-500/30 to-fuchsia-500/30",
];

const RoomCard = ({
  id,
  name,
  host,
  hostAvatar,
  listeners,
  isLive,
  isPrivate,
  coverImage,
  countryFlag,
  memberAvatars = [],
}: RoomCardProps) => {
  const navigate = useNavigate();
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/room/${id}`)}
      className="relative overflow-hidden rounded-2xl bg-card border border-border/50 cursor-pointer shadow-card aspect-square"
    >
      {/* Cover / gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
        {coverImage && (
          <img src={coverImage} alt={name} className="w-full h-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Live badge */}
      {isLive && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-live/90 px-2 py-0.5 rounded-full z-10">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-white">LIVE</span>
        </div>
      )}

      {isPrivate && (
        <div className="absolute top-2 right-2 bg-background/60 backdrop-blur-sm rounded-full p-1 z-10">
          <Lock className="w-3 h-3 text-accent" />
        </div>
      )}

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="font-display font-bold text-white text-xs line-clamp-1 mb-0.5">{name}</h3>
        <div className="flex items-center gap-1 mb-2">
          {countryFlag && <span className="text-xs leading-none">{countryFlag}</span>}
          <span className="text-[10px] text-white/70 font-semibold truncate">{host}</span>
        </div>

        {/* Member avatars row + count */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {(memberAvatars.length > 0 ? memberAvatars.slice(0, 5) : [null, null, null]).map((av, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-black/40 bg-muted/60 overflow-hidden"
              >
                {av ? (
                  <img src={av} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-muted/40" />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-0.5">
            <Users className="w-3 h-3 text-white/80" />
            <span className="text-[10px] font-bold text-white/80">{listeners}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;
