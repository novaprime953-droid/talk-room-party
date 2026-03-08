import { motion } from "framer-motion";
import { Trophy, Crown, Coins, Gift, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const tabs = ["Hosts", "Gifters", "Earners", "Rooms"];

const leaderboardData = {
  Hosts: [
    { rank: 1, name: "DJ Luna", score: "125.4K", badge: "👑" },
    { rank: 2, name: "Sarah K", score: "98.2K", badge: "🥈" },
    { rank: 3, name: "GamerX", score: "87.1K", badge: "🥉" },
    { rank: 4, name: "Ahmed", score: "72.5K", badge: "" },
    { rank: 5, name: "FunnyBones", score: "65.3K", badge: "" },
    { rank: 6, name: "CoachMax", score: "54.8K", badge: "" },
    { rank: 7, name: "VocalStar", score: "48.2K", badge: "" },
    { rank: 8, name: "ReadWithMe", score: "42.1K", badge: "" },
  ],
};

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Hosts");

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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === tab
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-3 mb-8 h-44">
          {/* 2nd Place */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted/50 ring-2 ring-muted-foreground/30 flex items-center justify-center text-2xl mb-1">
              🥈
            </div>
            <p className="text-xs font-bold text-foreground">Sarah K</p>
            <p className="text-[10px] text-muted-foreground">98.2K</p>
            <div className="w-16 h-20 gradient-card rounded-t-xl mt-2 border border-border/30" />
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <Crown className="w-6 h-6 text-accent mb-1 animate-float" />
            <div className="w-20 h-20 rounded-full bg-muted/50 ring-2 ring-accent glow-gold flex items-center justify-center text-3xl mb-1">
              👑
            </div>
            <p className="text-sm font-bold text-foreground">DJ Luna</p>
            <p className="text-xs text-accent font-bold">125.4K</p>
            <div className="w-20 h-28 gradient-gold/20 rounded-t-xl mt-2 border border-accent/20" />
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted/50 ring-2 ring-muted-foreground/20 flex items-center justify-center text-2xl mb-1">
              🥉
            </div>
            <p className="text-xs font-bold text-foreground">GamerX</p>
            <p className="text-[10px] text-muted-foreground">87.1K</p>
            <div className="w-16 h-14 gradient-card rounded-t-xl mt-2 border border-border/30" />
          </motion.div>
        </div>

        {/* Rest of list */}
        <div className="space-y-2">
          {leaderboardData.Hosts.slice(3).map((user, i) => (
            <motion.div
              key={user.rank}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-card"
            >
              <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                #{user.rank}
              </span>
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-lg font-bold text-foreground">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-accent" />
                <span className="text-sm font-bold text-accent">{user.score}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
