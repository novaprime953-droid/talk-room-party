
-- 1) Restrict public SELECT policies to authenticated only
DROP POLICY IF EXISTS "Family members viewable by all" ON public.family_members;
CREATE POLICY "Family members viewable by authenticated"
  ON public.family_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Comments viewable by all" ON public.post_comments;
CREATE POLICY "Comments viewable by authenticated"
  ON public.post_comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Likes viewable by all" ON public.post_likes;
CREATE POLICY "Likes viewable by authenticated"
  ON public.post_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Messages viewable by all" ON public.room_messages;
CREATE POLICY "Messages viewable by authenticated"
  ON public.room_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Participants viewable by room members" ON public.room_participants;
CREATE POLICY "Participants viewable by authenticated"
  ON public.room_participants FOR SELECT TO authenticated USING (true);

-- user_medals (table exists per schema)
DROP POLICY IF EXISTS "User medals viewable by all" ON public.user_medals;
DROP POLICY IF EXISTS "Medals viewable by all" ON public.user_medals;
CREATE POLICY "User medals viewable by authenticated"
  ON public.user_medals FOR SELECT TO authenticated USING (true);

-- Revoke anon SELECT grants (defense in depth) — keep authenticated/service_role
REVOKE SELECT ON public.family_members FROM anon;
REVOKE SELECT ON public.post_comments FROM anon;
REVOKE SELECT ON public.post_likes FROM anon;
REVOKE SELECT ON public.room_messages FROM anon;
REVOKE SELECT ON public.room_participants FROM anon;
REVOKE SELECT ON public.user_medals FROM anon;

-- 2) coin_transactions: remove direct client INSERT. All inserts must flow
-- through SECURITY DEFINER RPCs (send_gift, grant_xp, purchase_vip,
-- owner_send_coins, seller_send_coins, start_game, purchase_prop, etc.)
-- which bypass RLS and write balance_after authoritatively.
DROP POLICY IF EXISTS "Privileged users insert coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users insert own coin transactions" ON public.coin_transactions;
REVOKE INSERT ON public.coin_transactions FROM authenticated, anon;
