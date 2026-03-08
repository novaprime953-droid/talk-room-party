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
  coverGradient?: string;
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
  coverGradient,
}: RoomCardProps) => {
  const navigate = useNavigate();
  const gradient = coverGradient || gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/room/${id}`)}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} border border-border/50 p-4 cursor-pointer shadow-card`}
    >
      {/* Live badge */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-live/90 px-2 py-0.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-primary-foreground">LIVE</span>
        </div>
      )}

      {isPrivate && (
        <div className="absolute top-3 left-3">
          <Lock className="w-3.5 h-3.5 text-accent" />
        </div>
      )}

      {/* Room name */}
      <h3 className="font-display font-bold text-foreground text-sm mb-3 pr-14 line-clamp-2">
        {name}
      </h3>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Host */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden">
          {hostAvatar ? (
            <img src={hostAvatar} alt={host} className="w-full h-full object-cover" />
          ) : (
            <Crown className="w-4 h-4" />
          )}
        </div>
        <span className="text-xs font-semibold text-foreground/80">{host}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="flex items-center gap-1">
          <Mic className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">{speakers}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{listeners}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RoomCard;
