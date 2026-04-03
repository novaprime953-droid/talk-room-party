
-- Fix notifications: allow system/admin to insert notifications
CREATE POLICY "System insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Fix notifications: allow users to delete their own notifications
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Fix coin_transactions: allow authenticated users to insert (needed for direct inserts)
CREATE POLICY "Authenticated insert coin transactions" ON public.coin_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR has_any_admin_role(auth.uid()));

-- Fix voice_rooms: allow private rooms to be visible to participants
DROP POLICY IF EXISTS "Public rooms are viewable" ON public.voice_rooms;
CREATE POLICY "Rooms are viewable" ON public.voice_rooms
  FOR SELECT TO public
  USING (
    privacy_type = 'public'
    OR host_id = auth.uid()
    OR has_any_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = voice_rooms.id AND rp.user_id = auth.uid() AND rp.left_at IS NULL
    )
  );

-- Fix bans: split ALL policy into specific ones for clarity
DROP POLICY IF EXISTS "Admins manage bans" ON public.bans;
CREATE POLICY "Admins select bans" ON public.bans
  FOR SELECT TO authenticated
  USING (has_any_admin_role(auth.uid()));

CREATE POLICY "Admins insert bans" ON public.bans
  FOR INSERT TO authenticated
  WITH CHECK (has_any_admin_role(auth.uid()));

CREATE POLICY "Admins update bans" ON public.bans
  FOR UPDATE TO authenticated
  USING (has_any_admin_role(auth.uid()));

CREATE POLICY "Admins delete bans" ON public.bans
  FOR DELETE TO authenticated
  USING (has_any_admin_role(auth.uid()));
