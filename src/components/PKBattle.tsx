import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Crown, Heart, Timer, Zap, X } from "lucide-react";
import FramedAvatar from "./FramedAvatar";

interface PKHost {
  name: string;
  avatar?: string;
  score: number;
  hp: number;
  maxHp: number;
}

interface PKBattleProps {
  open: boolean;
  onClose: () => void;
  host1?: PKHost;
  host2?: PKHost;
  timeLeft?: number;
}

const defaultHost = (side: "left" | "right"): PKHost => ({
  name: side === "left" ? "Host A" : "Host B",
  score: 0,
  hp: 100,
  maxHp: 100,
});

const PKBattle = ({ open, onClose, host1, host2, timeLeft = 300 }: PKBattleProps) => {
  const h1 = host1 ?? defaultHost("left");
  const h2 = host2 ?? defaultHost("right");
  const [timer, setTimer] = useState(timeLeft);

  useEffect(() => {
    if (!open) return;
    setTimer(timeLeft);
    const interval = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [open, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const h1Pct = (h1.hp / h1.maxHp) * 100;
  const h2Pct = (h2.hp / h2.maxHp) * 100;
  const totalScore = h1.score + h2.score || 1;
  const h1ScorePct = (h1.score / totalScore) * 100;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative z-20 mx-3 mb-3"
      >
        <div className="glass-strong rounded-2xl p-3 border border-red-500/30 relative overflow-hidden">
          {/* Background fire effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-blue-500/5 pointer-events-none" />

          {/* Close */}
          <button onClick={onClose} className="absolute top-2 right-2 z-10 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>

          {/* PK Header */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Swords className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">PK Battle</span>
            <div className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-red-500/20">
              <Timer className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-mono font-bold text-red-400">{formatTime(timer)}</span>
            </div>
          </div>

          {/* Split screen */}
          <div className="flex gap-3">
            {/* Host 1 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-2">
                <FramedAvatar src={h1.avatar} name={h1.name} size="md" showGlow />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-500/90 text-[8px] font-bold text-white whitespace-nowrap">
                  RED
                </div>
              </div>
              <p className="text-xs font-bold text-foreground truncate max-w-[80px]">{h1.name}</p>

              {/* HP Bar */}
              <div className="w-full mt-2">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span className="text-[9px] font-bold text-red-400">{h1.hp}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">/{h1.maxHp}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    animate={{ width: `${h1Pct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400"
                  />
                </div>
              </div>

              {/* Score */}
              <div className="mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-sm font-bold text-foreground">{h1.score.toLocaleString()}</span>
              </div>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-blue-500 flex items-center justify-center shadow-lg"
              >
                <span className="text-xs font-black text-white">VS</span>
              </motion.div>
            </div>

            {/* Host 2 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-2">
                <FramedAvatar src={h2.avatar} name={h2.name} size="md" showGlow />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-blue-500/90 text-[8px] font-bold text-white whitespace-nowrap">
                  BLUE
                </div>
              </div>
              <p className="text-xs font-bold text-foreground truncate max-w-[80px]">{h2.name}</p>

              {/* HP Bar */}
              <div className="w-full mt-2">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3 text-blue-400" />
                    <span className="text-[9px] font-bold text-blue-400">{h2.hp}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">/{h2.maxHp}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    animate={{ width: `${h2Pct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                  />
                </div>
              </div>

              {/* Score */}
              <div className="mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-sm font-bold text-foreground">{h2.score.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Score progress bar */}
          <div className="mt-3 h-1.5 rounded-full overflow-hidden flex">
            <motion.div
              animate={{ width: `${h1ScorePct}%` }}
              className="h-full bg-gradient-to-r from-red-500 to-red-400"
            />
            <motion.div
              animate={{ width: `${100 - h1ScorePct}%` }}
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PKBattle;