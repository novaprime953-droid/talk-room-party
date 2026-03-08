import { motion } from "framer-motion";
import { Trophy, Crown, Coins, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const tabs = [
  { label: "Hosts", type: "hosts" as const },
  { label: "Gifters", type: "gifters" as const },
  { label: "Earners", type: "receivers" as const },
];

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"hosts" | "gifters" | "receivers">("hosts");
  const { data: leaderboard, isLoading } = useLeaderboard(activeTab);

  const getEntry = (item: any, i: number) => {
    if (activeTab === "hosts") {
      return {
        name: item.profiles?.display_name ?? item.profiles?.username ?? "Host",
        avatar: item.profiles?.avatar_url,
        score: `${Number(item.total_earnings).toLocaleString()}`,
      };
    }
    return {
      name: item.display_name ?? item.username ?? "User",
      avatar: item.avatar_url,
      score: `Lv.${item.level}`,
    };
  };

  const top3 = leaderboard?.slice(0, 3) ?? [];
  const rest = leaderboard?.slice(3) ?? [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" /> Leaderboard
          </h1>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
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
              <div className="flex items-end justify-center gap-3 mb-8 h-44">
                {[1, 0, 2].map((idx) => {
                  const entry = getEntry(top3[idx], idx);
                  const heights = ["h-28", "h-20", "h-14"];
                  const sizes = ["w-20 h-20", "w-16 h-16", "w-16 h-16"];
                  const badges = ["👑", "🥈", "🥉"];

                  return (
                    <motion.div
                      key={idx}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      {idx === 0 && <Crown className="w-6 h-6 text-accent mb-1 animate-float" />}
                      <div className={`${sizes[idx]} rounded-full bg-muted/50 ${
                        idx === 0 ? "ring-2 ring-accent glow-gold" : "ring-1 ring-border"
                      } flex items-center justify-center overflow-hidden mb-1`}>
                        {entry.avatar ? (
                          <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{badges[idx]}</span>
                        )}
                      </div>
                      <p className={`${idx === 0 ? "text-sm" : "text-xs"} font-bold text-foreground`}>
                        {entry.name}
                      </p>
                      <p className={`text-[10px] ${idx === 0 ? "text-accent font-bold" : "text-muted-foreground"}`}>
                        {entry.score}
                      </p>
                      <div className={`w-16 ${heights[idx]} gradient-card rounded-t-xl mt-2 border border-border/30`} />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest */}
            <div className="space-y-2">
              {rest.map((item: any, i: number) => {
                const entry = getEntry(item, i + 3);
                return (
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
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-foreground">
                          {entry.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-accent" />
                      <span className="text-sm font-bold text-accent">{entry.score}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {(!leaderboard || leaderboard.length === 0) && (
              <p className="text-center text-muted-foreground text-sm py-12">No data yet</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
