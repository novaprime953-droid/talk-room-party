import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const useFeed = () => {
  return useQuery({
    queryKey: ["social-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .in("status", ["active", "promoted"])
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((p: any) => p.user_id))];
      const postIds = data.map((p: any) => p.id);

      const [profilesRes, mediaRes] = await Promise.all([
        supabase.from("public_profiles_view").select("user_id, display_name, username, avatar_url, level, user_id_number").in("user_id", userIds),
        supabase.from("post_media").select("*").in("post_id", postIds),
      ]);

      const profileMap: Record<string, any> = {};
      profilesRes.data?.forEach((p: any) => { profileMap[p.user_id] = p; });

      const mediaMap: Record<string, any[]> = {};
      mediaRes.data?.forEach((m: any) => {
        if (!mediaMap[m.post_id]) mediaMap[m.post_id] = [];
        mediaMap[m.post_id].push(m);
      });

      return data.map((post: any) => ({
        ...post,
        profile: profileMap[post.user_id] || null,
        media: mediaMap[post.id] || [],
      }));
    },
  });
};

export const useCreatePost = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, mediaFiles }: { content: string; mediaFiles?: File[] }) => {
      const { data: post, error } = await supabase
        .from("posts")
        .insert({ user_id: user!.id, content })
        .select()
        .single();
      if (error) throw error;

      if (mediaFiles && mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const ext = file.name.split(".").pop();
          const path = `${user!.id}/${post.id}/${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("post-media").upload(path, file);
          if (uploadErr) throw uploadErr;

          const { data: { publicUrl } } = supabase.storage.from("post-media").getPublicUrl(path);
          await supabase.from("post_media").insert({
            post_id: post.id,
            media_url: publicUrl,
            media_type: file.type.startsWith("video") ? "video" : "image",
            sort_order: i,
          });
        }
      }
      return post;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["social-feed"] }); toast.success("Post created!"); },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useLikePost = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user!.id);
        await supabase.from("posts").update({ likes_count: Math.max(0, -1) }).eq("id", postId);
        // Decrement
        const { data } = await supabase.from("posts").select("likes_count").eq("id", postId).single();
        await supabase.from("posts").update({ likes_count: Math.max(0, (data?.likes_count ?? 1) - 1) }).eq("id", postId);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user!.id });
        const { data } = await supabase.from("posts").select("likes_count").eq("id", postId).single();
        await supabase.from("posts").update({ likes_count: (data?.likes_count ?? 0) + 1 }).eq("id", postId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-feed"] }),
  });
};

export const useMyLikes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("post_likes").select("post_id").eq("user_id", user!.id);
      return new Set(data?.map((l: any) => l.post_id) ?? []);
    },
  });
};

export const usePostComments = (postId: string | null) => {
  return useQuery({
    queryKey: ["post-comments", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase.from("public_profiles_view").select("user_id, display_name, username, avatar_url, user_id_number").in("user_id", userIds);
      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

      return data.map((c: any) => ({ ...c, profile: profileMap[c.user_id] }));
    },
  });
};

export const useAddComment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user!.id,
        content,
        parent_id: parentId || null,
      });
      if (error) throw error;
      // Increment count
      const { data } = await supabase.from("posts").select("comments_count").eq("id", postId).single();
      await supabase.from("posts").update({ comments_count: (data?.comments_count ?? 0) + 1 }).eq("id", postId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["post-comments", vars.postId] });
      qc.invalidateQueries({ queryKey: ["social-feed"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useReportPost = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      const { error } = await supabase.from("post_reports").insert({ post_id: postId, reporter_id: user!.id, reason });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Post reported"),
    onError: (e: any) => toast.error(e.message),
  });
};

// Admin hooks
export const useAllPosts = () => {
  return useQuery({
    queryKey: ["admin-all-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const userIds = [...new Set(data.map((p: any) => p.user_id))];
      const { data: profiles } = await supabase.from("public_profiles_view").select("user_id, display_name, username, avatar_url, user_id_number").in("user_id", userIds);
      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

      return data.map((p: any) => ({ ...p, profile: profileMap[p.user_id] }));
    },
  });
};

export const usePostReports = () => {
  return useQuery({
    queryKey: ["post-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useModeratePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: "delete" | "hide" | "promote" | "pin" | "unpin" | "unpromote" }) => {
      if (action === "delete") {
        await supabase.from("posts").update({ status: "deleted" }).eq("id", postId);
      } else if (action === "hide") {
        await supabase.from("posts").update({ status: "hidden" }).eq("id", postId);
      } else if (action === "promote") {
        await supabase.from("posts").update({ is_promoted: true }).eq("id", postId);
      } else if (action === "unpromote") {
        await supabase.from("posts").update({ is_promoted: false }).eq("id", postId);
      } else if (action === "pin") {
        await supabase.from("posts").update({ is_pinned: true }).eq("id", postId);
      } else if (action === "unpin") {
        await supabase.from("posts").update({ is_pinned: false }).eq("id", postId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-posts"] });
      qc.invalidateQueries({ queryKey: ["social-feed"] });
      toast.success("Post updated");
    },
  });
};
