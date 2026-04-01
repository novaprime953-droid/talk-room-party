import { motion } from "framer-motion";
import { Trophy, Crown, Coins, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGlobalRankings } from "@/hooks/useRoomRankings";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import FramedAvatar from "@/components/FramedAvatar";

const mainTabs = [
  { label: "Gifters", type: "gifters" as const },
  { label: "Hosts", type: "hosts" as const },
];

const periods = [
  { label: "Daily", value: "daily" as const },
  { label: "Weekly", value: "weekly" as const },
  { label: "Monthly", value: "monthly" as const },
];

const LeaderboardPage = ({ embedded }: { embedded?: boolean }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"gifters" | "hosts">("gifters");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: giftRankings, isLoading: giftLoading } = useGlobalRankings(period);
  const { data: hostLeaderboard, isLoading: hostLoading } = useLeaderboard("hosts");

  const isLoading = activeTab === "gifters" ? giftLoading : hostLoading;

  const entries = activeTab === "gifters"
    ? (giftRankings ?? []).map((r) => ({
        id: r.userId,
        name: r.name,
        avatar: r.avatar,
        score: r.total.toLocaleString(),
        scoreLabel: "coins",
      }))
    : (hostLeaderboard ?? []).map((h: any) => ({
        id: h.id,
        name: h.profiles?.display_name ?? h.profiles?.username ?? "Host",
        avatar: h.profiles?.avatar_url,
        score: Number(h.total_earnings).toLocaleString(),
        scoreLabel: "earned",
      }));

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className={embedded ? "" : "min-h-screen bg-background pb-20"}>
      <div className={embedded ? "" : "px-4 pt-4"}>
        {!embedded && (
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" /> Leaderboard
            </h1>
          </div>
        )}

        {/* Main tabs */}
        <div className="flex gap-2 mb-3">
          {mainTabs.map((tab) => (
            <motion.button
              key={tab.type}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.type)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === tab.type
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Period tabs (for gifters) */}
        {activeTab === "gifters" && (
          <div className="flex gap-2 mb-4">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  period === p.value
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-muted/20 text-muted-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-8 h-48">
                {[1, 0, 2].map((idx) => {
                  const entry = top3[idx];
                  if (!entry) return <div key={idx} className="w-16" />;
                  const heights = ["h-28", "h-20", "h-14"];
                  const badges = ["👑", "🥈", "🥉"];
                  const isFirst = idx === 0;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      {isFirst && <Crown className="w-6 h-6 text-accent mb-1 animate-float" />}
                      <FramedAvatar
                        src={entry.avatar}
                        name={entry.name}
                        size={isFirst ? "lg" : "md"}
                        showGlow={isFirst}
                      />
                      <p className={`${isFirst ? "text-sm" : "text-xs"} font-bold text-foreground mt-1`}>
                        {entry.name}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <Coins className="w-3 h-3 text-accent" />
                        <span className={`text-[10px] ${isFirst ? "text-accent font-bold" : "text-muted-foreground"}`}>
                          {entry.score}
                        </span>
                      </div>
                      <div className={`w-16 ${heights[idx]} gradient-card rounded-t-xl mt-2 border border-border/30`} />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest */}
            <div className="space-y-2">
              {rest.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-card"
                >
                  <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                    #{i + 4}
                  </span>
                  <FramedAvatar src={item.avatar} name={item.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-accent" />
                    <span className="text-sm font-bold text-accent">{item.score}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {entries.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-12">No data yet</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
