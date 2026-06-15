import { motion } from "framer-motion";
import {
  Shield, Crown, Users, Heart, Copy, ChevronRight,
  ShoppingBag, Sparkles, Mic, Settings, MessageSquare,
  Award, ClipboardList, BarChart3, Banknote, Wallet,
} from "lucide-react";
import { useEquippedProps } from "@/hooks/useProps";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useAdmin";
import { toast } from "sonner";
import FramedAvatar from "@/components/FramedAvatar";
import UserBadges from "@/components/UserBadges";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();
  const { data: roles } = useUserRoles();
  const { data: equippedProps } = useEquippedProps(user?.id);
  const equippedFrame = equippedProps?.find(p => (p as any).props?.category === 'frame');

  // Social stats
  const { data: socialStats } = useQuery({
    queryKey: ['social-stats', user?.id],
    queryFn: async () => {
      if (!user) return { followers: 0, following: 0, charm: 0 };
      const [followersRes, followingRes, giftsRes] = await Promise.all([
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('gift_transactions').select('coins_spent').eq('receiver_id', user.id),
      ]);
      const charm = giftsRes.data?.reduce((s, g) => s + (g.coins_spent || 0), 0) ?? 0;
      return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
        charm,
      };
    },
    enabled: !!user,
  });

  const hasAdminAccess = roles?.some(r => ["admin", "super_admin", "owner", "manager", "business_dev"].includes(r));
  const hasCoinsSeller = roles?.some(r => ["coins_seller", "owner", "super_admin", "admin"].includes(r));
  const isOwner = roles?.includes("owner");
  const isManager = roles?.includes("manager");
  const isSuperAdmin = roles?.includes("super_admin");
  const isAdmin = roles?.includes("admin");
  const isBD = roles?.includes("business_dev");
  const isAgency = roles?.includes("agency_owner");
  const isHost = roles?.includes("host");

  const copyId = () => {
    if (profile?.user_id_number) {
      navigator.clipboard.writeText(String(profile.user_id_number));
      toast.success("ID copied!");
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  const vipLevel = Math.min(Math.floor((profile?.level ?? 1) / 5) + 1, 10);
  const wealthLevel = profile?.level ?? 1;

  // Main button grid
  const mainButtons = [
    { icon: Award, label: "Medal of Honor", color: "text-purple-400", bg: "bg-purple-500/20", path: "/medals" },
    { icon: ShoppingBag, label: "Shop", color: "text-emerald-400", bg: "bg-emerald-500/20", path: "/store" },
    { icon: Sparkles, label: "My Bag", color: "text-sky-400", bg: "bg-sky-500/20", path: "/my-props" },
    { icon: ClipboardList, label: "Task", color: "text-orange-400", bg: "bg-orange-500/20", path: "/events" },
    { icon: Mic, label: "Host Center", color: "text-pink-400", bg: "bg-pink-500/20", path: "/host" },
  ];

  // Second section
  const secondButtons = [
    { icon: Users, label: "Family", color: "text-blue-400", bg: "bg-blue-500/20", path: "/family" },
    { icon: Heart, label: "CP Nest", color: "text-pink-400", bg: "bg-pink-500/20", path: "/social" },
    { icon: BarChart3, label: "Reward Records", color: "text-emerald-400", bg: "bg-emerald-500/20", path: "/wallet" },
    { icon: MessageSquare, label: "Feedback", color: "text-red-400", bg: "bg-red-500/20", path: "/notifications" },
    { icon: Settings, label: "Setting", color: "text-muted-foreground", bg: "bg-muted/30", path: "/settings" },
  ];

  // Role-based panels
  const panelItems = [
    ...(isOwner ? [{ icon: Crown, label: "Owner Panel", color: "text-accent", bg: "bg-accent/20", path: "/owner" }] : []),
    ...(isManager ? [{ icon: Shield, label: "Manager Panel", color: "text-blue-400", bg: "bg-blue-500/20", path: "/admin" }] : []),
    ...(isSuperAdmin && !isOwner ? [{ icon: Shield, label: "Super Admin", color: "text-purple-400", bg: "bg-purple-500/20", path: "/admin" }] : []),
    ...(isAdmin && !isSuperAdmin && !isOwner ? [{ icon: Shield, label: "Admin Panel", color: "text-destructive", bg: "bg-destructive/20", path: "/admin" }] : []),
    ...(isBD ? [{ icon: BarChart3, label: "BD Panel", color: "text-cyan-400", bg: "bg-cyan-500/20", path: "/bizdev" }] : []),
    ...(isAgency ? [{ icon: Users, label: "Agency Panel", color: "text-green-400", bg: "bg-green-500/20", path: "/agency" }] : []),
    ...(isHost ? [{ icon: Mic, label: "Host Panel", color: "text-pink-400", bg: "bg-pink-500/20", path: "/host" }] : []),
    ...(hasCoinsSeller ? [{ icon: Banknote, label: "Coins Seller", color: "text-emerald-400", bg: "bg-emerald-500/20", path: "/seller" }] : []),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Profile Header */}
      <div className="relative pt-8 pb-4 px-4">
        {/* Avatar + Info */}
        <div className="flex items-start gap-4">
          <div className="relative cursor-pointer" onClick={() => profile?.user_id_number && navigate(`/u/${profile.user_id_number}`)}>
            <FramedAvatar
              src={profile?.avatar_url}
              name={profile?.display_name ?? profile?.username}
              frameUrl={(equippedFrame as any)?.props?.image_url}
              size="xl"
              showGlow
            />
            {vipLevel > 0 && (
              <div className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow">
                VIP{vipLevel}
              </div>
            )}
          </div>

          <div className="flex-1 pt-2">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg text-foreground">
                {profile?.display_name ?? profile?.username ?? "User"}
              </h1>
              <span className="text-xs">🇵🇰</span>
            </div>
            <UserBadges userId={user?.id} size={22} className="mt-1.5" />
            <button onClick={copyId} className="flex items-center gap-1.5 mt-1 group">
              <span className="text-xs text-muted-foreground">UID:{profile?.user_id_number ?? "—"}</span>
              <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary">
                Lv.{profile?.level ?? 1}
              </span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-around mt-5">
          {[
            { label: "Follow", value: formatNumber(socialStats?.following ?? 0) },
            { label: "Fans", value: formatNumber(socialStats?.followers ?? 0) },
            { label: "Charm", value: formatNumber(socialStats?.charm ?? 0) },
          ].map((stat, i) => (
            <div key={stat.label} className="flex-1 text-center relative">
              <p className="font-display font-bold text-lg text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              {i < 2 && <div className="absolute right-0 top-1 bottom-1 w-px bg-border/50" />}
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Card */}
      <div className="px-4 mb-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/wallet")}
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, hsl(250 18% 18%), hsl(250 18% 14%))' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-display font-bold text-foreground">{profile?.coins_balance?.toLocaleString() ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-accent">Wallet</span>
            <ChevronRight className="w-5 h-5 text-accent" />
          </div>
        </motion.button>
      </div>

      {/* VIP + Level Cards */}
      <div className="px-4 mb-4 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/vip")}
          className="flex-1 rounded-2xl p-3 relative overflow-hidden text-left"
          style={{ background: 'linear-gradient(135deg, hsl(30 80% 25%), hsl(45 100% 20%))' }}
        >
          <p className="text-[10px] text-amber-300/80 font-bold">VIP</p>
          <p className="font-display font-bold text-lg text-amber-300">VIP{vipLevel}</p>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/level")}
          className="flex-1 rounded-2xl p-3 relative overflow-hidden text-left"
          style={{ background: 'linear-gradient(135deg, hsl(140 40% 20%), hsl(160 60% 25%))' }}
        >
          <p className="text-[10px] text-emerald-300/80 font-bold">Level</p>
          <p className="font-display font-bold text-lg text-emerald-300">Lv.{wealthLevel}</p>
        </motion.button>
      </div>

      {/* Main Button Grid */}
      <div className="mx-4 mb-3 bg-card rounded-2xl border border-border/50 p-4">
        <div className="grid grid-cols-4 gap-4">
          {mainButtons.map((btn) => (
            <motion.button
              key={btn.label}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate(btn.path)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`w-11 h-11 rounded-xl ${btn.bg} flex items-center justify-center`}>
                <btn.icon className={`w-5 h-5 ${btn.color}`} />
              </div>
              <span className="text-[10px] font-semibold text-foreground leading-tight text-center">{btn.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Second Section */}
      <div className="mx-4 mb-3 bg-card rounded-2xl border border-border/50 p-4">
        <div className="grid grid-cols-4 gap-4">
          {secondButtons.map((btn) => (
            <motion.button
              key={btn.label}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate(btn.path)}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`w-11 h-11 rounded-xl ${btn.bg} flex items-center justify-center`}>
                <btn.icon className={`w-5 h-5 ${btn.color}`} />
              </div>
              <span className="text-[10px] font-semibold text-foreground leading-tight text-center">{btn.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Role-Based Panels */}
      {panelItems.length > 0 && (
        <div className="mx-4 mb-4">
          <p className="text-[10px] font-bold text-muted-foreground px-1 mb-2 uppercase tracking-wider">My Panels</p>
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
            {panelItems.map((item) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-3"
              >
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-foreground">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
