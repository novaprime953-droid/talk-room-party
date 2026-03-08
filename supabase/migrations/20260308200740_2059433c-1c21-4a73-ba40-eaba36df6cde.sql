
-- System settings table for configurable values
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by admins" ON public.system_settings FOR SELECT USING (
  has_any_admin_role(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role)
);
CREATE POLICY "Owner manages settings" ON public.system_settings FOR ALL USING (
  has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('coin_transfer_limits', '{"min": 1, "max": 999999999}'::jsonb, 'Min/max coin transfer limits'),
  ('commission_rates', '{"host_share": 0.7, "platform_share": 0.3, "agency_commission": 0.1}'::jsonb, 'Revenue commission rates'),
  ('voice_room_settings', '{"max_seats": 12, "default_seats": 8, "max_rooms_per_user": 5}'::jsonb, 'Voice room configuration'),
  ('coin_packages', '{"exchange_rate": 100, "min_recharge": 1, "min_withdrawal": 10}'::jsonb, 'Coin exchange settings'),
  ('security_settings', '{"max_login_attempts": 5, "ban_duration_days": 7, "auto_moderate": true}'::jsonb, 'Security configuration');

-- Update send_gift to skip deduction for owner
CREATE OR REPLACE FUNCTION public.send_gift(p_sender_id uuid, p_receiver_id uuid, p_room_id uuid, p_gift_id uuid, p_quantity integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gift RECORD;
  v_total_cost INTEGER;
  v_sender_balance INTEGER;
  v_is_owner BOOLEAN;
BEGIN
  SELECT * INTO v_gift FROM public.gifts WHERE id = p_gift_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gift not found'; END IF;
  
  v_total_cost := v_gift.coin_value * p_quantity;
  
  -- Check if sender is owner (unlimited coins)
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_sender_id AND role = 'owner') INTO v_is_owner;
  
  IF NOT v_is_owner THEN
    SELECT coins_balance INTO v_sender_balance FROM public.profiles WHERE user_id = p_sender_id;
    IF v_sender_balance < v_total_cost THEN RAISE EXCEPTION 'Insufficient coins'; END IF;
    -- Deduct from sender (not owner)
    UPDATE public.profiles SET coins_balance = coins_balance - v_total_cost WHERE user_id = p_sender_id;
  END IF;
  
  -- Credit receiver (host gets percentage)
  UPDATE public.profiles SET coins_balance = coins_balance + (v_total_cost * 0.7)::INTEGER WHERE user_id = p_receiver_id;
  
  -- Record transaction
  INSERT INTO public.gift_transactions (sender_id, receiver_id, room_id, gift_id, quantity, coins_spent)
  VALUES (p_sender_id, p_receiver_id, p_room_id, p_gift_id, p_quantity, v_total_cost);
  
  IF NOT v_is_owner THEN
    INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
    VALUES (p_sender_id, -v_total_cost, 'gift_sent', 'Gift: ' || v_gift.gift_name,
      (SELECT coins_balance FROM public.profiles WHERE user_id = p_sender_id));
  END IF;
  
  INSERT INTO public.coin_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_receiver_id, (v_total_cost * 0.7)::INTEGER, 'gift_received', 'Gift: ' || v_gift.gift_name,
    (SELECT coins_balance FROM public.profiles WHERE user_id = p_receiver_id));
  
  -- Update host earnings if applicable
  UPDATE public.hosts SET total_earnings = total_earnings + (v_total_cost * 0.7 * 0.01)::DECIMAL,
    monthly_earnings = monthly_earnings + (v_total_cost * 0.7 * 0.01)::DECIMAL
  WHERE user_id = p_receiver_id;
  
  RETURN jsonb_build_object('success', true, 'coins_spent', v_total_cost, 'owner_free', v_is_owner);
END;
$$;
