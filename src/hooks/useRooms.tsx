import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useLiveRooms = (category?: string) => {
  return useQuery({
    queryKey: ['rooms', 'live', category],
    queryFn: async () => {
      let query = supabase
        .from('voice_rooms')
        .select('*, profiles!voice_rooms_host_id_fkey(username, display_name, avatar_url)')
        .eq('is_live', true)
        .eq('status', 'active')
        .order('listener_count', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });
};

export const useRoom = (roomId: string) => {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });
};

export const useCreateRoom = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (room: {
      room_name: string;
      description?: string;
      category: string;
      privacy_type: string;
      max_seats: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('voice_rooms')
        .insert({ ...room, host_id: user.id, is_live: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useRoomParticipants = (roomId: string) => {
  return useQuery({
    queryKey: ['room-participants', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_participants')
        .select('*, profiles!room_participants_user_id_fkey(username, display_name, avatar_url)')
        .eq('room_id', roomId)
        .is('left_at', null);
      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
    refetchInterval: 5000,
  });
};

export const useJoinRoom = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, seatIndex }: { roomId: string; seatIndex?: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('room_participants')
        .upsert({
          room_id: roomId,
          user_id: user.id,
          seat_index: seatIndex,
          left_at: null,
        }, { onConflict: 'room_id,user_id' });
      if (error) throw error;
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['room-participants', roomId] });
    },
  });
};

export const useLeaveRoom = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('room_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['room-participants', roomId] });
    },
  });
};
