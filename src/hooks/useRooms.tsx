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

export const useRoomsByCountry = (country: string) => {
  return useQuery({
    queryKey: ['rooms', 'country', country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_rooms')
        .select('*, profiles!voice_rooms_host_id_fkey(username, display_name, avatar_url)')
        .eq('is_live', true)
        .eq('status', 'active')
        .eq('country', country)
        .order('listener_count', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!country,
    refetchInterval: 10000,
  });
};

export const useMyRoom = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['rooms', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('voice_rooms')
        .select('*, profiles!voice_rooms_host_id_fkey(username, display_name, avatar_url)')
        .eq('host_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useFollowingRooms = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['rooms', 'following', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get following IDs
      const { data: follows, error: fErr } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);
      if (fErr) throw fErr;
      if (!follows || follows.length === 0) return [];

      const followingIds = follows.map(f => f.following_id);
      const { data, error } = await supabase
        .from('voice_rooms')
        .select('*, profiles!voice_rooms_host_id_fkey(username, display_name, avatar_url)')
        .in('host_id', followingIds)
        .eq('is_live', true)
        .eq('status', 'active')
        .order('listener_count', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
};

export const useRecentRooms = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['rooms', 'recent', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: participations, error: pErr } = await supabase
        .from('room_participants')
        .select('room_id, joined_at')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(10);
      if (pErr) throw pErr;
      if (!participations || participations.length === 0) return [];

      const roomIds = [...new Set(participations.map(p => p.room_id))];
      const { data, error } = await supabase
        .from('voice_rooms')
        .select('*, profiles!voice_rooms_host_id_fkey(username, display_name, avatar_url)')
        .in('id', roomIds)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
      country?: string;
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
