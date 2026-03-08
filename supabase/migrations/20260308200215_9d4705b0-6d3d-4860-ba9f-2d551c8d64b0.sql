
-- Function for coins sellers to send coins to users
CREATE OR REPLACE FUNCTION public.seller_send_coins(
  p_seller_id UUID,
  p_target_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Coins purchase'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify sender is coins_seller or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_seller_id AND role IN ('coins_seller', 'owner', 'super_admin', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only coins sellers can use this function';
  END IF;

  IF p_amount < 1 THEN RAISE EXCEPTION 'Amount must be at least 1'; END IF;

  -- Add coins to target
  UPDATE public.profiles SET coins_balance = coins_balance + p_amount WHERE user_id = p_target_id;

  -- Record transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_target_id, p_amount, 'seller_transfer', p_description,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_target_id));

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$;
