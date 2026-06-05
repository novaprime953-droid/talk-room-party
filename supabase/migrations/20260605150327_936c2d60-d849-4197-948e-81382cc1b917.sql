
-- Tighten profiles SELECT policy: drop blanket auth-read, restrict sensitive columns
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "Profiles viewable by self and privileged roles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'coins_seller'::app_role)
  OR public.has_role(auth.uid(), 'agency_owner'::app_role)
  OR public.has_role(auth.uid(), 'business_dev'::app_role)
);

-- Recreate public profiles view as a SECURITY DEFINER view (security_invoker=false)
-- so that authenticated users can still read non-sensitive profile fields of any user
-- even though the underlying profiles table is now restricted.
DROP VIEW IF EXISTS public.public_profiles_view;
CREATE VIEW public.public_profiles_view
WITH (security_invoker = false, security_barrier = true)
AS
SELECT
  id,
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  level,
  xp,
  is_online,
  last_seen,
  created_at,
  updated_at,
  user_id_number,
  vip_level
FROM public.profiles;

GRANT SELECT ON public.public_profiles_view TO authenticated;
GRANT SELECT ON public.public_profiles_view TO anon;
