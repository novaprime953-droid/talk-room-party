import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLeaderboard = (type: 'gifters' | 'receivers' | 'hosts') => {
  return useQuery({
    queryKey: ['leaderboard', type],
    queryFn: async () => {
      if (type === 'hosts') {
        const { data, error } = await supabase
          .from('hosts')
          .select('*, profiles:profiles!inner(username, display_name, avatar_url, level)')
          .order('total_earnings', { ascending: false })
          .limit(50);
        if (error) throw error;
        return data;
      }
      // For gifters/receivers we query profiles by XP/level as proxy
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('level', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
};
