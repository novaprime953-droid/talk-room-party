import { motion } from "framer-motion";
import { Users, Mic, Lock, Crown } from "lucide-react";
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
}

const gradients = [
  "from-pink-500/20 to-purple-600/20",
  "from-blue-500/20 to-cyan-500/20",
  "from-amber-500/20 to-red-500/20",
  "from-green-500/20 to-teal-500/20",
  "from-violet-500/20 to-fuchsia-500/20",
];

const RoomCard = ({
  id,
  name,
  host,
  hostAvatar,
  listeners,
  speakers,
  isLive,
  isPrivate,
  tags = [],
  coverImage,
  countryFlag,
}: RoomCardProps) => {
  const navigate = useNavigate();
  // Deterministic gradient based on room id to prevent flickering on re-renders
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/room/${id}`)}
      className="relative overflow-hidden rounded-2xl bg-card border border-border/50 cursor-pointer shadow-card"
    >
      {/* Room Avatar / Cover */}
      <div className={`relative h-24 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {coverImage && (
          <img src={coverImage} alt={name} className="w-full h-full object-cover absolute inset-0" />
        )}
        {/* Live badge */}
        {isLive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-live/90 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-primary-foreground">LIVE</span>
          </div>
        )}
        {isPrivate && (
          <div className="absolute top-2 left-2 bg-background/60 backdrop-blur-sm rounded-full p-1">
            <Lock className="w-3 h-3 text-accent" />
          </div>
        )}
        {countryFlag && (
          <div className="absolute bottom-2 right-2 text-lg leading-none">{countryFlag}</div>
        )}
        {/* Host avatar overlay */}
        <div className="absolute -bottom-4 left-3">
          <div className="w-10 h-10 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden">
            {hostAvatar ? (
              <img src={hostAvatar} alt={host} className="w-full h-full object-cover" />
            ) : (
              <Crown className="w-4 h-4 text-accent" />
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="pt-5 pb-3 px-3">
        <h3 className="font-display font-bold text-foreground text-xs line-clamp-1 mb-1">{name}</h3>
        <p className="text-[10px] text-muted-foreground font-semibold mb-2 truncate">{host}</p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-muted-foreground">
          {speakers > 0 && (
            <div className="flex items-center gap-1">
              <Mic className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold">{speakers}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span className="text-[10px] font-semibold">{listeners}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;
