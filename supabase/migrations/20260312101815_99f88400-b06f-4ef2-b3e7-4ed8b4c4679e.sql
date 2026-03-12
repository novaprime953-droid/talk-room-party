
-- Props table
CREATE TABLE public.props (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'frame',
  image_url TEXT,
  animation_url TEXT,
  price INTEGER NOT NULL DEFAULT 100,
  duration_days INTEGER, -- NULL = permanent
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User props table
CREATE TABLE public.user_props (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prop_id UUID NOT NULL REFERENCES public.props(id) ON DELETE CASCADE,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  gifted_by UUID
);

-- Indexes
CREATE INDEX idx_user_props_user ON public.user_props(user_id);
CREATE INDEX idx_user_props_equipped ON public.user_props(user_id, is_equipped) WHERE is_equipped = true;
CREATE INDEX idx_props_category ON public.props(category);

-- RLS
ALTER TABLE public.props ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_props ENABLE ROW LEVEL SECURITY;

-- Props: viewable by all, managed by admins
CREATE POLICY "Props viewable by all" ON public.props FOR SELECT USING (true);
CREATE POLICY "Admins manage props" ON public.props FOR ALL USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'super_admin'));

-- User props: users see own, admins see all
CREATE POLICY "Users view own props" ON public.user_props FOR SELECT USING (auth.uid() = user_id OR has_any_admin_role(auth.uid()));
CREATE POLICY "Users insert own props" ON public.user_props FOR INSERT WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'owner'));
CREATE POLICY "Users update own props" ON public.user_props FOR UPDATE USING (auth.uid() = user_id OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins delete user props" ON public.user_props FOR DELETE USING (has_any_admin_role(auth.uid()));

-- Purchase prop function
CREATE OR REPLACE FUNCTION public.purchase_prop(p_user_id UUID, p_prop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prop RECORD;
  v_balance INTEGER;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_prop FROM public.props WHERE id = p_prop_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prop not found or inactive'; END IF;

  -- Check if already owned and active
  IF EXISTS (
    SELECT 1 FROM public.user_props 
    WHERE user_id = p_user_id AND prop_id = p_prop_id AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RAISE EXCEPTION 'You already own this prop';
  END IF;

  SELECT coins_balance INTO v_balance FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_balance < v_prop.price THEN RAISE EXCEPTION 'Insufficient coins. Balance: %, Required: %', v_balance, v_prop.price; END IF;

  -- Calculate expiry
  IF v_prop.duration_days IS NOT NULL THEN
    v_expires := now() + (v_prop.duration_days || ' days')::INTERVAL;
  END IF;

  -- Deduct coins
  UPDATE public.profiles SET coins_balance = coins_balance - v_prop.price WHERE user_id = p_user_id;

  -- Create user prop
  INSERT INTO public.user_props (user_id, prop_id, expires_at)
  VALUES (p_user_id, p_prop_id, v_expires);

  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -v_prop.price, 'prop_purchase', 'Purchased: ' || v_prop.name,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_user_id));

  RETURN jsonb_build_object('success', true, 'new_balance', v_balance - v_prop.price);
END;
$$;

-- Updated_at trigger for props
CREATE TRIGGER update_props_updated_at BEFORE UPDATE ON public.props
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
