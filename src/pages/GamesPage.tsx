import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2, Coins, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useGameSettings, useStartGame, GAMES } from "@/hooks/useGames";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const GamesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: settings, isLoading } = useGameSettings();
  const { startGame } = useStartGame();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState<string | null>(null);
  const [insufficientPopup, setInsufficientPopup] = useState<{ game: string; required: number } | null>(null);

  const handlePlay = async (game: typeof GAMES[number]) => {
    if (!user || !settings) return;
    const config = settings[game.key];
    if (!config?.enabled) {
      toast.error("This game is currently disabled");
      return;
    }
    const balance = profile?.coins_balance ?? 0;
    if (balance < config.min_coins) {
      setInsufficientPopup({ game: game.name, required: config.min_coins });
      return;
    }

    setProcessing(game.key);
    try {
      await startGame(user.id, game.name, config.min_coins);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate(`/games/play?url=${encodeURIComponent(game.url)}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to start game");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Insufficient coins popup */}
      {insufficientPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4" onClick={() => setInsufficientPopup(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl p-6 text-center space-y-4 border border-border"
          >
            <AlertTriangle className="w-12 h-12 text-accent mx-auto" />
            <h3 className="font-display font-bold text-foreground text-lg">Insufficient Coins</h3>
            <p className="text-sm text-muted-foreground">
              You need at least <span className="font-bold text-accent">{insufficientPopup.required}</span> coins to play {insufficientPopup.game}. Your balance: <span className="font-bold text-foreground">{profile?.coins_balance ?? 0}</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setInsufficientPopup(null)} className="flex-1 py-2.5 rounded-xl bg-muted/30 text-muted-foreground text-sm font-bold">
                Cancel
              </button>
              <button onClick={() => { setInsufficientPopup(null); navigate("/wallet"); }} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                Recharge Coins
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-display font-bold text-foreground">Games</h1>
            </div>
          </div>
          <button onClick={() => navigate("/wallet")} className="flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-full">
            <Coins className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px] font-bold text-accent">{profile?.coins_balance?.toLocaleString() ?? "0"}</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground ml-10">Play exciting games with friends</p>
      </div>

      <div className="px-4 pt-4 grid grid-cols-1 gap-4">
        {GAMES.map((game, i) => {
          const config = settings?.[game.key];
          const enabled = config?.enabled !== false;
          const minCoins = config?.min_coins ?? 0;

          return (
            <motion.button
              key={game.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.97 }}
              disabled={!enabled || processing === game.key}
              onClick={() => handlePlay(game)}
              className={`relative flex items-center gap-4 p-5 rounded-2xl border ${game.border} bg-gradient-to-r ${game.color} backdrop-blur-sm text-left transition-all hover:scale-[1.01] ${!enabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="text-4xl">{game.icon}</span>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground text-base">{game.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <Coins className="w-3 h-3 text-accent" />
                  <span className="text-xs text-muted-foreground">Min: <span className="font-bold text-accent">{minCoins}</span> coins</span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-bold ${enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {processing === game.key ? "..." : enabled ? "Play" : "Disabled"}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default GamesPage;
