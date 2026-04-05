import { motion } from "framer-motion";
import { Award, Lock, ChevronLeft, Shield, Star, Heart, Users, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const categoryIcons: Record<string, typeof Award> = {
  vip: Shield,
  sender: Heart,
  event: Star,
  social: Users,
  achievement: Trophy,
};

const categoryColors: Record<string, { text: string; bg: string; glow: string }> = {
  vip: { text: "text-amber-400", bg: "bg-amber-500/20", glow: "shadow-amber-500/30" },
  sender: { text: "text-pink-400", bg: "bg-pink-500/20", glow: "shadow-pink-500/30" },
  event: { text: "text-sky-400", bg: "bg-sky-500/20", glow: "shadow-sky-500/30" },
  social: { text: "text-emerald-400", bg: "bg-emerald-500/20", glow: "shadow-emerald-500/30" },
  achievement: { text: "text-purple-400", bg: "bg-purple-500/20", glow: "shadow-purple-500/30" },
};

const MedalsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: medals } = useQuery({
    queryKey: ["medals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medals").select("*").order("category");
      if (error) throw error;
      return data;
    },
  });

  const { data: userMedals } = useQuery({
    queryKey: ["user-medals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_medals")
        .select("medal_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((m) => m.medal_id);
    },
    enabled: !!user,
  });

  const unlockedSet = new Set(userMedals ?? []);

  const grouped = (medals ?? []).reduce<Record<string, typeof medals>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category]!.push(m);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    vip: "VIP Medals",
    sender: "Top Sender",
    event: "Event Medals",
    social: "Social Medals",
    achievement: "Achievements",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display font-bold text-lg text-foreground">Medal of Honor</h1>
        <div className="ml-auto text-xs text-muted-foreground">
          {unlockedSet.size}/{medals?.length ?? 0} Unlocked
        </div>
      </div>

      {/* Medal Categories */}
      <div className="p-4 space-y-6">
        {Object.entries(grouped).map(([category, categoryMedals]) => {
          const colors = categoryColors[category] ?? categoryColors.achievement;
          const Icon = categoryIcons[category] ?? Award;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${colors.text}`} />
                <h2 className="font-display font-bold text-sm text-foreground">
                  {categoryLabels[category] ?? category}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {categoryMedals!.map((medal, i) => {
                  const unlocked = unlockedSet.has(medal.id);
                  return (
                    <motion.div
                      key={medal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`relative rounded-2xl border p-3 flex flex-col items-center text-center gap-2 ${
                        unlocked
                          ? `border-border/50 bg-card shadow-lg ${colors.glow}`
                          : "border-border/30 bg-muted/20 opacity-60"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg}`}>
                        {unlocked ? (
                          <Award className={`w-6 h-6 ${colors.text}`} />
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-foreground leading-tight">
                        {medal.name}
                      </span>
                      <span className="text-[8px] text-muted-foreground leading-tight">
                        {medal.description}
                      </span>
                      {unlocked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">✓</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedalsPage;
