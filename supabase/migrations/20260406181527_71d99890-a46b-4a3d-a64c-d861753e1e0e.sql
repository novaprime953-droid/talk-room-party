
-- Fix coin_transactions type check to include all transaction types
ALTER TABLE public.coin_transactions DROP CONSTRAINT coin_transactions_type_check;
ALTER TABLE public.coin_transactions ADD CONSTRAINT coin_transactions_type_check 
  CHECK (type = ANY (ARRAY[
    'recharge', 'gift_sent', 'gift_received', 'withdrawal', 'reward', 
    'admin_adjust', 'seller_transfer', 'owner_gift', 'seller_transfer_out',
    'game_entry', 'game_win', 'prop_purchase', 'vip_purchase', 'level_reward',
    'daily_login', 'task_reward', 'family_create', 'transfer'
  ]));

-- Create daily_logins table to track login streaks
CREATE TABLE public.daily_logins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_granted INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own logins" ON public.daily_logins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logins" ON public.daily_logins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to claim daily login XP
CREATE OR REPLACE FUNCTION public.claim_daily_login(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_already_claimed BOOLEAN;
  v_result jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.daily_logins 
    WHERE user_id = p_user_id AND login_date = CURRENT_DATE
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already claimed today');
  END IF;

  INSERT INTO public.daily_logins (user_id, login_date, xp_granted)
  VALUES (p_user_id, CURRENT_DATE, 50);

  -- Grant 50 XP
  v_result := public.grant_xp(p_user_id, 50, 'daily_login');

  RETURN jsonb_build_object('success', true, 'xp_granted', 50, 'level_info', v_result);
END;
$$;
