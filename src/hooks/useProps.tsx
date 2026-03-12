import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Prop {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  animation_url: string | null;
  price: number;
  duration_days: number | null;
  is_active: boolean;
  created_at: string;
}

export interface UserProp {
  id: string;
  user_id: string;
  prop_id: string;
  is_equipped: boolean;
  purchased_at: string;
  expires_at: string | null;
  status: string;
  gifted_by: string | null;
  props?: Prop;
}

export const useStoreProps = (category?: string) => {
  return useQuery({
    queryKey: ['store-props', category],
    queryFn: async () => {
      let q = supabase.from('props').select('*').eq('is_active', true).order('price');
      if (category && category !== 'all') q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return data as Prop[];
    },
  });
};

export const useMyProps = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-props', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_props')
        .select('*, props(*)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw error;
      return data as UserProp[];
    },
    enabled: !!user,
  });
};

export const useEquippedProps = (userId?: string) => {
  return useQuery({
    queryKey: ['equipped-props', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_props')
        .select('*, props(*)')
        .eq('user_id', userId)
        .eq('is_equipped', true)
        .eq('status', 'active');
      if (error) throw error;
      return data as UserProp[];
    },
    enabled: !!userId,
  });
};

export const usePurchaseProp = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (propId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.rpc('purchase_prop', {
        p_user_id: user.id,
        p_prop_id: propId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-props'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['store-props'] });
      toast.success('Prop purchased!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useToggleEquip = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userPropId, equip, category }: { userPropId: string; equip: boolean; category: string }) => {
      if (!user) throw new Error('Not authenticated');
      // If equipping, unequip others in same category first
      if (equip) {
        const { data: myProps } = await supabase
          .from('user_props')
          .select('id, props(category)')
          .eq('user_id', user.id)
          .eq('is_equipped', true)
          .eq('status', 'active');
        const sameCategory = (myProps as any[])?.filter(p => p.props?.category === category);
        if (sameCategory?.length) {
          for (const p of sameCategory) {
            await supabase.from('user_props').update({ is_equipped: false }).eq('id', p.id);
          }
        }
      }
      const { error } = await supabase
        .from('user_props')
        .update({ is_equipped: equip })
        .eq('id', userPropId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-props'] });
      qc.invalidateQueries({ queryKey: ['equipped-props'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
