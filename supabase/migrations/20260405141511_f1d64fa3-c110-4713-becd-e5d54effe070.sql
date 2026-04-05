
-- Families table
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  badge_url TEXT,
  owner_id UUID NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 50,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Family members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Medals table
CREATE TABLE public.medals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT NOT NULL DEFAULT 'achievement',
  unlock_condition JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User medals table
CREATE TABLE public.user_medals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medal_id UUID NOT NULL REFERENCES public.medals(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, medal_id)
);

-- RLS
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medals ENABLE ROW LEVEL SECURITY;

-- Families policies
CREATE POLICY "Families viewable by all" ON public.families FOR SELECT USING (true);
CREATE POLICY "Users create families" ON public.families FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update families" ON public.families FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR has_any_admin_role(auth.uid()));
CREATE POLICY "Owners delete families" ON public.families FOR DELETE TO authenticated USING (auth.uid() = owner_id OR has_any_admin_role(auth.uid()));

-- Family members policies
CREATE POLICY "Family members viewable by all" ON public.family_members FOR SELECT USING (true);
CREATE POLICY "Users join families" ON public.family_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave families" ON public.family_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins update members" ON public.family_members FOR UPDATE TO authenticated USING (has_any_admin_role(auth.uid()) OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_members.family_id AND f.owner_id = auth.uid()));

-- Medals policies
CREATE POLICY "Medals viewable by all" ON public.medals FOR SELECT USING (true);
CREATE POLICY "Admins manage medals" ON public.medals FOR ALL TO authenticated USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));

-- User medals policies
CREATE POLICY "User medals viewable by all" ON public.user_medals FOR SELECT USING (true);
CREATE POLICY "System inserts medals" ON public.user_medals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR has_any_admin_role(auth.uid()));

-- Insert default medals
INSERT INTO public.medals (name, description, category, unlock_condition) VALUES
('VIP Bronze', 'Reach VIP Level 1', 'vip', '{"type":"vip_level","value":1}'),
('VIP Silver', 'Reach VIP Level 3', 'vip', '{"type":"vip_level","value":3}'),
('VIP Gold', 'Reach VIP Level 5', 'vip', '{"type":"vip_level","value":5}'),
('VIP Diamond', 'Reach VIP Level 8', 'vip', '{"type":"vip_level","value":8}'),
('VIP Crown', 'Reach VIP Level 10', 'vip', '{"type":"vip_level","value":10}'),
('First Gift', 'Send your first gift', 'sender', '{"type":"gifts_sent","value":1}'),
('Gift Master', 'Send 100 gifts', 'sender', '{"type":"gifts_sent","value":100}'),
('Gift Legend', 'Send 1000 gifts', 'sender', '{"type":"gifts_sent","value":1000}'),
('Event Star', 'Participate in 1 event', 'event', '{"type":"events_joined","value":1}'),
('Event Champion', 'Win top 3 in any event', 'event', '{"type":"event_top3","value":1}'),
('Social Butterfly', 'Get 100 followers', 'social', '{"type":"followers","value":100}'),
('Rising Star', 'Reach Level 10', 'achievement', '{"type":"level","value":10}');
