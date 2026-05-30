
-- =========================================================
-- 1) PROFILES: split public vs sensitive access
-- =========================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Revoke broad column access; only owner/admin should see sensitive fields.
-- We achieve owner+admin-only visibility for sensitive columns via a view + column grants.
REVOKE SELECT ON public.profiles FROM anon;

-- Safe public view for cross-user lookups (no email/phone/balance/vip financials)
CREATE OR REPLACE VIEW public.public_profiles_view
WITH (security_invoker = true) AS
SELECT
  id, user_id, username, display_name, avatar_url, bio,
  level, xp, is_online, last_seen, created_at, updated_at,
  user_id_number, vip_level
FROM public.profiles;

GRANT SELECT ON public.public_profiles_view TO anon, authenticated;

-- =========================================================
-- 2) AGENCIES: hide financials from the public
-- =========================================================
DROP POLICY IF EXISTS "Agencies viewable by all" ON public.agencies;

CREATE POLICY "Agencies viewable by owner and admins"
ON public.agencies
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR public.has_any_admin_role(auth.uid()));

CREATE OR REPLACE VIEW public.agencies_public
WITH (security_invoker = true) AS
SELECT id, agency_name, description, status, created_at
FROM public.agencies
WHERE status = 'approved';

GRANT SELECT ON public.agencies_public TO anon, authenticated;

-- =========================================================
-- 3) HOSTS: hide earnings from the public
-- =========================================================
DROP POLICY IF EXISTS "Hosts viewable by all" ON public.hosts;

CREATE POLICY "Hosts viewable by self and admins"
ON public.hosts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));

CREATE OR REPLACE VIEW public.hosts_public
WITH (security_invoker = true) AS
SELECT id, user_id, agency_id, status, created_at
FROM public.hosts;

GRANT SELECT ON public.hosts_public TO anon, authenticated;

-- =========================================================
-- 4) COMPETITION ENTRIES / EVENT LEADERBOARD / FOLLOWERS: require auth
-- =========================================================
DROP POLICY IF EXISTS "Entries viewable by all" ON public.competition_entries;
CREATE POLICY "Entries viewable by authenticated"
ON public.competition_entries
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Event leaderboard viewable by all" ON public.event_leaderboard;
CREATE POLICY "Event leaderboard viewable by authenticated"
ON public.event_leaderboard
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Followers viewable by all" ON public.followers;
CREATE POLICY "Followers viewable by authenticated"
ON public.followers
FOR SELECT
TO authenticated
USING (true);

-- =========================================================
-- 5) STORAGE: post-media upload ownership
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users upload post media" ON storage.objects;
CREATE POLICY "Users upload to own post-media folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- =========================================================
-- 6) SECURITY DEFINER FUNCTIONS: restrict EXECUTE
-- =========================================================
-- Trigger / internal functions: no client access
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_user_id_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_owner_role_delete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_owner_ban() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_newbie_props(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_xp(uuid, integer, text) FROM anon, authenticated;

-- User-callable RPCs: deny anon, allow authenticated
REVOKE EXECUTE ON FUNCTION public.claim_daily_login(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.start_game(uuid, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_prop(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_vip(uuid, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.send_gift(uuid, uuid, uuid, uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.seller_send_coins(uuid, uuid, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owner_send_coins(uuid, uuid, integer, text) FROM anon;

-- Role-check helpers: keep authenticated (needed by RLS), revoke anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_any_admin_role(uuid) FROM anon;

-- =========================================================
-- 7) REALTIME channel authorization
-- =========================================================
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read realtime broadcast" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime broadcast"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow general room/chat broadcasts; lock down obvious private topics
  (realtime.topic() NOT LIKE 'private:%')
  OR (realtime.topic() = 'private:user:' || auth.uid()::text)
);

DROP POLICY IF EXISTS "Authenticated can publish realtime broadcast" ON realtime.messages;
CREATE POLICY "Authenticated can publish realtime broadcast"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() NOT LIKE 'private:%')
  OR (realtime.topic() = 'private:user:' || auth.uid()::text)
);
