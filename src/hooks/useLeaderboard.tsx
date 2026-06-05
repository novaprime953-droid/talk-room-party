import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLeaderboard = (type: 'gifters' | 'receivers' | 'hosts') => {
  return useQuery({
    queryKey: ['leaderboard', type],
    queryFn: async () => {
      if (type === 'hosts') {
        const { data, error } = await supabase
          .from('hosts')
          .select('*')
          .order('total_earnings', { ascending: false })
          .limit(50);
        if (error) throw error;
        const ids = (data ?? []).map((h: any) => h.user_id);
        const { data: profiles } = await supabase
          .from('public_profiles_view')
          .select('user_id, username, display_name, avatar_url, level')
          .in('user_id', ids);
        const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
        return (data ?? []).map((h: any) => ({ ...h, profiles: map.get(h.user_id) ?? null }));
      }
      // For gifters/receivers we query non-sensitive profile fields by level as proxy
      const { data, error } = await supabase
        .from('public_profiles_view')
        .select('*')
        .order('level', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
};
