import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Title {
  id: string;
  name: string;
  image_url: string;
  role: string | null;
  auto_assign: boolean;
  sort_order: number;
  is_active: boolean;
}

export const useTitles = () =>
  useQuery({
    queryKey: ["titles-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("titles").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return (data ?? []) as Title[];
    },
    staleTime: 5 * 60_000,
  });

export const useUserTitles = (userId?: string | null) =>
  useQuery({
    queryKey: ["user-titles", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_titles")
        .select("title_id, titles(*)")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? [])
        .filter((r: any) => r.titles?.is_active)
        .map((r: any) => r.titles as Title)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },
    enabled: !!userId,
  });

export const useGrantTitle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, titleId }: { userId: string; titleId: string }) => {
      const { error } = await supabase.rpc("owner_grant_title", { p_user_id: userId, p_title_id: titleId });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["user-titles", v.userId] }),
  });
};

export const useRevokeTitle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, titleId }: { userId: string; titleId: string }) => {
      const { error } = await supabase.rpc("owner_revoke_title", { p_user_id: userId, p_title_id: titleId });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["user-titles", v.userId] }),
  });
};

export const useEquipTitle = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (titleId: string | null) => {
      const { error } = await supabase.rpc("equip_title", { p_title_id: titleId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });
};

export const useEquipBadge = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (badgeKey: string | null) => {
      const { error } = await supabase.rpc("equip_badge", { p_badge_key: badgeKey });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });
};

export const useEquipFrame = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userPropId: string | null) => {
      const { error } = await supabase.rpc("equip_frame_prop", { p_user_prop_id: userPropId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["my-props"] });
      qc.invalidateQueries({ queryKey: ["equipped-props"] });
    },
  });
};

// Lookup the active equipped frame image for any user
export const useEquippedFrameUrl = (userId?: string | null) =>
  useQuery({
    queryKey: ["equipped-frame-url", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_props")
        .select("id, props(image_url, category)")
        .eq("user_id", userId)
        .eq("is_equipped", true)
        .eq("status", "active");
      if (error) throw error;
      const frame = (data ?? []).find((r: any) => r.props?.category === "frame");
      return (frame as any)?.props?.image_url ?? null;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });