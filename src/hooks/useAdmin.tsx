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

type AppRole = 'admin' | 'agency_owner' | 'business_dev' | 'coins_seller' | 'host' | 'manager' | 'owner' | 'super_admin' | 'user';

export const useHasRole = (role: AppRole) => {
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
        const trimmed = search.trim();
        const isNumeric = /^\d+$/.test(trimmed);
        if (isNumeric) {
          query = query.or(`user_id_number.eq.${trimmed},username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`);
        } else {
          query = query.or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`);
        }
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
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
