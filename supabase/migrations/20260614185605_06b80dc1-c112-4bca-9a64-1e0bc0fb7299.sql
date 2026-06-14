
-- BADGES catalog
CREATE TABLE public.badges (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  role app_role,
  auto_assign BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Owner manages badges" ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER trg_badges_updated BEFORE UPDATE ON public.badges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER_BADGES
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_key TEXT NOT NULL REFERENCES public.badges(key) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads user_badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Owner manages user_badges" ON public.user_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Seed badges
INSERT INTO public.badges (key, name, image_path, role, auto_assign, sort_order) VALUES
  ('owner',        'Owner',         'owner.png',         'owner',        true, 10),
  ('super_admin',  'Super Admin',   'super_admin.png',   'super_admin',  true, 20),
  ('admin',        'Admin',         'admin.png',         'admin',        true, 30),
  ('manager',      'Manager',       'manager.png',       'manager',      true, 40),
  ('bd',           'Business Dev',  'bd.png',            'business_dev', true, 50),
  ('agency',       'Agency',        'agency.png',        'agency_owner', true, 60),
  ('coins_seller', 'Coins Seller',  'coins_seller.png',  'coins_seller', true, 70),
  ('family_leader','Family Leader', 'family_leader.png', NULL,           true, 80),
  ('event_winner', 'Event Winner',  'event_winner.png',  NULL,           false,90);

-- Sync function: grants/revokes role badges for a user
CREATE OR REPLACE FUNCTION public.sync_role_badges(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Add badges for currently-held roles that have auto_assign
  INSERT INTO public.user_badges (user_id, badge_key)
  SELECT p_user_id, b.key
  FROM public.badges b
  JOIN public.user_roles ur ON ur.role = b.role AND ur.user_id = p_user_id
  WHERE b.auto_assign = true AND b.role IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- Remove auto badges whose role the user no longer has
  DELETE FROM public.user_badges ub
  USING public.badges b
  WHERE ub.user_id = p_user_id
    AND ub.badge_key = b.key
    AND b.auto_assign = true
    AND b.role IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p_user_id AND ur.role = b.role);
END $$;

CREATE OR REPLACE FUNCTION public.tg_user_roles_sync_badges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.sync_role_badges(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_user_roles_badges
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.tg_user_roles_sync_badges();

-- Family leader sync
CREATE OR REPLACE FUNCTION public.tg_families_sync_badge()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_badges (user_id, badge_key) VALUES (NEW.owner_id, 'family_leader')
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM public.families WHERE owner_id = OLD.owner_id) THEN
      DELETE FROM public.user_badges WHERE user_id = OLD.owner_id AND badge_key = 'family_leader';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.owner_id <> OLD.owner_id THEN
    INSERT INTO public.user_badges (user_id, badge_key) VALUES (NEW.owner_id, 'family_leader')
    ON CONFLICT DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM public.families WHERE owner_id = OLD.owner_id) THEN
      DELETE FROM public.user_badges WHERE user_id = OLD.owner_id AND badge_key = 'family_leader';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_families_badge
AFTER INSERT OR UPDATE OR DELETE ON public.families
FOR EACH ROW EXECUTE FUNCTION public.tg_families_sync_badge();

-- Backfill from current roles + families
INSERT INTO public.user_badges (user_id, badge_key)
SELECT DISTINCT ur.user_id, b.key
FROM public.user_roles ur JOIN public.badges b ON b.role = ur.role
WHERE b.auto_assign = true
ON CONFLICT DO NOTHING;
INSERT INTO public.user_badges (user_id, badge_key)
SELECT DISTINCT owner_id, 'family_leader' FROM public.families
ON CONFLICT DO NOTHING;

-- Owner grant/revoke RPCs (event_winner etc.)
CREATE OR REPLACE FUNCTION public.owner_grant_badge(p_user_id UUID, p_badge_key TEXT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.user_badges (user_id, badge_key, granted_by)
  VALUES (p_user_id, p_badge_key, auth.uid())
  ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('success', true);
END $$;

CREATE OR REPLACE FUNCTION public.owner_revoke_badge(p_user_id UUID, p_badge_key TEXT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.user_badges WHERE user_id = p_user_id AND badge_key = p_badge_key;
  RETURN jsonb_build_object('success', true);
END $$;

-- Public read for badges bucket
CREATE POLICY "Badges bucket public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'badges');
CREATE POLICY "Owner uploads badges" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'badges' AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owner updates badges" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'badges' AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owner deletes badges" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'badges' AND public.has_role(auth.uid(), 'owner'));
