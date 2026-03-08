import { motion } from "framer-motion";
import { Settings, Edit, Coins, Gift, Star, ChevronRight, Shield, Crown, Users, Heart, LogOut, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useAdmin";
import { toast } from "sonner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { user, signOut } = useAuth();
  const { data: roles } = useUserRoles();

  const hasAdminAccess = roles?.some((r) =>
    ["admin", "super_admin", "owner", "manager", "business_dev"].includes(r)
  );
  const hasCoinsSeller = roles?.some((r) =>
    ["coins_seller", "owner", "super_admin", "admin"].includes(r)
  );
  const isOwner = roles?.includes("owner");

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const menuItems = [
    { icon: Coins, label: "My Wallet", desc: "Balance & transactions", color: "text-accent", path: "/wallet" },
    { icon: Gift, label: "My Gifts", desc: "Received & sent gifts", color: "text-primary", path: "/gifts" },
    { icon: Star, label: "VIP Center", desc: "Premium benefits", color: "text-accent", path: "/vip" },
    { icon: Crown, label: "Host Center", desc: "Manage your hosting", color: "text-warning", path: "/host-center" },
    { icon: Users, label: "My Agency", desc: "Agency dashboard", color: "text-info", path: "/agency" },
    ...(hasAdminAccess
      ? [{ icon: Shield, label: "Admin Panel", desc: "Management tools", color: "text-destructive", path: "/admin" }]
      : []),
    ...(hasCoinsSeller
      ? [{ icon: Banknote, label: "Coins Seller Panel", desc: "Sell & manage coins", color: "text-online", path: "/seller" }]
      : []),
    ...(isOwner
      ? [{ icon: Crown, label: "Owner Panel", desc: "System control center", color: "text-warning", path: "/owner" }]
      : []),
    { icon: Heart, label: "Favorites", desc: "Saved rooms & users", color: "text-primary", path: "/favorites" },
    { icon: Settings, label: "Settings", desc: "App preferences", color: "text-muted-foreground", path: "/settings" },
  ];

  const xpProgress = profile ? (profile.xp / (profile.level * 500)) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 gradient-primary" />
        <div className="px-4 -mt-12">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center text-3xl font-bold gradient-primary text-primary-foreground glow-primary overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (profile?.display_name ?? profile?.username ?? "U").charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="font-display font-bold text-xl text-foreground">
                {profile?.display_name ?? profile?.username ?? "User"}
              </h1>
              <p className="text-xs text-muted-foreground">
                @{profile?.username ?? "user"} · Level {profile?.level ?? 1}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/settings")}
              className="p-2 bg-muted/40 rounded-full mb-2"
            >
              <Edit className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>

          {/* Bio */}
          <p className="text-sm text-muted-foreground mt-3 mb-4">
            {profile?.bio ?? "🎤 Voice chat enthusiast"}
          </p>

          {/* Stats */}
          <div className="flex gap-3 mb-6">
            {[
              { label: "Level", value: profile?.level?.toString() ?? "1" },
              { label: "XP", value: profile?.xp?.toLocaleString() ?? "0" },
              { label: "Coins", value: profile?.coins_balance?.toLocaleString() ?? "0" },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 bg-card rounded-2xl p-3 text-center shadow-card">
                <p className="font-display font-bold text-lg text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Level Progress */}
          <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Level {profile?.level ?? 1}</span>
              <span className="text-xs text-muted-foreground">
                {profile?.xp ?? 0} / {(profile?.level ?? 1) * 500} XP
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(xpProgress, 100)}%` }}
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
                onClick={() => navigate(item.path)}
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

            {/* Sign Out */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors mt-4"
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-destructive">Sign Out</p>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
