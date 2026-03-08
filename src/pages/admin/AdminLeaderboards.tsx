import { useState } from "react";
import { Trophy, Coins } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { motion } from "framer-motion";

const AdminLeaderboards = () => {
  const [tab, setTab] = useState<"hosts" | "gifters" | "receivers">("hosts");
  const { data: leaderboard } = useLeaderboard(tab);

  const getEntry = (item: any) => {
    if (tab === "hosts") {
      return {
        name: item.profiles?.display_name ?? item.profiles?.username ?? "Host",
        avatar: item.profiles?.avatar_url,
        score: `$${Number(item.total_earnings).toFixed(2)}`,
      };
    }
    return {
      name: item.display_name ?? item.username ?? "User",
      avatar: item.avatar_url,
      score: `Lv.${item.level}`,
    };
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-accent" /> Leaderboards
      </h1>

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
                      {i + 1}
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
