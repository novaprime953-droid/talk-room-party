import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserRoles = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
    enabled: !!user,
  });
};

export const useHasRole = (role: string) => {
  const { data: roles } = useUserRoles();
  return roles?.includes(role) ?? false;
};

export const useAdminStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, rooms, reports] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('voice_rooms').select('id', { count: 'exact', head: true }).eq('is_live', true),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return {
        totalUsers: users.count ?? 0,
        activeRooms: rooms.count ?? 0,
        pendingReports: reports.count ?? 0,
      };
    },
    enabled: !!user,
  });
};

export const useAdminUsers = (search?: string) => {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false }).limit(50);
      if (search) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useReports = (status?: string) => {
  return useQuery({
    queryKey: ['reports', status],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(username), reported:profiles!reports_reported_user_id_fkey(username)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
