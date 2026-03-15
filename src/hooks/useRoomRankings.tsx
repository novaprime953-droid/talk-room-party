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

const aggregateAndFetchProfiles = async (
  data: { sender_id: string; coins_spent: number }[],
  limit = 50
) => {
  if (!data.length) return [];

  // Aggregate by sender
  const map = new Map<string, number>();
  for (const t of data) {
    map.set(t.sender_id, (map.get(t.sender_id) ?? 0) + t.coins_spent);
  }

  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const userIds = sorted.map(s => s[0]);

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
};

export const useRoomRankings = (roomId: string, period: Period) => {
  return useQuery({
    queryKey: ['room-rankings', roomId, period],
    queryFn: async () => {
      const start = getPeriodStart(period);
      const { data, error } = await supabase
        .from('gift_transactions')
        .select('sender_id, coins_spent')
        .eq('room_id', roomId)
        .gte('created_at', start);

      if (error) throw error;
      return aggregateAndFetchProfiles(data ?? []);
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
      return aggregateAndFetchProfiles(data ?? []);
    },
  });
};