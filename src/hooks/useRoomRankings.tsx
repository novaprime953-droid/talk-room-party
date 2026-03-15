import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Period = 'daily' | 'weekly' | 'monthly';

const getPeriodStart = (period: Period) => {
  const now = new Date();
  if (period === 'daily') {
    now.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    now.setDate(now.getDate() - now.getDay());
    now.setHours(0, 0, 0, 0);
  } else {
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
  }
  return now.toISOString();
};

export const useRoomRankings = (roomId: string, period: Period) => {
  return useQuery({
    queryKey: ['room-rankings', roomId, period],
    queryFn: async () => {
      const start = getPeriodStart(period);
      // Get gift transactions for this room in the period, grouped by sender
      const { data, error } = await supabase
        .from('gift_transactions')
        .select('sender_id, coins_spent')
        .eq('room_id', roomId)
        .gte('created_at', start);

      if (error) throw error;
      if (!data) return [];

      // Aggregate by sender
      const map = new Map<string, { userId: string; name: string; avatar: string | null; total: number }>();
      for (const t of data as any[]) {
        const existing = map.get(t.sender_id);
        const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
        if (existing) {
          existing.total += t.coins_spent;
        } else {
          map.set(t.sender_id, {
            userId: t.sender_id,
            name: profile?.display_name ?? profile?.username ?? 'User',
            avatar: profile?.avatar_url ?? null,
            total: t.coins_spent,
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
    enabled: !!roomId,
  });
};

export const useGlobalRankings = (period: Period) => {
  return useQuery({
    queryKey: ['global-rankings', period],
    queryFn: async () => {
      const start = getPeriodStart(period);
      const { data, error } = await supabase
        .from('gift_transactions')
        .select('sender_id, coins_spent')
        .gte('created_at', start);

      if (error) throw error;
      if (!data) return [];

      const map = new Map<string, number>();
      for (const t of data) {
        map.set(t.sender_id, (map.get(t.sender_id) ?? 0) + t.coins_spent);
      }

      // Get top 50 user IDs
      const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 50);
      const userIds = sorted.map(s => s[0]);
      if (!userIds.length) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, level')
        .in('user_id', userIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

      return sorted.map(([userId, total]) => {
        const p = profileMap.get(userId);
        return {
          userId,
          name: p?.display_name ?? p?.username ?? 'User',
          avatar: p?.avatar_url ?? null,
          level: p?.level ?? 1,
          total,
        };
      });
    },
  });
};
