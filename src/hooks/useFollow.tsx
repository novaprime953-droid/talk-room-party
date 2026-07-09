import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useIsFollowing = (targetId?: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-following", user?.id, targetId],
    queryFn: async () => {
      if (!user || !targetId || user.id === targetId) return false;
      const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetId,
  });
};

export const useFollowCounts = (userId?: string | null) => {
  return useQuery({
    queryKey: ["follow-counts", userId],
    queryFn: async () => {
      if (!userId) return { followers: 0, following: 0, friends: 0 };
      const { data, error } = await supabase.rpc("get_follow_counts", { p_user_id: userId });
      if (error) throw error;
      return (data ?? { followers: 0, following: 0, friends: 0 }) as any;
    },
    enabled: !!userId,
  });
};

export const useToggleFollow = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (targetId: string) => {
      const { data, error } = await supabase.rpc("toggle_follow", { p_target_id: targetId });
      if (error) throw error;
      return data as any;
    },
    onSuccess: (data, targetId) => {
      qc.invalidateQueries({ queryKey: ["is-following", user?.id, targetId] });
      qc.invalidateQueries({ queryKey: ["follow-counts", targetId] });
      qc.invalidateQueries({ queryKey: ["follow-counts", user?.id] });
      qc.invalidateQueries({ queryKey: ["follow-list"] });
      qc.invalidateQueries({ queryKey: ["public-stats"] });
      toast.success(data?.following ? "Following" : "Unfollowed");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
};

export type FollowListKind = "followers" | "following" | "friends" | "suggested";

export const useFollowList = (userId?: string | null, kind: FollowListKind = "followers") => {
  return useQuery({
    queryKey: ["follow-list", userId, kind],
    queryFn: async () => {
      if (!userId) return [];
      if (kind === "suggested") {
        const { data: mine } = await supabase.from("followers").select("following_id").eq("follower_id", userId);
        const ids = (mine ?? []).map((r) => r.following_id).concat(userId);
        const q = supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url, user_id_number, level, vip_level, bio")
          .order("level", { ascending: false })
          .limit(30);
        if (ids.length) q.not("user_id", "in", `(${ids.join(",")})`);
        const { data, error } = await q;
        if (error) throw error;
        return data ?? [];
      }
      if (kind === "followers") {
        const { data, error } = await supabase
          .from("followers")
          .select("profiles!followers_follower_id_fkey(user_id, username, display_name, avatar_url, user_id_number, level, vip_level, bio)")
          .eq("following_id", userId);
        if (error) throw error;
        return (data ?? []).map((r: any) => r.profiles).filter(Boolean);
      }
      if (kind === "following") {
        const { data, error } = await supabase
          .from("followers")
          .select("profiles!followers_following_id_fkey(user_id, username, display_name, avatar_url, user_id_number, level, vip_level, bio)")
          .eq("follower_id", userId);
        if (error) throw error;
        return (data ?? []).map((r: any) => r.profiles).filter(Boolean);
      }
      // friends: mutual
      const [{ data: outgoing }, { data: incoming }] = await Promise.all([
        supabase.from("followers").select("following_id").eq("follower_id", userId),
        supabase.from("followers").select("follower_id").eq("following_id", userId),
      ]);
      const outSet = new Set((outgoing ?? []).map((r: any) => r.following_id));
      const mutualIds = (incoming ?? []).map((r: any) => r.follower_id).filter((id) => outSet.has(id));
      if (!mutualIds.length) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, user_id_number, level, vip_level, bio")
        .in("user_id", mutualIds);
      return data ?? [];
    },
    enabled: !!userId,
  });
};