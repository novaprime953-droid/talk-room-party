import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Coins } from "lucide-react";
import { useRoomRankings } from "@/hooks/useRoomRankings";
import FramedAvatar from "./FramedAvatar";

const periods = [
  { label: "Daily", value: "daily" as const },
  { label: "Weekly", value: "weekly" as const },
  { label: "Monthly", value: "monthly" as const },
];

const RoomRankings = ({ roomId }: { roomId: string }) => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const { data: rankings, isLoading } = useRoomRankings(roomId, period);

  const top3 = rankings?.slice(0, 3) ?? [];
  const rest = rankings?.slice(3) ?? [];

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-accent" />
        <h3 className="font-display font-bold text-sm text-foreground">Room Rankings</h3>
      </div>

      <div className="flex gap-2 mb-4">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              period === p.value
                ? "gradient-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rankings?.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-8">No rankings yet</p>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length >= 1 && (
              <div className="flex items-end justify-center gap-4 mb-4 pt-2">
                {[1, 0, 2].map((idx) => {
                  if (!top3[idx]) return <div key={idx} className="w-16" />;
                  const user = top3[idx];
                  const badges = ["👑", "🥈", "🥉"];
                  const isFirst = idx === 0;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-sm mb-1">{badges[idx]}</span>
                      <FramedAvatar
                        src={user.avatar}
                        name={user.name}
                        size={isFirst ? "md" : "sm"}
                        showGlow={isFirst}
                      />
                      <p className="text-[10px] font-bold text-foreground mt-1 truncate max-w-[60px] text-center">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <Coins className="w-2.5 h-2.5 text-accent" />
                        <span className="text-[9px] font-bold text-accent">{user.total.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {rest.map((user, i) => (
              <motion.div
                key={user.userId}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.03 * i }}
                className="flex items-center gap-2 bg-muted/20 rounded-xl px-3 py-2"
              >
                <span className="w-5 text-[10px] font-bold text-muted-foreground">#{i + 4}</span>
                <FramedAvatar src={user.avatar} name={user.name} size="xs" />
                <span className="flex-1 text-xs font-semibold text-foreground truncate">{user.name}</span>
                <div className="flex items-center gap-0.5">
                  <Coins className="w-2.5 h-2.5 text-accent" />
                  <span className="text-[10px] font-bold text-accent">{user.total.toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default RoomRankings;
