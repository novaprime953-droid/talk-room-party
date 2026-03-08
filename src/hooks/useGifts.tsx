import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useGiftsCatalog = () => {
  return useQuery({
    queryKey: ['gifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('is_active', true)
        .order('coin_value', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useSendGift = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      receiverId, roomId, giftId, quantity = 1,
    }: {
      receiverId: string;
      roomId: string;
      giftId: string;
      quantity?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.rpc('send_gift', {
        p_sender_id: user.id,
        p_receiver_id: receiverId,
        p_room_id: roomId,
        p_gift_id: giftId,
        p_quantity: quantity,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useGiftHistory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['gift-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('gift_transactions')
        .select('*, gifts(gift_name, icon_url, coin_value)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
