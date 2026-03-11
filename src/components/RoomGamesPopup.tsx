import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

const games = [
  { name: "Audio Casino", icon: "🎰", url: "https://rayziaudiocasino.codderlab.com/" },
  { name: "Ferry Wheel", icon: "🎡", url: "https://rayziaudioferrywheel.codderlab.com/" },
  { name: "Teen Patti", icon: "🃏", url: "https://rayziaudioteenpatti.codderlab.com/" },
];

interface RoomGamesPopupProps {
  open: boolean;
  onClose: () => void;
}

const RoomGamesPopup = ({ open, onClose }: RoomGamesPopupProps) => {
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
              <button onClick={onClose} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {games.map((game) => (
                <motion.button
                  key={game.name}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setGameUrl(game.url); setLoading(true); }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-3xl">{game.icon}</span>
                  <span className="font-bold text-foreground text-sm flex-1">{game.name}</span>
                  <span className="text-xs font-bold text-primary">Play</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoomGamesPopup;
