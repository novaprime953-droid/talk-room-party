import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Copy, MessageCircle, UserPlus, Gift, Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import FramedAvatar from "@/components/FramedAvatar";
import UserBadges from "@/components/UserBadges";
import { useUserBadges } from "@/hooks/useBadges";
import { useUserTitles } from "@/hooks/useTitles";
import { useEquippedFrameUrl } from "@/hooks/useTitles";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("medal");

  // userId param is the numeric user_id_number
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const isNum = /^\d+$/.test(userId);
      const q = isNum
        ? supabase.from("profiles").select("*").eq("user_id_number", Number(userId)).maybeSingle()
        : supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const uid = profile?.user_id;
  const { data: badges } = useUserBadges(uid);
  const { data: titles } = useUserTitles(uid);
  const { data: frameUrl } = useEquippedFrameUrl(uid);

  // All owned frames (for honor)
  const { data: ownedFrames } = useQuery({
    queryKey: ["public-owned-frames", uid],
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await supabase
        .from("user_props")
        .select("id, is_equipped, props(name, image_url, category)")
        .eq("user_id", uid)
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []).filter((r: any) => r.props?.category === "frame");
    },
    enabled: !!uid,
  });

  // Gifts received summary
  const { data: gifts } = useQuery({
    queryKey: ["public-gifts", uid],
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("gift_id, gifts(gift_name, image_url, coin_value)")
        .eq("receiver_id", uid)
        .limit(50);
      if (error) throw error;
      const map = new Map<string, any>();
      (data ?? []).forEach((g: any) => {
        if (!g.gift_id) return;
        const e = map.get(g.gift_id) ?? { ...g.gifts, count: 0 };
        e.count += 1;
        map.set(g.gift_id, e);
      });
      return Array.from(map.values());
    },
    enabled: !!uid,
  });

  const { data: stats } = useQuery({
    queryKey: ["public-stats", uid],
    queryFn: async () => {
      if (!uid) return { followers: 0, following: 0 };
      const [a, b] = await Promise.all([
        supabase.from("followers").select("id", { count: "exact", head: true }).eq("following_id", uid),
        supabase.from("followers").select("id", { count: "exact", head: true }).eq("follower_id", uid),
      ]);
      return { followers: a.count ?? 0, following: b.count ?? 0 };
    },
    enabled: !!uid,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <p className="text-muted-foreground">User not found</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-full bg-primary/20 text-primary text-sm">Go back</button>
      </div>
    );
  }

  const equippedTitle = titles?.find((t) => t.id === (profile as any).equipped_title_id) ?? titles?.[0];
  const copyId = () => {
    navigator.clipboard.writeText(String(profile.user_id_number ?? ""));
    toast.success("ID copied");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cover */}
      <div
        className="relative h-56 overflow-hidden"
        style={{
          background: profile.cover_url
            ? `url(${profile.cover_url}) center/cover`
            : "linear-gradient(135deg, hsl(265 40% 18%), hsl(280 60% 22%))",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/95" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-background/40 backdrop-blur flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Header overlap */}
      <div className="px-4 -mt-20 relative z-10">
        <FramedAvatar
          src={profile.avatar_url}
          name={profile.display_name ?? profile.username}
          frameUrl={frameUrl}
          size="xl"
          showGlow
        />
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <h1 className="font-display font-bold text-2xl text-foreground">{profile.display_name ?? profile.username}</h1>
          {profile.gender && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200">
              {profile.gender === "female" ? "♀" : "♂"}{profile.age ? ` ${profile.age}` : ""}
            </span>
          )}
        </div>
        <button onClick={copyId} className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>ID: {profile.user_id_number ?? "—"}</span>
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Equipped Title */}
        {equippedTitle && (
          <div className="mt-2">
            <img src={equippedTitle.image_url} alt={equippedTitle.name} className="h-7 object-contain inline-block" />
          </div>
        )}

        {/* Badges row */}
        <UserBadges userId={uid} size={26} max={8} className="mt-2" />

        {profile.bio && <p className="text-sm text-muted-foreground mt-3">{profile.bio}</p>}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 bg-card rounded-2xl border border-border/40 py-3">
          {[
            { label: "Friends", value: stats?.followers ?? 0 },
            { label: "Following", value: stats?.following ?? 0 },
            { label: "Follower", value: stats?.followers ?? 0 },
            { label: "Visitors", value: profile.profile_views ?? 0 },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Honor tabs */}
      <div className="px-4 mt-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-4 bg-muted/30">
            <TabsTrigger value="medal" className="text-xs">Medal</TabsTrigger>
            <TabsTrigger value="frame" className="text-xs">Frame</TabsTrigger>
            <TabsTrigger value="title" className="text-xs">Title</TabsTrigger>
            <TabsTrigger value="gifts" className="text-xs">Gifts</TabsTrigger>
          </TabsList>

          <TabsContent value="medal" className="mt-4">
            <HonorGrid items={(badges ?? []).map((b) => ({ id: b.key, name: b.name, image_url: b.image_url }))} emptyLabel="No medals yet" />
          </TabsContent>
          <TabsContent value="frame" className="mt-4">
            <HonorGrid items={(ownedFrames ?? []).map((f: any) => ({ id: f.id, name: f.props.name, image_url: f.props.image_url, equipped: f.is_equipped }))} emptyLabel="No frames yet" big />
          </TabsContent>
          <TabsContent value="title" className="mt-4">
            <HonorGrid items={(titles ?? []).map((t) => ({ id: t.id, name: t.name, image_url: t.image_url, equipped: t.id === (profile as any).equipped_title_id }))} emptyLabel="No titles yet" rect />
          </TabsContent>
          <TabsContent value="gifts" className="mt-4">
            <HonorGrid items={(gifts ?? []).map((g: any) => ({ id: g.gift_name, name: `${g.gift_name} x${g.count}`, image_url: g.image_url }))} emptyLabel="No gifts received" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-background/95 backdrop-blur border-t border-border/40 px-4 py-3 flex gap-2 z-30">
        <button className="flex-1 h-11 rounded-full bg-card border border-border/40 text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
          <UserPlus className="w-4 h-4" /> Follow
        </button>
        <button className="flex-1 h-11 rounded-full bg-card border border-border/40 text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
          <MessageCircle className="w-4 h-4" /> Chat
        </button>
        <button className="flex-1 h-11 rounded-full gradient-gold text-sm font-bold text-accent-foreground flex items-center justify-center gap-1.5">
          <Gift className="w-4 h-4" /> Gift
        </button>
      </div>
    </div>
  );
};

const HonorGrid = ({ items, emptyLabel, big, rect }: { items: { id: string; name: string; image_url: string; equipped?: boolean }[]; emptyLabel: string; big?: boolean; rect?: boolean }) => {
  if (!items.length) {
    return <div className="text-center py-10 text-sm text-muted-foreground">{emptyLabel}</div>;
  }
  return (
    <div className={`grid ${big ? "grid-cols-3" : "grid-cols-4"} gap-3`}>
      {items.map((it) => (
        <motion.div key={it.id} whileHover={{ scale: 1.04 }} className="flex flex-col items-center gap-1.5 text-center">
          <div className={`relative ${big ? "w-full aspect-square" : rect ? "w-full h-9" : "w-16 h-16"} flex items-center justify-center`}>
            <img src={it.image_url} alt={it.name} className="max-w-full max-h-full object-contain drop-shadow-lg" />
            {it.equipped && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold">ON</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-foreground line-clamp-1 w-full">{it.name}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default PublicProfilePage;