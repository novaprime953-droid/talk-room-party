import { motion } from "framer-motion";
import { Settings, Edit, Coins, Gift, Star, ChevronRight, Shield, Crown, Users, Heart } from "lucide-react";

const stats = [
  { label: "Followers", value: "12.5K" },
  { label: "Following", value: "892" },
  { label: "Coins", value: "24,500", icon: Coins },
];

const menuItems = [
  { icon: Coins, label: "My Wallet", desc: "Balance & transactions", color: "text-accent" },
  { icon: Gift, label: "My Gifts", desc: "Received & sent gifts", color: "text-primary" },
  { icon: Star, label: "VIP Center", desc: "Premium benefits", color: "text-accent" },
  { icon: Crown, label: "Host Center", desc: "Manage your hosting", color: "text-warning" },
  { icon: Users, label: "My Agency", desc: "Agency dashboard", color: "text-info" },
  { icon: Shield, label: "Admin Panel", desc: "Management tools", color: "text-destructive" },
  { icon: Heart, label: "Favorites", desc: "Saved rooms & users", color: "text-primary" },
  { icon: Settings, label: "Settings", desc: "App preferences", color: "text-muted-foreground" },
];

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 gradient-primary" />
        <div className="px-4 -mt-12">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center text-3xl font-bold gradient-primary text-primary-foreground glow-primary">
              T
            </div>
            <div className="flex-1 pb-2">
              <h1 className="font-display font-bold text-xl text-foreground">TalkUser</h1>
              <p className="text-xs text-muted-foreground">ID: 100234 · Level 15</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-muted/40 rounded-full mb-2"
            >
              <Edit className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>

          {/* Bio */}
          <p className="text-sm text-muted-foreground mt-3 mb-4">
            🎤 Voice chat enthusiast | Music lover 🎵 | Let's talk!
          </p>

          {/* Stats */}
          <div className="flex gap-3 mb-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex-1 bg-card rounded-2xl p-3 text-center shadow-card">
                <p className="font-display font-bold text-lg text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Level Progress */}
          <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Level 15</span>
              <span className="text-xs text-muted-foreground">2,340 / 5,000 XP</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "47%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full gradient-primary rounded-full"
              />
            </div>
          </div>

          {/* Menu */}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
