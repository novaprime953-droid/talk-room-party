import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useGameSettings, useStartGame, GAMES } from "@/hooks/useGames";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RoomGamesPopupProps {
  open: boolean;
  onClose: () => void;
}

const RoomGamesPopup = ({ open, onClose }: RoomGamesPopupProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: settings } = useGameSettings();
  const { startGame } = useStartGame();
  const queryClient = useQueryClient();
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      setGameUrl(game.url);
      setLoading(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to start game");
    } finally {
      setProcessing(null);
    }
  };

  if (gameUrl) {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
          <button onClick={() => { setGameUrl(null); setLoading(true); }} className="p-2 text-foreground">
            <X className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-foreground">Game</span>
          <div className="w-9" />
        </div>
        {loading && (
          <div className="absolute inset-0 top-12 flex items-center justify-center bg-background z-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <iframe
          src={gameUrl}
          className="flex-1 w-full border-0"
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allow="autoplay; fullscreen"
          title="Game"
        />
      </div>
    );
  }

  return (
    <>
      {/* Insufficient coins popup */}
      {insufficientPopup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 px-4" onClick={() => setInsufficientPopup(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl p-6 text-center space-y-4 border border-border"
          >
            <AlertTriangle className="w-12 h-12 text-accent mx-auto" />
            <h3 className="font-display font-bold text-foreground text-lg">Insufficient Coins</h3>
            <p className="text-sm text-muted-foreground">
              You need <span className="font-bold text-accent">{insufficientPopup.required}</span> coins to play {insufficientPopup.game}. Balance: <span className="font-bold text-foreground">{profile?.coins_balance ?? 0}</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setInsufficientPopup(null)} className="flex-1 py-2.5 rounded-xl bg-muted/30 text-muted-foreground text-sm font-bold">Cancel</button>
              <button onClick={() => { setInsufficientPopup(null); onClose(); navigate("/wallet"); }} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Recharge</button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card rounded-t-3xl p-5 pb-8 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground">🎮 Games</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-full">
                    <Coins className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-bold text-accent">{profile?.coins_balance?.toLocaleString() ?? "0"}</span>
                  </div>
                  <button onClick={onClose} className="p-1 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {GAMES.map((game) => {
                  const config = settings?.[game.key];
                  const enabled = config?.enabled !== false;
                  const minCoins = config?.min_coins ?? 0;
                  return (
                    <motion.button
                      key={game.key}
                      whileTap={{ scale: 0.97 }}
                      disabled={!enabled || processing === game.key}
                      onClick={() => handlePlay(game)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors text-left ${!enabled ? "opacity-50" : ""}`}
                    >
                      <span className="text-3xl">{game.icon}</span>
                      <div className="flex-1">
                        <span className="font-bold text-foreground text-sm">{game.name}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Coins className="w-3 h-3 text-accent" />
                          <span className="text-[10px] text-muted-foreground">{minCoins} coins</span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${enabled ? "text-primary" : "text-muted-foreground"}`}>
                        {processing === game.key ? "..." : enabled ? "Play" : "Off"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoomGamesPopup;
