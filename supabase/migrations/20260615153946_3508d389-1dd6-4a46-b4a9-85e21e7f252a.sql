
-- TITLES catalog
CREATE TABLE IF NOT EXISTS public.titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  role app_role,
  auto_assign BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.titles TO authenticated, anon;
GRANT ALL ON public.titles TO service_role;
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "titles_read_all" ON public.titles FOR SELECT USING (is_active = true);
CREATE POLICY "titles_owner_all" ON public.titles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE TABLE IF NOT EXISTS public.user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title_id UUID NOT NULL REFERENCES public.titles(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, title_id)
);
GRANT SELECT ON public.user_titles TO authenticated;
GRANT ALL ON public.user_titles TO service_role;
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_titles_read_self_or_owner" ON public.user_titles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "user_titles_owner_write" ON public.user_titles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

-- Profile equipped fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_title_id UUID,
  ADD COLUMN IF NOT EXISTS equipped_badge_key TEXT,
  ADD COLUMN IF NOT EXISTS equipped_frame_user_prop_id UUID;

-- Allow protect_profile_sensitive_fields trigger to permit these new fields (they aren't listed there, so already allowed).

-- RPCs
CREATE OR REPLACE FUNCTION public.owner_grant_title(p_user_id uuid, p_title_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'owner') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.user_titles(user_id,title_id,granted_by) VALUES (p_user_id,p_title_id,auth.uid())
  ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('success',true);
END $$;

CREATE OR REPLACE FUNCTION public.owner_revoke_title(p_user_id uuid, p_title_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'owner') THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.user_titles WHERE user_id=p_user_id AND title_id=p_title_id;
  UPDATE public.profiles SET equipped_title_id=NULL WHERE user_id=p_user_id AND equipped_title_id=p_title_id;
  RETURN jsonb_build_object('success',true);
END $$;

CREATE OR REPLACE FUNCTION public.equip_title(p_title_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_title_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_titles WHERE user_id=v_uid AND title_id=p_title_id) THEN
    RAISE EXCEPTION 'title_not_owned';
  END IF;
  UPDATE public.profiles SET equipped_title_id=p_title_id WHERE user_id=v_uid;
  RETURN jsonb_build_object('success',true);
END $$;

CREATE OR REPLACE FUNCTION public.equip_badge(p_badge_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_badge_key IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id=v_uid AND badge_key=p_badge_key) THEN
    RAISE EXCEPTION 'badge_not_owned';
  END IF;
  UPDATE public.profiles SET equipped_badge_key=p_badge_key WHERE user_id=v_uid;
  RETURN jsonb_build_object('success',true);
END $$;

CREATE OR REPLACE FUNCTION public.equip_frame_prop(p_user_prop_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_user_prop_id IS NOT NULL THEN
    PERFORM 1 FROM public.user_props up JOIN public.props pr ON pr.id=up.prop_id
      WHERE up.id=p_user_prop_id AND up.user_id=v_uid AND up.status='active'
        AND (up.expires_at IS NULL OR up.expires_at>now()) AND pr.category='frame';
    IF NOT FOUND THEN RAISE EXCEPTION 'frame_not_owned'; END IF;
    UPDATE public.user_props SET is_equipped=false WHERE user_id=v_uid AND id IN (
      SELECT up2.id FROM public.user_props up2 JOIN public.props pr2 ON pr2.id=up2.prop_id
      WHERE up2.user_id=v_uid AND pr2.category='frame');
    UPDATE public.user_props SET is_equipped=true WHERE id=p_user_prop_id;
  ELSE
    UPDATE public.user_props SET is_equipped=false WHERE user_id=v_uid AND id IN (
      SELECT up3.id FROM public.user_props up3 JOIN public.props pr3 ON pr3.id=up3.prop_id
      WHERE up3.user_id=v_uid AND pr3.category='frame');
  END IF;
  UPDATE public.profiles SET equipped_frame_user_prop_id=p_user_prop_id WHERE user_id=v_uid;
  RETURN jsonb_build_object('success',true);
END $$;

-- SECURITY FIX 1: user_badges public read -> authenticated only
DROP POLICY IF EXISTS "Anyone can view badges" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_select_all" ON public.user_badges;
DROP POLICY IF EXISTS "public_read_user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_read" ON public.user_badges;
CREATE POLICY "user_badges_read_authenticated" ON public.user_badges
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.user_badges FROM anon;

-- SECURITY FIX 2: remove direct seller UPDATE on recharge_requests
DROP POLICY IF EXISTS "Sellers process recharges" ON public.recharge_requests;
DROP POLICY IF EXISTS "sellers_process_recharges" ON public.recharge_requests;
-- (approve_recharge / reject_recharge SECURITY DEFINER RPCs continue to handle updates)
