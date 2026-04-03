
DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "Admins or self insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR has_any_admin_role(auth.uid()));
