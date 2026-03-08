import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Star, TrendingUp, Gift, Users, Coins, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const levelThresholds = [
  { level: 1, earnings: 0, title: "Newcomer" },
  { level: 2, earnings: 10, title: "Rising Star" },
  { level: 3, earnings: 50, title: "Popular Host" },
  { level: 4, earnings: 150, title: "Star Host" },
  { level: 5, earnings: 500, title: "Super Host" },
  { level: 6, earnings: 1000, title: "Elite Host" },
  { level: 7, earnings: 2500, title: "Legend" },
  { level: 8, earnings: 5000, title: "Icon" },
  { level: 9, earnings: 10000, title: "Master" },
  { level: 10, earnings: 25000, title: "Grand Master" },
];

const HostLevel = () => {
  const { user } = useAuth();

  const { data: host } = useQuery({
    queryKey: ["host-level-record", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("hosts").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["host-level-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: leaderboard } = useLeaderboard("hosts");

  const currentLevel = host?.level ?? 1;
  const totalEarnings = Number(host?.total_earnings ?? 0);
  const currentThreshold = levelThresholds.find((l) => l.level === currentLevel) ?? levelThresholds[0];
  const nextThreshold = levelThresholds.find((l) => l.level === currentLevel + 1);
  const progress = nextThreshold
    ? Math.min(100, ((totalEarnings - currentThreshold.earnings) / (nextThreshold.earnings - currentThreshold.earnings)) * 100)
    : 100;

  // My rank in leaderboard
  const myRank = leaderboard?.findIndex((h: any) => h.user_id === user?.id);
  const rankDisplay = myRank !== undefined && myRank >= 0 ? myRank + 1 : "-";

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-accent" /> Host Level
      </h1>

      {/* Current Level Card */}
      <div className="bg-card rounded-2xl p-6 shadow-card mb-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center mb-3">
          <span className="text-3xl font-bold text-primary-foreground">{currentLevel}</span>
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-1">{currentThreshold.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">Level {currentLevel} Host</p>

        {nextThreshold && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>${totalEarnings.toFixed(2)} earned</span>
              <span>${nextThreshold.earnings} needed for Lv.{nextThreshold.level}</span>
            </div>
            <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full gradient-primary rounded-full" />
            </div>
            <p className="text-[10px] text-accent font-bold mt-1">{progress.toFixed(0)}% to next level</p>
          </div>
        )}
        {!nextThreshold && (
          <p className="text-sm font-bold text-accent flex items-center justify-center gap-1">
            <Crown className="w-4 h-4" /> Maximum Level Reached!
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <Star className="w-5 h-5 text-accent mb-2" />
          <p className="text-xl font-bold text-foreground">#{rankDisplay}</p>
          <p className="text-[10px] text-muted-foreground">Global Rank</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <Coins className="w-5 h-5 text-accent mb-2" />
          <p className="text-xl font-bold text-foreground">{(profile?.xp ?? 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total XP</p>
        </div>
      </div>

      {/* Level Milestones */}
      <div className="bg-card rounded-2xl shadow-card">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-bold text-sm text-foreground">Level Milestones</h3>
        </div>
        <div className="divide-y divide-border/30">
          {levelThresholds.map((l) => {
            const reached = currentLevel >= l.level;
            return (
              <div key={l.level} className={`px-4 py-3 flex items-center gap-3 ${reached ? "" : "opacity-50"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  reached ? "gradient-primary" : "bg-muted/40"
                }`}>
                  <span className={`text-xs font-bold ${reached ? "text-primary-foreground" : "text-muted-foreground"}`}>{l.level}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{l.title}</p>
                  <p className="text-[10px] text-muted-foreground">${l.earnings.toLocaleString()} total earnings</p>
                </div>
                {reached && currentLevel === l.level && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Current</span>
                )}
                {reached && currentLevel !== l.level && (
                  <span className="text-[10px] text-online font-bold">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HostLevel;
