
-- Event leaderboard table
CREATE TABLE public.event_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score BIGINT NOT NULL DEFAULT 0,
  rank INTEGER,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event leaderboard viewable by all" ON public.event_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Admins manage event leaderboard" ON public.event_leaderboard
  FOR ALL USING (public.has_any_admin_role(auth.uid()));

-- Add banner redirect fields
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS redirect_type TEXT NOT NULL DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS redirect_id TEXT;

-- Add invited_by to user_roles for invite tracking
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS invited_by UUID;

-- Update profiles RLS to allow admins to update any profile (for ban/edit)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.has_any_admin_role(auth.uid()));

-- Enable realtime for event_leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_leaderboard;
