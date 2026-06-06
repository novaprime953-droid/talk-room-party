
-- 1. Prevent self-editing sensitive profile fields (coins, vip)
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role and SECURITY DEFINER RPCs bypass this; only block direct user updates
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- Admins can update other people's profiles via separate policy; still block them from
  -- changing financial fields directly through the table (must use RPCs).
  IF NEW.coins_balance IS DISTINCT FROM OLD.coins_balance
     OR NEW.vip_level    IS DISTINCT FROM OLD.vip_level
     OR NEW.vip_xp       IS DISTINCT FROM OLD.vip_xp
     OR NEW.vip_start    IS DISTINCT FROM OLD.vip_start
     OR NEW.vip_end      IS DISTINCT FROM OLD.vip_end
     OR NEW.xp           IS DISTINCT FROM OLD.xp
     OR NEW.level        IS DISTINCT FROM OLD.level
     OR NEW.user_id_number IS DISTINCT FROM OLD.user_id_number
     OR NEW.user_id      IS DISTINCT FROM OLD.user_id
     OR NEW.email        IS DISTINCT FROM OLD.email
  THEN
    RAISE EXCEPTION 'Field cannot be modified directly. Use the appropriate RPC.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_sensitive_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- 2. Move voice room password hash to a private table
CREATE TABLE IF NOT EXISTS public.voice_room_passwords (
  room_id uuid PRIMARY KEY REFERENCES public.voice_rooms(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.voice_room_passwords TO service_role;
-- Intentionally no GRANTs to anon/authenticated; access is via SECURITY DEFINER RPC.
ALTER TABLE public.voice_room_passwords ENABLE ROW LEVEL SECURITY;
-- No policies => no client access.

-- Migrate existing data
INSERT INTO public.voice_room_passwords (room_id, password_hash)
SELECT id, password_hash FROM public.voice_rooms
WHERE password_hash IS NOT NULL
ON CONFLICT (room_id) DO NOTHING;

ALTER TABLE public.voice_rooms DROP COLUMN IF EXISTS password_hash;

-- RPC: set room password (host or admin)
CREATE OR REPLACE FUNCTION public.set_room_password(p_room_id uuid, p_password_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT host_id INTO v_host FROM public.voice_rooms WHERE id = p_room_id;
  IF v_host IS NULL THEN RAISE EXCEPTION 'room_not_found'; END IF;
  IF v_host <> auth.uid() AND NOT public.has_any_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_password_hash IS NULL THEN
    DELETE FROM public.voice_room_passwords WHERE room_id = p_room_id;
  ELSE
    INSERT INTO public.voice_room_passwords(room_id, password_hash)
    VALUES (p_room_id, p_password_hash)
    ON CONFLICT (room_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now();
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: verify room password without leaking hash
CREATE OR REPLACE FUNCTION public.verify_room_password(p_room_id uuid, p_password_hash text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.voice_room_passwords
    WHERE room_id = p_room_id AND password_hash = p_password_hash
  );
$$;

REVOKE ALL ON FUNCTION public.set_room_password(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_room_password(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_room_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_room_password(uuid, text) TO authenticated;

-- 3. game_transactions: revoke direct insert
DROP POLICY IF EXISTS "Users insert own game transactions" ON public.game_transactions;
REVOKE INSERT ON public.game_transactions FROM authenticated, anon;

-- 4. post_shares: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Shares viewable by all" ON public.post_shares;
CREATE POLICY "Shares viewable by authenticated"
ON public.post_shares FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.post_shares FROM anon;

-- 5. seat_events: require user is a participant in the room
DROP POLICY IF EXISTS "Users insert own seat events" ON public.seat_events;
CREATE POLICY "Users insert own seat events"
ON public.seat_events FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = seat_events.room_id
      AND rp.user_id = auth.uid()
      AND rp.left_at IS NULL
  )
);

-- 6. competition_entries: enforce starting score and unclaimed reward
DROP POLICY IF EXISTS "Users join competitions" ON public.competition_entries;
CREATE POLICY "Users join competitions"
ON public.competition_entries FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(score, 0) = 0
  AND COALESCE(reward_claimed, false) = false
  AND rank IS NULL
  AND COALESCE(reward_amount, 0) = 0
);

-- 7. Atomic recharge approval RPC (audited)
CREATE OR REPLACE FUNCTION public.approve_recharge(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_req RECORD;
  v_new_balance int;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT (public.has_any_admin_role(v_caller)
          OR public.has_role(v_caller, 'coins_seller')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_req FROM public.recharge_requests
  WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'already_processed';
  END IF;

  UPDATE public.profiles
  SET coins_balance = coins_balance + v_req.coins_amount
  WHERE user_id = v_req.user_id
  RETURNING coins_balance INTO v_new_balance;

  INSERT INTO public.coin_transactions(user_id, amount, type, description, balance_after, reference_id)
  VALUES (v_req.user_id, v_req.coins_amount, 'recharge',
          'Recharge approved: ' || v_req.coins_amount || ' coins',
          v_new_balance, v_req.id);

  UPDATE public.recharge_requests
  SET status = 'approved', processed_by = v_caller, updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_recharge(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT (public.has_any_admin_role(v_caller)
          OR public.has_role(v_caller, 'coins_seller')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.recharge_requests
  SET status = 'rejected', processed_by = v_caller, updated_at = now()
  WHERE id = p_request_id AND status = 'pending';
  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.approve_recharge(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_recharge(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_recharge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_recharge(uuid) TO authenticated;

-- 8. Switch public_profiles_view to invoker security with safe columns only.
-- Add a permissive SELECT policy on profiles restricted to non-sensitive columns
-- is impossible at RLS level, so we keep the view but use security_invoker=true
-- and add a dedicated SELECT policy granting access to all authenticated users
-- via the view by using a SECURITY DEFINER function fallback.
-- Simpler: keep SECURITY DEFINER view (accepted risk - documented in security memory).
-- Just refresh definition to ensure only safe columns are exposed.
DROP VIEW IF EXISTS public.public_profiles_view;
CREATE VIEW public.public_profiles_view
WITH (security_invoker = false) AS
SELECT id, user_id, username, display_name, avatar_url, bio,
       level, xp, is_online, last_seen, created_at, updated_at,
       user_id_number, vip_level
FROM public.profiles;
GRANT SELECT ON public.public_profiles_view TO authenticated, anon;
