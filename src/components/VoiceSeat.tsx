import { motion } from "framer-motion";
import { MicOff, Crown, Lock, Heart } from "lucide-react";
import FramedAvatar from "./FramedAvatar";
import LevelBadge from "./LevelBadge";
import VIPBadge from "./VIPBadge";
import seatEmpty from "@/assets/seat-empty.png";

interface SeatProps {
  index: number;
  user?: {
    name: string;
    avatar?: string;
    isSpeaking?: boolean;
    isMuted?: boolean;
    isHost?: boolean;
    frameUrl?: string | null;
    level?: number;
    vipLevel?: number;
  };
  isLocked?: boolean;
  isMySeat?: boolean;
  alreadySeatedElsewhere?: boolean;
  onTap?: () => void;
}

const SoundWave = () => (
  <div className="flex items-center gap-[2px] h-4">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-[3px] rounded-full gradient-primary"
        animate={{ height: ["4px", "14px", "4px"] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const VoiceSeat = ({ index, user, isLocked, isMySeat, alreadySeatedElsewhere, onTap }: SeatProps) => {
  const isHostSeat = index === 0;
  const label = isHostSeat ? "Host" : `No.${index + 1}`;
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className="flex flex-col items-center gap-1.5 w-20"
    >
      <div className="relative">
        {user ? (
          <>
            <FramedAvatar
              src={user.avatar}
              name={user.name}
              frameUrl={user.frameUrl}
              size="md"
              showGlow={user.isSpeaking}
            />
            {user.isHost && (
              <div className="absolute -top-1 -right-1 w-5 h-5 gradient-gold rounded-full flex items-center justify-center z-20">
                <Crown className="w-3 h-3 text-accent-foreground" />
              </div>
            )}
            {user.isMuted && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-destructive rounded-full flex items-center justify-center z-20">
                <MicOff className="w-3 h-3 text-destructive-foreground" />
              </div>
            )}
            {isMySeat && (
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center z-20 ring-2 ring-background">
                <span className="text-[8px] font-bold text-primary-foreground">ME</span>
              </div>
            )}
          </>
        ) : (
          <div className="relative w-14 h-14">
            {/* Glow */}
            <div className={`absolute inset-0 rounded-full ${isLocked ? "bg-destructive/10" : alreadySeatedElsewhere ? "bg-amber-400/15" : "bg-emerald-400/15"} blur-md`} />
            {/* Ring */}
            <div
              className={`relative w-14 h-14 rounded-full flex items-center justify-center bg-background/40 backdrop-blur-sm ring-2 ${
                isLocked
                  ? "ring-destructive/40"
                  : alreadySeatedElsewhere
                  ? "ring-amber-400/70 shadow-[0_0_18px_rgba(251,191,36,0.45)]"
                  : "ring-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
              }`}
            >
              {isLocked ? (
                <Lock className="w-5 h-5 text-destructive/70" />
              ) : (
                <img
                  src={seatEmpty}
                  alt="Empty seat"
                  loading="lazy"
                  width={56}
                  height={56}
                  className={`w-9 h-9 object-contain ${alreadySeatedElsewhere ? "opacity-60" : ""}`}
                />
              )}
            </div>
            {alreadySeatedElsewhere && !isLocked && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center z-20 ring-2 ring-background">
                <span className="text-[8px] font-bold text-white">!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {user && (
        <>
          <span className="text-[11px] font-semibold text-foreground truncate w-full text-center">
            {user.name}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-rose-400">
            <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
            <span className="font-bold">0</span>
          </div>
          {user.isSpeaking && <SoundWave />}
        </>
      )}
      {!user && (
        <>
          <span className={`text-[11px] font-semibold ${alreadySeatedElsewhere ? "text-amber-400" : "text-foreground/90"}`}>
            {isLocked ? "Locked" : alreadySeatedElsewhere ? "Switch?" : label}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-rose-400/80">
            <Heart className="w-2.5 h-2.5 fill-rose-500/70 text-rose-500/70" />
            <span className="font-bold">0</span>
          </div>
        </>
      )}
    </motion.button>
  );
};

export default VoiceSeat;
