
-- 1) user_props: remove direct INSERT
DROP POLICY IF EXISTS "Users insert own props" ON public.user_props;
REVOKE INSERT ON public.user_props FROM authenticated, anon;
GRANT INSERT ON public.user_props TO service_role;

-- 2) gift_transactions: remove direct INSERT
DROP POLICY IF EXISTS "Users can send gifts" ON public.gift_transactions;
REVOKE INSERT ON public.gift_transactions FROM authenticated, anon;
GRANT INSERT ON public.gift_transactions TO service_role;

-- 3) daily_logins: remove direct INSERT
DROP POLICY IF EXISTS "Users insert own logins" ON public.daily_logins;
REVOKE INSERT ON public.daily_logins FROM authenticated, anon;
GRANT INSERT ON public.daily_logins TO service_role;

-- 4) room_messages: require active participation
DROP POLICY IF EXISTS "Users send messages" ON public.room_messages;
CREATE POLICY "Active participants send messages"
  ON public.room_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_messages.room_id
        AND rp.user_id = auth.uid()
        AND rp.left_at IS NULL
    )
  );
