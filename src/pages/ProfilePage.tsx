import { motion } from "framer-motion";
import {
  Shield, Crown, Users, Heart, Copy, ChevronRight,
  ShoppingBag, Sparkles, Mic, Settings, MessageSquare,
  Award, ClipboardList, BarChart3, Banknote, Wallet, Gem, Trophy, Flame,
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
import SunsetOrbs from "@/components/SunsetOrbs";
import StatCard from "@/components/ui/StatCard";
import IconTile from "@/components/ui/IconTile";
import GlassPanel from "@/components/ui/GlassPanel";

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
    { icon: Award, label: "Medals", tone: "vip" as const, path: "/medals" },
    { icon: ShoppingBag, label: "Shop", tone: "primary" as const, path: "/store" },
    { icon: Sparkles, label: "My Bag", tone: "gold" as const, path: "/my-props" },
    { icon: ClipboardList, label: "Tasks", tone: "accent" as const, path: "/events" },
    { icon: Mic, label: "Host", tone: "primary" as const, path: "/host" },
  ];

  // Second section
  const secondButtons = [
    { icon: Users, label: "Family", tone: "vip" as const, path: "/family" },
    { icon: Heart, label: "CP Nest", tone: "accent" as const, path: "/social" },
    { icon: BarChart3, label: "Records", tone: "primary" as const, path: "/wallet" },
    { icon: MessageSquare, label: "Inbox", tone: "gold" as const, path: "/notifications" },
    { icon: Settings, label: "Setting", tone: "muted" as const, path: "/settings" },
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
    <div className="min-h-screen bg-background pb-28">
      {/* Sunset Hero */}
      <div className="relative overflow-hidden text-primary-foreground rounded-b-[2.5rem] pt-8 pb-24 px-4" style={{ background: 'var(--gradient-sunset)' }}>
        <SunsetOrbs variant="hero" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="relative cursor-pointer" onClick={() => profile?.user_id_number && navigate(`/u/${profile.user_id_number}`)}>
            <FramedAvatar
              src={profile?.avatar_url}
              name={profile?.display_name ?? profile?.username}
              frameUrl={(equippedFrame as any)?.props?.image_url}
              size="xl"
              showGlow
            />
            {vipLevel > 0 && (
              <div className="absolute -top-1 -left-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-white text-primary shadow-lift">
                VIP{vipLevel}
              </div>
            )}
          </div>
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-black text-xl leading-tight">
                {profile?.display_name ?? profile?.username ?? "User"}
              </h1>
              <span className="text-sm">🇵🇰</span>
            </div>
            <div className="mt-1.5"><UserBadges userId={user?.id} size={20} /></div>
            <button onClick={copyId} className="flex items-center gap-1.5 mt-2 group bg-black/25 backdrop-blur px-2.5 py-1 rounded-full">
              <span className="text-[11px] font-bold">UID: {profile?.user_id_number ?? "—"}</span>
              <Copy className="w-3 h-3 opacity-70 group-hover:opacity-100" />
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white text-primary">Lv.{profile?.level ?? 1}</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Following", value: formatNumber(socialStats?.following ?? 0), tab: "following" },
            { label: "Fans", value: formatNumber(socialStats?.followers ?? 0), tab: "followers" },
            { label: "Charm", value: formatNumber(socialStats?.charm ?? 0), tab: null as string | null },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => stat.tab && navigate(`/followers?tab=${stat.tab}`)}
              className="rounded-2xl bg-black/25 backdrop-blur px-3 py-2 text-center hover:bg-black/40 transition"
            >
              <p className="font-display font-black text-lg leading-tight">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">{stat.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Wallet + VIP + Level tiles pulled up under hero */}
      <div className="px-4 -mt-14 relative z-10 space-y-3">
        <StatCard
          icon={Wallet}
          label="Wallet Balance"
          value={(profile?.coins_balance ?? 0).toLocaleString()}
          hint="Tap to recharge or withdraw"
          tone="gold"
          onClick={() => navigate("/wallet")}
        />
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Gem} label="VIP" value={`VIP ${vipLevel}`} hint="Unlock perks" tone="vip" onClick={() => navigate("/vip")} />
          <StatCard icon={Trophy} label="Level" value={`Lv.${wealthLevel}`} hint="Grow with XP" tone="primary" onClick={() => navigate("/level")} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <GlassPanel>
          <div className="grid grid-cols-5 gap-2">
            {mainButtons.map((btn) => (
              <IconTile key={btn.label} icon={btn.icon} label={btn.label} tone={btn.tone} onClick={() => navigate(btn.path)} />
            ))}
          </div>
        </GlassPanel>
      </div>

      <div className="px-4 mt-3">
        <GlassPanel>
          <div className="grid grid-cols-5 gap-2">
            {secondButtons.map((btn) => (
              <IconTile key={btn.label} icon={btn.icon} label={btn.label} tone={btn.tone} onClick={() => navigate(btn.path)} />
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Role Panels */}
      {panelItems.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-[10px] font-black text-muted-foreground px-1 mb-2 uppercase tracking-widest flex items-center gap-1"><Flame className="w-3 h-3 text-primary" /> My Panels</p>
          <GlassPanel padded={false} glow="primary" className="overflow-hidden divide-y divide-border/30">
            {panelItems.map((item) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="flex-1 text-left text-sm font-bold text-foreground">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            ))}
          </GlassPanel>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
