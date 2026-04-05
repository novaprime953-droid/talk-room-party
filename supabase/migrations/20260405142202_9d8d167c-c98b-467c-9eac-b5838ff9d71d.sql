
-- Add VIP columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vip_level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_xp BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS vip_end TIMESTAMP WITH TIME ZONE;

-- Level rewards table
CREATE TABLE public.level_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE,
  coins_reward INTEGER NOT NULL DEFAULT 0,
  prop_id UUID REFERENCES public.props(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.level_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Level rewards viewable by all" ON public.level_rewards FOR SELECT USING (true);
CREATE POLICY "Admins manage level rewards" ON public.level_rewards FOR ALL TO authenticated
  USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));

-- Grant XP function with auto level-up
CREATE OR REPLACE FUNCTION public.grant_xp(p_user_id UUID, p_amount INTEGER, p_source TEXT DEFAULT 'activity')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_required_xp INTEGER;
  v_leveled_up BOOLEAN := false;
  v_reward RECORD;
BEGIN
  SELECT xp, level INTO v_profile FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  v_new_xp := v_profile.xp + p_amount;
  v_new_level := v_profile.level;

  -- Check level ups (xp required = level * 1000)
  LOOP
    v_required_xp := v_new_level * 1000;
    EXIT WHEN v_new_xp < v_required_xp;
    v_new_xp := v_new_xp - v_required_xp;
    v_new_level := v_new_level + 1;
    v_leveled_up := true;

    -- Grant level rewards
    SELECT * INTO v_reward FROM public.level_rewards WHERE level = v_new_level;
    IF FOUND AND v_reward.coins_reward > 0 THEN
      UPDATE public.profiles SET coins_balance = coins_balance + v_reward.coins_reward WHERE user_id = p_user_id;
      INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
      VALUES (p_user_id, v_reward.coins_reward, 'level_reward', 'Level ' || v_new_level || ' reward',
        (SELECT coins_balance FROM public.profiles WHERE user_id = p_user_id));
    END IF;
    IF FOUND AND v_reward.prop_id IS NOT NULL THEN
      INSERT INTO public.user_props (user_id, prop_id, is_equipped, expires_at)
      VALUES (p_user_id, v_reward.prop_id, false, now() + interval '30 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  UPDATE public.profiles SET xp = v_new_xp, level = v_new_level WHERE user_id = p_user_id;

  IF v_leveled_up THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (p_user_id, 'Level Up!', 'Congratulations! You reached Level ' || v_new_level, 'level_up');
  END IF;

  RETURN jsonb_build_object('success', true, 'new_xp', v_new_xp, 'new_level', v_new_level, 'leveled_up', v_leveled_up);
END;
$$;

-- Purchase VIP function
CREATE OR REPLACE FUNCTION public.purchase_vip(p_user_id UUID, p_vip_level INTEGER, p_cost INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance INTEGER;
  v_current_vip INTEGER;
  v_vip_end TIMESTAMPTZ;
BEGIN
  IF p_vip_level < 1 OR p_vip_level > 10 THEN RAISE EXCEPTION 'Invalid VIP level'; END IF;

  SELECT coins_balance, vip_level, vip_end INTO v_balance, v_current_vip, v_vip_end
  FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_balance < p_cost THEN RAISE EXCEPTION 'Insufficient coins'; END IF;

  -- Deduct coins
  UPDATE public.profiles SET
    coins_balance = coins_balance - p_cost,
    vip_level = GREATEST(vip_level, p_vip_level),
    vip_xp = vip_xp + p_cost,
    vip_start = CASE WHEN vip_end IS NULL OR vip_end < now() THEN now() ELSE vip_start END,
    vip_end = CASE WHEN vip_end IS NULL OR vip_end < now() THEN now() + interval '30 days' ELSE vip_end + interval '30 days' END
  WHERE user_id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, -p_cost, 'vip_purchase', 'VIP Level ' || p_vip_level || ' purchase',
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_user_id));

  -- Also grant XP for spending
  PERFORM public.grant_xp(p_user_id, p_cost / 10, 'vip_purchase');

  RETURN jsonb_build_object('success', true, 'vip_level', p_vip_level,
    'vip_end', (SELECT vip_end FROM public.profiles WHERE user_id = p_user_id));
END;
$$;

-- Seed some level rewards
INSERT INTO public.level_rewards (level, coins_reward, description) VALUES
(5, 500, 'Level 5 Reward'),
(10, 1500, 'Level 10 Reward'),
(15, 3000, 'Level 15 Reward'),
(20, 5000, 'Level 20 Reward'),
(30, 10000, 'Level 30 Reward'),
(50, 25000, 'Level 50 Reward');
