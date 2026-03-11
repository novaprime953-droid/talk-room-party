
-- Game transactions table
CREATE TABLE public.game_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_name TEXT NOT NULL,
  coins_used INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL DEFAULT 'pending',
  coins_won INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_game_user FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.game_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view own game transactions
CREATE POLICY "Users view own game transactions"
  ON public.game_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.has_any_admin_role(auth.uid()));

-- Users can insert own game transactions
CREATE POLICY "Users insert own game transactions"
  ON public.game_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Deduct coins and record game transaction atomically
CREATE OR REPLACE FUNCTION public.start_game(
  p_user_id UUID,
  p_game_name TEXT,
  p_coins_required INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance INTEGER;
  v_tx_id UUID;
BEGIN
  IF p_coins_required < 1 THEN RAISE EXCEPTION 'Invalid coins amount'; END IF;

  SELECT coins_balance INTO v_balance FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_balance < p_coins_required THEN
    RAISE EXCEPTION 'Insufficient coins. Balance: %, Required: %', v_balance, p_coins_required;
  END IF;

  -- Deduct coins
  UPDATE public.profiles SET coins_balance = coins_balance - p_coins_required WHERE user_id = p_user_id;

  -- Record game transaction
  INSERT INTO public.game_transactions (user_id, game_name, coins_used, result)
  VALUES (p_user_id, p_game_name, p_coins_required, 'started')
  RETURNING id INTO v_tx_id;

  -- Record coin transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after, reference_id)
  VALUES (p_user_id, -p_coins_required, 'game_entry', 'Game: ' || p_game_name,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_user_id), v_tx_id);

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id, 'new_balance', v_balance - p_coins_required);
END;
$$;
