import { motion } from "framer-motion";
import { Users, Lock, Mic } from "lucide-react";
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
  "from-purple-600/40 to-indigo-700/40",
  "from-pink-600/40 to-purple-700/40",
  "from-blue-600/40 to-purple-600/40",
  "from-violet-600/40 to-fuchsia-600/40",
  "from-indigo-500/40 to-purple-600/40",
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
      className="relative overflow-hidden rounded-2xl bg-card cursor-pointer aspect-square group"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)' }}
    >
      {/* Cover / gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
        {coverImage && (
          <img src={coverImage} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>

      {/* Live badge */}
      {isLive && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-live px-2 py-0.5 rounded-full z-10 animate-live-pulse">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
          <span className="text-[8px] font-bold text-white tracking-wider">LIVE</span>
        </div>
      )}

      {isPrivate && (
        <div className="absolute top-2 right-2 bg-background/60 backdrop-blur-sm rounded-full p-1 z-10">
          <Lock className="w-3 h-3 text-accent" />
        </div>
      )}

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="font-display font-bold text-white text-xs line-clamp-1 mb-1 drop-shadow-lg">{name}</h3>
        <div className="flex items-center gap-1.5 mb-2">
          {countryFlag && <span className="text-xs leading-none">{countryFlag}</span>}
          <span className="text-[10px] text-white/80 font-medium truncate">{host}</span>
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
          <div className="flex items-center gap-1 glass rounded-full px-2 py-0.5">
            <Users className="w-3 h-3 text-white/80" />
            <span className="text-[10px] font-bold text-white/90">{listeners}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;
