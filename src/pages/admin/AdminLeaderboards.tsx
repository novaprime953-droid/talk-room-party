import { useState } from "react";
import { Trophy, Coins, RotateCcw, Download, Users, Crown } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

const AdminLeaderboards = () => {
  const [tab, setTab] = useState<"hosts" | "gifters" | "receivers">("hosts");
  const { data: leaderboard } = useLeaderboard(tab);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["leaderboard-stats"],
    queryFn: async () => {
      const [hosts, profiles, gifts] = await Promise.all([
        supabase.from("hosts").select("total_earnings").order("total_earnings", { ascending: false }),
        supabase.from("profiles").select("level, xp").order("level", { ascending: false }),
        supabase.from("gift_transactions").select("coins_spent"),
      ]);
      const totalGiftVolume = gifts.data?.reduce((s, g) => s + g.coins_spent, 0) ?? 0;
      const topLevel = profiles.data?.[0]?.level ?? 0;
      const totalHosts = hosts.data?.length ?? 0;
      return { totalGiftVolume, topLevel, totalHosts };
    },
  });

  const getEntry = (item: any) => {
    if (tab === "hosts") {
      return {
        name: item.profiles?.display_name ?? item.profiles?.username ?? "Host",
        avatar: item.profiles?.avatar_url,
        score: `$${Number(item.total_earnings).toFixed(2)}`,
        rawScore: Number(item.total_earnings),
      };
    }
    return {
      name: item.display_name ?? item.username ?? "User",
      avatar: item.avatar_url,
      score: `Lv.${item.level}`,
      rawScore: item.level,
    };
  };

  const exportCSV = () => {
    if (!leaderboard?.length) return;
    const rows = leaderboard.map((item: any, i: number) => {
      const e = getEntry(item);
      return `${i + 1},${e.name},${e.rawScore}`;
    });
    const csv = `Rank,Name,Score\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaderboard-${tab}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported!");
  };

  const resetMonthlyEarnings = async () => {
    if (!confirm("Reset all hosts' monthly earnings to 0?")) return;
    const { error } = await supabase.from("hosts").update({ monthly_earnings: 0 }).gte("monthly_earnings", 0);
    if (error) toast.error(error.message);
    else {
      toast.success("Monthly earnings reset!");
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-accent" /> Leaderboards
        </h1>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={exportCSV}
            className="bg-muted/40 text-muted-foreground px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1">
            <Download className="w-3 h-3" /> Export
          </motion.button>
          {tab === "hosts" && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={resetMonthlyEarnings}
              className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset Monthly
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Gift Volume", value: `${((stats?.totalGiftVolume ?? 0) / 1000).toFixed(1)}k`, icon: Coins },
          { label: "Top Level", value: stats?.topLevel ?? 0, icon: Crown },
          { label: "Total Hosts", value: stats?.totalHosts ?? 0, icon: Users },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-3 shadow-card text-center">
            <s.icon className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {(["hosts", "gifters", "receivers"] as const).map((t) => (
          <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold ${
              tab === t ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </motion.button>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground w-12">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">User</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard?.map((item: any, i: number) => {
              const entry = getEntry(item);
              return (
                <tr key={item.id} className="border-b border-border/30 last:border-0">
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${i < 3 ? "text-accent" : "text-muted-foreground"}`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                        {entry.avatar ? (
                          <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{entry.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="font-semibold text-foreground">{entry.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-accent font-bold">{entry.score}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!leaderboard || leaderboard.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No data yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminLeaderboards;
