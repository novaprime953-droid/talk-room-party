
-- Competitions table
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  competition_type TEXT NOT NULL DEFAULT 'gifting',
  metric TEXT NOT NULL DEFAULT 'coins_spent',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_by UUID NOT NULL,
  rewards JSONB DEFAULT '[]'::jsonb,
  min_participants INTEGER DEFAULT 0,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competition participants/rankings
CREATE TABLE public.competition_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reward_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

-- Competitions RLS
CREATE POLICY "Competitions viewable by all" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "Admins manage competitions" ON public.competitions FOR ALL USING (
  has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'business_dev'::app_role)
);

-- Competition entries RLS
CREATE POLICY "Entries viewable by all" ON public.competition_entries FOR SELECT USING (true);
CREATE POLICY "Admins manage entries" ON public.competition_entries FOR ALL USING (
  has_any_admin_role(auth.uid())
);
CREATE POLICY "Users join competitions" ON public.competition_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competition_entries_updated_at BEFORE UPDATE ON public.competition_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
