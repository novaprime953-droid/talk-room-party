import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useGrantXP = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, source }: { amount: number; source?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.rpc('grant_xp', {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source ?? 'activity',
      });
      if (error) throw error;
      return data as { success: boolean; new_xp: number; new_level: number; leveled_up: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const usePurchaseVIP = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vipLevel, cost }: { vipLevel: number; cost: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.rpc('purchase_vip', {
        p_user_id: user.id,
        p_vip_level: vipLevel,
        p_cost: cost,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const getXPForNextLevel = (level: number) => level * 1000;

export const getVIPFromSpending = (totalSpent: number): number => {
  if (totalSpent >= 10000000) return 10;
  if (totalSpent >= 5000000) return 9;
  if (totalSpent >= 2000000) return 8;
  if (totalSpent >= 1000000) return 7;
  if (totalSpent >= 500000) return 6;
  if (totalSpent >= 200000) return 5;
  if (totalSpent >= 100000) return 4;
  if (totalSpent >= 50000) return 3;
  if (totalSpent >= 10000) return 2;
  if (totalSpent >= 1000) return 1;
  return 0;
};
