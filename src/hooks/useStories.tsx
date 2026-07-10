import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export type StoryItem = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  view_count: number;
  expires_at: string;
  created_at: string;
};

export type StoryGroup = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  stories: StoryItem[];
  isSelf: boolean;
};

export const useStoryGroups = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["stories-active"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const stories = (data ?? []) as StoryItem[];
      const uids = Array.from(new Set(stories.map((s) => s.user_id)));
      let profiles: Record<string, any> = {};
      if (uids.length) {
        const { data: p } = await sb
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", uids);
        (p ?? []).forEach((r: any) => (profiles[r.user_id] = r));
      }
      const map = new Map<string, StoryGroup>();
      stories.forEach((s) => {
        const prof = profiles[s.user_id] ?? {};
        const grp = map.get(s.user_id) ?? {
          userId: s.user_id,
          username: prof.username ?? "User",
          displayName: prof.display_name ?? null,
          avatarUrl: prof.avatar_url ?? null,
          stories: [],
          isSelf: user?.id === s.user_id,
        };
        grp.stories.push(s);
        map.set(s.user_id, grp);
      });
      // Put self first, then most recent first
      const groups = Array.from(map.values()).sort((a, b) => {
        if (a.isSelf) return -1;
        if (b.isSelf) return 1;
        return b.stories[0].created_at.localeCompare(a.stories[0].created_at);
      });
      return groups;
    },
  });
};

export const usePostStory = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      if (!user) throw new Error("unauthenticated");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("stories").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("stories").createSignedUrl(path, 60 * 60 * 25);
      const url = signed?.signedUrl;
      if (!url) throw new Error("failed to sign url");
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const { error } = await sb.rpc("post_story", { p_media_url: url, p_media_type: mediaType, p_caption: caption ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories-active"] }),
  });
};

export const useViewStory = () =>
  useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await sb.rpc("view_story", { p_story_id: storyId });
      if (error) throw error;
    },
  });

export const useDeleteStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await sb.from("stories").delete().eq("id", storyId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stories-active"] }),
  });
};