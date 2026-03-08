import { motion } from "framer-motion";
import { Mic, MicOff, Crown } from "lucide-react";

interface SeatProps {
  index: number;
  user?: {
    name: string;
    avatar?: string;
    isSpeaking?: boolean;
    isMuted?: boolean;
    isHost?: boolean;
  };
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

const VoiceSeat = ({ index, user, onTap }: SeatProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className="flex flex-col items-center gap-1.5 w-20"
    >
      <div
        className={`relative w-14 h-14 rounded-full flex items-center justify-center ${
          user
            ? user.isSpeaking
              ? "ring-2 ring-primary animate-pulse-glow"
              : "ring-1 ring-border"
            : "border-2 border-dashed border-muted-foreground/30"
        } bg-muted/50 overflow-hidden`}
      >
        {user ? (
          <>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            {user.isHost && (
              <div className="absolute -top-1 -right-1 w-5 h-5 gradient-gold rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-accent-foreground" />
              </div>
            )}
            {user.isMuted && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                <MicOff className="w-3 h-3 text-destructive-foreground" />
              </div>
            )}
          </>
        ) : (
          <Mic className="w-5 h-5 text-muted-foreground/40" />
        )}
      </div>

      {user && (
        <>
          <span className="text-[11px] font-semibold text-foreground truncate w-full text-center">
            {user.name}
          </span>
          {user.isSpeaking && <SoundWave />}
        </>
      )}
      {!user && (
        <span className="text-[10px] text-muted-foreground">Seat {index + 1}</span>
      )}
    </motion.button>
  );
};

export default VoiceSeat;
