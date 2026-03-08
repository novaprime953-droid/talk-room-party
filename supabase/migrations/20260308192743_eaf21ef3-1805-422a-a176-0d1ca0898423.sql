
-- Function for owner to send coins to any user (unlimited, no balance check)
CREATE OR REPLACE FUNCTION public.owner_send_coins(p_owner_id uuid, p_target_id uuid, p_amount integer, p_description text DEFAULT 'Owner gift')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify sender is owner
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_owner_id AND role = 'owner') THEN
    RAISE EXCEPTION 'Only the owner can use this function';
  END IF;

  IF p_amount < 1 THEN RAISE EXCEPTION 'Amount must be at least 1'; END IF;

  -- Add coins to target
  UPDATE public.profiles SET coins_balance = coins_balance + p_amount WHERE user_id = p_target_id;

  -- Record transaction for target
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_target_id, p_amount, 'owner_gift', p_description,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_target_id));

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$function$;
