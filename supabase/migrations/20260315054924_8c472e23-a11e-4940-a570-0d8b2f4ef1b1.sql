-- Fix user_props RLS: allow everyone to see equipped props (needed for frames in rooms/leaderboards)
CREATE POLICY "Anyone can view equipped props"
ON public.user_props
FOR SELECT
TO public
USING (is_equipped = true AND status = 'active');

-- Enable realtime for gift_transactions (needed for live gift animations)
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transactions;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;