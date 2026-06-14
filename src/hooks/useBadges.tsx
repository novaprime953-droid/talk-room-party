import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_URL = (path: string) =>
  `https://vxbgnvpkcissenlqgwuv.supabase.co/storage/v1/object/public/badges/${path}`;

export interface Badge {
  key: string;
  name: string;
  image_path: string;
  role: string | null;
  auto_assign: boolean;
  sort_order: number;
  is_active: boolean;
  image_url: string;
}

export const useBadges = () =>
  useQuery({
    queryKey: ["badges-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((b: any) => ({ ...b, image_url: PUBLIC_URL(b.image_path) })) as Badge[];
    },
    staleTime: 5 * 60_000,
  });

export const useUserBadges = (userId?: string | null) =>
  useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("badge_key, granted_at, badges(*)")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? [])
        .filter((r: any) => r.badges?.is_active)
        .sort((a: any, b: any) => (a.badges?.sort_order ?? 0) - (b.badges?.sort_order ?? 0))
        .map((r: any) => ({
          key: r.badge_key,
          name: r.badges?.name as string,
          image_url: PUBLIC_URL(r.badges?.image_path as string),
          granted_at: r.granted_at as string,
        }));
    },
    enabled: !!userId,
  });

export const useGrantBadge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, badgeKey }: { userId: string; badgeKey: string }) => {
      const { error } = await supabase.rpc("owner_grant_badge", {
        p_user_id: userId,
        p_badge_key: badgeKey,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["user-badges", v.userId] }),
  });
};

export const useRevokeBadge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, badgeKey }: { userId: string; badgeKey: string }) => {
      const { error } = await supabase.rpc("owner_revoke_badge", {
        p_user_id: userId,
        p_badge_key: badgeKey,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["user-badges", v.userId] }),
  });
};