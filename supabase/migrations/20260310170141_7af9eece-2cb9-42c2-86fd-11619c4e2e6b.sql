
-- Create seller_recharge_requests table for seller-to-owner recharge flow
CREATE TABLE public.seller_recharge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  coins_amount INTEGER NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_recharge_requests ENABLE ROW LEVEL SECURITY;

-- Sellers can create requests
CREATE POLICY "Sellers create recharge requests" ON public.seller_recharge_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Sellers view own, owner/admin view all
CREATE POLICY "View seller recharge requests" ON public.seller_recharge_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = seller_id OR has_role(auth.uid(), 'owner') OR has_any_admin_role(auth.uid()));

-- Owner can update (approve/reject)
CREATE POLICY "Owner processes seller recharges" ON public.seller_recharge_requests
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'super_admin'));

-- Updated seller_send_coins to DEDUCT from seller wallet
CREATE OR REPLACE FUNCTION public.seller_send_coins(p_seller_id uuid, p_target_id uuid, p_amount integer, p_description text DEFAULT 'Coins purchase'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_seller_balance INTEGER;
BEGIN
  -- Verify sender is coins_seller or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_seller_id AND role IN ('coins_seller', 'owner', 'super_admin', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only coins sellers can use this function';
  END IF;

  IF p_amount < 1 THEN RAISE EXCEPTION 'Amount must be at least 1'; END IF;

  -- Check if seller is owner (unlimited coins)
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_seller_id AND role = 'owner') THEN
    -- Owner: no deduction, just add to target
    UPDATE public.profiles SET coins_balance = coins_balance + p_amount WHERE user_id = p_target_id;
    
    INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
    VALUES (p_target_id, p_amount, 'seller_transfer', p_description,
      (SELECT coins_balance FROM public.profiles WHERE user_id = p_target_id));
    
    RETURN jsonb_build_object('success', true, 'amount', p_amount, 'owner_free', true);
  END IF;

  -- Regular seller: check balance
  SELECT coins_balance INTO v_seller_balance FROM public.profiles WHERE user_id = p_seller_id;
  
  IF v_seller_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient coins in seller wallet. Balance: %, Required: %', v_seller_balance, p_amount;
  END IF;

  -- Deduct from seller
  UPDATE public.profiles SET coins_balance = coins_balance - p_amount WHERE user_id = p_seller_id;
  
  -- Record seller deduction transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_seller_id, -p_amount, 'seller_transfer_out', 'Sent to user: ' || p_description,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_seller_id));

  -- Add coins to target
  UPDATE public.profiles SET coins_balance = coins_balance + p_amount WHERE user_id = p_target_id;

  -- Record target receive transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_target_id, p_amount, 'seller_transfer', p_description,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_target_id));

  RETURN jsonb_build_object('success', true, 'amount', p_amount, 'seller_balance', v_seller_balance - p_amount);
END;
$$;
