import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export const useDMThreads = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`dm-threads-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_threads" }, () => {
        qc.invalidateQueries({ queryKey: ["dm-threads", user.id] });
        qc.invalidateQueries({ queryKey: ["dm-unread", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: ["dm-threads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from("dm_threads")
        .select("*")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(100);
      if (error) throw error;
      const threads = (data ?? []) as any[];
      const otherIds = threads.map((t) => (t.user_a === user!.id ? t.user_b : t.user_a));
      let profiles: Record<string, any> = {};
      if (otherIds.length) {
        const { data: profs } = await sb
          .from("profiles")
          .select("user_id, user_id_number, username, display_name, avatar_url")
          .in("user_id", otherIds);
        (profs ?? []).forEach((p: any) => (profiles[p.user_id] = p));
      }
      return threads.map((t) => {
        const otherId = t.user_a === user!.id ? t.user_b : t.user_a;
        const unread = t.user_a === user!.id ? t.unread_a : t.unread_b;
        return { ...t, other: profiles[otherId] ?? null, unread };
      });
    },
  });
};

export const useDMUnreadTotal = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dm-unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await sb
        .from("dm_threads")
        .select("user_a, user_b, unread_a, unread_b")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`);
      if (error) throw error;
      return (data ?? []).reduce((acc: number, t: any) => {
        const u = t.user_a === user!.id ? t.unread_a : t.unread_b;
        return acc + (u ?? 0);
      }, 0);
    },
  });
};

export const useThreadMessages = (threadId?: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`dm-msg-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${threadId}` }, () => {
        qc.invalidateQueries({ queryKey: ["dm-messages", threadId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId, qc]);

  return useQuery({
    queryKey: ["dm-messages", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("dm_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useSendDM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      receiverId: string;
      content?: string | null;
      mediaUrl?: string | null;
      mediaType?: "text" | "voice" | "image";
      duration?: number | null;
    }) => {
      const { data, error } = await sb.rpc("send_dm", {
        p_receiver_id: payload.receiverId,
        p_content: payload.content ?? null,
        p_media_url: payload.mediaUrl ?? null,
        p_media_type: payload.mediaType ?? "text",
        p_duration: payload.duration ?? null,
      });
      if (error) throw error;
      return data as { success: boolean; thread_id: string; message_id: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["dm-messages", data.thread_id] });
      qc.invalidateQueries({ queryKey: ["dm-threads"] });
    },
  });
};

export const useMarkThreadRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (threadId: string) => {
      const { data, error } = await sb.rpc("mark_thread_read", { p_thread_id: threadId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dm-threads"] });
      qc.invalidateQueries({ queryKey: ["dm-unread"] });
    },
  });
};

// Look up (or lazy-create by messaging) a thread with a given user
export const useOrCreateThreadWith = (otherUserId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dm-thread-with", user?.id, otherUserId],
    enabled: !!user && !!otherUserId,
    queryFn: async () => {
      const [a, b] = [user!.id, otherUserId!].sort();
      const { data } = await sb
        .from("dm_threads")
        .select("*")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      return data ?? null;
    },
  });
};