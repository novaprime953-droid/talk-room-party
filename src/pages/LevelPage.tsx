import { motion } from "framer-motion";
import { ChevronLeft, Zap, Gift, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getXPForNextLevel } from "@/hooks/useProgression";
import { Progress } from "@/components/ui/progress";

const xpSources = [
  { action: "Daily Login", xp: 50, icon: Star },
  { action: "Join Room", xp: 20, icon: Zap },
  { action: "10 Min Stay", xp: 30, icon: Zap },
  { action: "Send Gift", xp: "gift value %", icon: Gift },
  { action: "Complete Task", xp: 100, icon: Trophy },
];

const LevelPage = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const { data: rewards } = useQuery({
    queryKey: ["level-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("level_rewards")
        .select("*")
        .order("level");
      if (error) throw error;
      return data;
    },
  });

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const requiredXP = getXPForNextLevel(level);
  const progress = Math.min((xp / requiredXP) * 100, 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display font-bold text-lg text-foreground">Level System</h1>
      </div>

      {/* Current Level Card */}
      <div className="mx-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/50 bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Level</p>
              <p className="font-display font-bold text-3xl text-foreground">Lv.{level}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>XP: {xp.toLocaleString()}</span>
              <span>{requiredXP.toLocaleString()} needed</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-[10px] text-muted-foreground text-center">
              {(requiredXP - xp).toLocaleString()} XP to Level {level + 1}
            </p>
          </div>
        </motion.div>
      </div>

      {/* XP Sources */}
      <div className="mx-4 mt-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          How to Earn XP
        </p>
        <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/30">
          {xpSources.map((s) => (
            <div key={s.action} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="flex-1 text-sm font-semibold text-foreground">{s.action}</span>
              <span className="text-xs font-bold text-primary">+{s.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Level Rewards */}
      <div className="mx-4 mt-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Level Rewards
        </p>
        <div className="grid grid-cols-2 gap-3">
          {rewards?.map((r, i) => {
            const unlocked = level >= r.level;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-3 ${
                  unlocked
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/30 bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gift className={`w-4 h-4 ${unlocked ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs font-bold text-foreground">Level {r.level}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {r.coins_reward > 0 && `${r.coins_reward.toLocaleString()} Coins`}
                  {r.description && ` • ${r.description}`}
                </p>
                {unlocked && (
                  <span className="text-[8px] font-bold text-primary mt-1 inline-block">✓ CLAIMED</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelPage;
