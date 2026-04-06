import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useDailyLogin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const claimed = useRef(false);

  useEffect(() => {
    if (!user || claimed.current) return;
    claimed.current = true;

    const claim = async () => {
      const { data, error } = await supabase.rpc('claim_daily_login', {
        p_user_id: user.id,
      });
      if (error) return;
      const result = data as any;
      if (result?.success) {
        toast.success('🎉 Daily Login Reward: +50 XP!');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    };
    claim();
  }, [user, queryClient]);
};
