import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const games = [
  {
    name: "Audio Casino",
    icon: "🎰",
    url: "https://rayziaudiocasino.codderlab.com/",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
  },
  {
    name: "Ferry Wheel",
    icon: "🎡",
    url: "https://rayziaudioferrywheel.codderlab.com/",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
  },
  {
    name: "Teen Patti",
    icon: "🃏",
    url: "https://rayziaudioteenpatti.codderlab.com/",
    color: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
  },
];

const GamesPage = () => {
  const navigate = useNavigate();

  const openGame = (url: string) => {
    navigate(`/games/play?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-display font-bold text-foreground">Games</h1>
          </div>
        </div>
        <p className="text-xs text-muted-foreground ml-10">Play exciting games with friends</p>
      </div>

      <div className="px-4 pt-4 grid grid-cols-1 gap-4">
        {games.map((game, i) => (
          <motion.button
            key={game.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openGame(game.url)}
            className={`relative flex items-center gap-4 p-5 rounded-2xl border ${game.border} bg-gradient-to-r ${game.color} backdrop-blur-sm text-left transition-all hover:scale-[1.01]`}
          >
            <span className="text-4xl">{game.icon}</span>
            <div className="flex-1">
              <h3 className="font-display font-bold text-foreground text-base">{game.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tap to play</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
              Play
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default GamesPage;
