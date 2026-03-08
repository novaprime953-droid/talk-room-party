
-- =============================================
-- TALK ROOM - Complete Database Schema
-- =============================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('user', 'host', 'admin', 'super_admin', 'owner', 'manager', 'business_dev', 'agency_owner', 'coins_seller');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  coins_balance INTEGER NOT NULL DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Voice rooms
CREATE TABLE public.voice_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  privacy_type TEXT NOT NULL DEFAULT 'public' CHECK (privacy_type IN ('public', 'private', 'password')),
  password_hash TEXT,
  max_seats INTEGER NOT NULL DEFAULT 8 CHECK (max_seats BETWEEN 2 AND 20),
  cover_image TEXT,
  is_live BOOLEAN NOT NULL DEFAULT false,
  listener_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Room participants
CREATE TABLE public.room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.voice_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_index INTEGER,
  mic_status TEXT NOT NULL DEFAULT 'muted' CHECK (mic_status IN ('muted', 'unmuted')),
  is_speaker BOOLEAN NOT NULL DEFAULT false,
  hand_raised BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- 6. Gifts catalog
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_name TEXT NOT NULL,
  icon_url TEXT,
  animation_url TEXT,
  coin_value INTEGER NOT NULL CHECK (coin_value > 0),
  category TEXT NOT NULL DEFAULT 'standard',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Gift transactions
CREATE TABLE public.gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.voice_rooms(id) ON DELETE SET NULL,
  gift_id UUID NOT NULL REFERENCES public.gifts(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  coins_spent INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Coin wallet / transactions
CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'gift_sent', 'gift_received', 'withdrawal', 'reward', 'admin_adjust')),
  description TEXT,
  reference_id UUID,
  balance_after INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Recharge requests
CREATE TABLE public.recharge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  coins_amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Withdrawal requests
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Agencies
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_rate BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. Hosts
CREATE TABLE public.hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1,
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. Reports & Moderation
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_room_id UUID REFERENCES public.voice_rooms(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id),
  resolution_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 14. Bans
CREATE TABLE public.bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  ban_type TEXT NOT NULL DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 15. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'gift', 'system', 'moderation', 'earnings', 'promotion')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 16. Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  event_type TEXT NOT NULL DEFAULT 'general',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rewards JSONB,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 17. Followers
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 18. Room chat messages
CREATE TABLE public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.voice_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'gift', 'system', 'sticker')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_voice_rooms_host ON public.voice_rooms(host_id);
CREATE INDEX idx_voice_rooms_status ON public.voice_rooms(status, is_live);
CREATE INDEX idx_room_participants_room ON public.room_participants(room_id);
CREATE INDEX idx_gift_transactions_sender ON public.gift_transactions(sender_id);
CREATE INDEX idx_gift_transactions_receiver ON public.gift_transactions(receiver_id);
CREATE INDEX idx_coin_transactions_user ON public.coin_transactions(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_bans_user ON public.bans(user_id, is_active);
CREATE INDEX idx_followers_following ON public.followers(following_id);
CREATE INDEX idx_room_messages_room ON public.room_messages(room_id);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION for role checks
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin', 'owner', 'manager')
  )
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: anyone can read, users update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles: viewable by self and admins
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'super_admin'));

-- Voice rooms: public rooms visible to all, users create own
CREATE POLICY "Public rooms are viewable" ON public.voice_rooms FOR SELECT USING (privacy_type = 'public' OR host_id = auth.uid() OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Users can create rooms" ON public.voice_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own rooms" ON public.voice_rooms FOR UPDATE USING (auth.uid() = host_id OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Hosts can delete own rooms" ON public.voice_rooms FOR DELETE USING (auth.uid() = host_id OR public.has_any_admin_role(auth.uid()));

-- Room participants
CREATE POLICY "Participants viewable by room members" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.room_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_participants FOR DELETE USING (auth.uid() = user_id);

-- Gifts catalog: viewable by all
CREATE POLICY "Gifts viewable by all" ON public.gifts FOR SELECT USING (true);
CREATE POLICY "Admins manage gifts" ON public.gifts FOR ALL USING (public.has_any_admin_role(auth.uid()));

-- Gift transactions
CREATE POLICY "Users view own gift transactions" ON public.gift_transactions FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Users can send gifts" ON public.gift_transactions FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Coin transactions
CREATE POLICY "Users view own coin transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));

-- Recharge requests
CREATE POLICY "Users view own recharge requests" ON public.recharge_requests FOR SELECT USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'coins_seller'));
CREATE POLICY "Users create recharge requests" ON public.recharge_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sellers process recharges" ON public.recharge_requests FOR UPDATE USING (public.has_role(auth.uid(), 'coins_seller') OR public.has_any_admin_role(auth.uid()));

-- Withdrawal requests
CREATE POLICY "Users view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Users create withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins process withdrawals" ON public.withdrawal_requests FOR UPDATE USING (public.has_any_admin_role(auth.uid()));

-- Agencies
CREATE POLICY "Agencies viewable by all" ON public.agencies FOR SELECT USING (true);
CREATE POLICY "Users create agencies" ON public.agencies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Agency owners update own" ON public.agencies FOR UPDATE USING (auth.uid() = owner_id OR public.has_any_admin_role(auth.uid()));

-- Hosts
CREATE POLICY "Hosts viewable by all" ON public.hosts FOR SELECT USING (true);
CREATE POLICY "Users register as host" ON public.hosts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Hosts update own record" ON public.hosts FOR UPDATE USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));

-- Reports
CREATE POLICY "Users create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users view own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins manage reports" ON public.reports FOR UPDATE USING (public.has_any_admin_role(auth.uid()));

-- Bans
CREATE POLICY "Admins manage bans" ON public.bans FOR ALL USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Users see own bans" ON public.bans FOR SELECT USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Events
CREATE POLICY "Events viewable by all" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL USING (public.has_any_admin_role(auth.uid()) OR public.has_role(auth.uid(), 'business_dev'));

-- Followers
CREATE POLICY "Followers viewable by all" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- Room messages
CREATE POLICY "Messages viewable by all" ON public.room_messages FOR SELECT USING (true);
CREATE POLICY "Users send messages" ON public.room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_voice_rooms_updated_at BEFORE UPDATE ON public.voice_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recharge_requests_updated_at BEFORE UPDATE ON public.recharge_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hosts_updated_at BEFORE UPDATE ON public.hosts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- GIFT SENDING FUNCTION (atomic transaction)
-- =============================================
CREATE OR REPLACE FUNCTION public.send_gift(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_room_id UUID,
  p_gift_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift RECORD;
  v_total_cost INTEGER;
  v_sender_balance INTEGER;
BEGIN
  SELECT * INTO v_gift FROM public.gifts WHERE id = p_gift_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gift not found'; END IF;
  
  v_total_cost := v_gift.coin_value * p_quantity;
  
  SELECT coins_balance INTO v_sender_balance FROM public.profiles WHERE user_id = p_sender_id;
  IF v_sender_balance < v_total_cost THEN RAISE EXCEPTION 'Insufficient coins'; END IF;
  
  -- Deduct from sender
  UPDATE public.profiles SET coins_balance = coins_balance - v_total_cost WHERE user_id = p_sender_id;
  -- Credit receiver (host gets percentage)
  UPDATE public.profiles SET coins_balance = coins_balance + (v_total_cost * 0.7)::INTEGER WHERE user_id = p_receiver_id;
  
  -- Record transaction
  INSERT INTO public.gift_transactions (sender_id, receiver_id, room_id, gift_id, quantity, coins_spent)
  VALUES (p_sender_id, p_receiver_id, p_room_id, p_gift_id, p_quantity, v_total_cost);
  
  -- Record coin transactions
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_sender_id, -v_total_cost, 'gift_sent', 'Gift: ' || v_gift.gift_name,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_sender_id));
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_receiver_id, (v_total_cost * 0.7)::INTEGER, 'gift_received', 'Gift: ' || v_gift.gift_name,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_receiver_id));
  
  -- Update host earnings if applicable
  UPDATE public.hosts SET total_earnings = total_earnings + (v_total_cost * 0.7 * 0.01)::DECIMAL,
    monthly_earnings = monthly_earnings + (v_total_cost * 0.7 * 0.01)::DECIMAL
  WHERE user_id = p_receiver_id;
  
  RETURN jsonb_build_object('success', true, 'coins_spent', v_total_cost);
END;
$$;
