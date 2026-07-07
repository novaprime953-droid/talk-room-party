
-- 1. voice_room_passwords: add explicit deny-all policies (access only via SECURITY DEFINER RPCs)
CREATE POLICY "Block all direct access" ON public.voice_room_passwords
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- 2. Revoke EXECUTE from anon on SECURITY DEFINER RPCs (keep authenticated + service_role)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, public', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- 3. hosts: block direct modification of earnings columns; force RPC use
CREATE OR REPLACE FUNCTION public.protect_host_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.total_earnings IS DISTINCT FROM OLD.total_earnings
     OR NEW.monthly_earnings IS DISTINCT FROM OLD.monthly_earnings THEN
    RAISE EXCEPTION 'Earnings fields cannot be modified directly. Use the appropriate RPC.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_host_earnings ON public.hosts;
CREATE TRIGGER trg_protect_host_earnings
  BEFORE UPDATE ON public.hosts
  FOR EACH ROW EXECUTE FUNCTION public.protect_host_earnings();

-- 4. post_media: add DELETE + UPDATE policies scoped to post owner or admin
CREATE POLICY "Owners or admins delete post media" ON public.post_media
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_media.post_id AND p.user_id = auth.uid())
    OR public.has_any_admin_role(auth.uid())
  );

CREATE POLICY "Owners or admins update post media" ON public.post_media
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_media.post_id AND p.user_id = auth.uid())
    OR public.has_any_admin_role(auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_media.post_id AND p.user_id = auth.uid())
    OR public.has_any_admin_role(auth.uid())
  );

-- 5. withdrawal_requests: restrict policies to authenticated role only
DROP POLICY IF EXISTS "Users create withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users view own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins process withdrawals" ON public.withdrawal_requests;

CREATE POLICY "Users create withdrawals" ON public.withdrawal_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins process withdrawals" ON public.withdrawal_requests
  FOR UPDATE TO authenticated
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));

REVOKE ALL ON public.withdrawal_requests FROM anon;
REVOKE ALL ON public.voice_room_passwords FROM anon;
