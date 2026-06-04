
-- ============== seat_events ==============
CREATE TABLE public.seat_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  seat_index integer,
  target_user_id uuid,
  success boolean NOT NULL DEFAULT true,
  failure_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seat_events_room_idx ON public.seat_events(room_id, created_at DESC);
CREATE INDEX seat_events_user_idx ON public.seat_events(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.seat_events TO authenticated;
GRANT ALL ON public.seat_events TO service_role;

ALTER TABLE public.seat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own seat events"
  ON public.seat_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Host and admins view seat events"
  ON public.seat_events FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_any_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.voice_rooms r
      WHERE r.id = seat_events.room_id AND r.host_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_events;

-- ============== seat_takeover_requests ==============
CREATE TABLE public.seat_takeover_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  seat_index integer NOT NULL,
  requester_id uuid NOT NULL,
  current_owner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 seconds'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stor_owner_status_idx ON public.seat_takeover_requests(current_owner_id, status);
CREATE INDEX stor_requester_status_idx ON public.seat_takeover_requests(requester_id, status);

GRANT SELECT, INSERT, UPDATE ON public.seat_takeover_requests TO authenticated;
GRANT ALL ON public.seat_takeover_requests TO service_role;

ALTER TABLE public.seat_takeover_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester creates takeover"
  ON public.seat_takeover_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Involved parties view takeover"
  ON public.seat_takeover_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = current_owner_id
    OR public.has_any_admin_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.voice_rooms r
      WHERE r.id = seat_takeover_requests.room_id AND r.host_id = auth.uid()
    )
  );

CREATE POLICY "Owner updates takeover"
  ON public.seat_takeover_requests FOR UPDATE TO authenticated
  USING (auth.uid() = current_owner_id OR auth.uid() = requester_id OR public.has_any_admin_role(auth.uid()));

CREATE TRIGGER stor_updated_at BEFORE UPDATE ON public.seat_takeover_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_takeover_requests;

-- ============== claim_seat ==============
CREATE OR REPLACE FUNCTION public.claim_seat(p_room_id uuid, p_seat_index integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_max int;
  v_my_seat int;
  v_occupied_by uuid;
  v_err text;
  v_msg text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'unauthenticated', 'message', 'Not authenticated');
  END IF;

  SELECT max_seats INTO v_max FROM public.voice_rooms WHERE id = p_room_id;
  IF v_max IS NULL THEN
    INSERT INTO public.seat_events(room_id, user_id, action, seat_index, success, failure_reason)
    VALUES (p_room_id, v_user, 'join_attempt', p_seat_index, false, 'room_not_found');
    RETURN jsonb_build_object('success', false, 'error_code', 'room_not_found', 'message', 'Room not found');
  END IF;

  IF p_seat_index < 0 OR p_seat_index >= v_max THEN
    INSERT INTO public.seat_events(room_id, user_id, action, seat_index, success, failure_reason)
    VALUES (p_room_id, v_user, 'join_attempt', p_seat_index, false, 'invalid_index');
    RETURN jsonb_build_object('success', false, 'error_code', 'invalid_index', 'message', 'Invalid seat index');
  END IF;

  -- Lock all participant rows for this room to serialize concurrent claims
  PERFORM 1 FROM public.room_participants WHERE room_id = p_room_id FOR UPDATE;

  SELECT seat_index INTO v_my_seat
  FROM public.room_participants
  WHERE room_id = p_room_id AND user_id = v_user AND left_at IS NULL
  LIMIT 1;

  IF v_my_seat IS NULL AND NOT EXISTS (
    SELECT 1 FROM public.room_participants WHERE room_id = p_room_id AND user_id = v_user AND left_at IS NULL
  ) THEN
    INSERT INTO public.seat_events(room_id, user_id, action, seat_index, success, failure_reason)
    VALUES (p_room_id, v_user, 'join_attempt', p_seat_index, false, 'not_in_room');
    RETURN jsonb_build_object('success', false, 'error_code', 'not_in_room', 'message', 'Join the room first');
  END IF;

  IF v_my_seat IS NOT NULL AND v_my_seat <> p_seat_index THEN
    INSERT INTO public.seat_events(room_id, user_id, action, seat_index, success, failure_reason, metadata)
    VALUES (p_room_id, v_user, 'join_attempt', p_seat_index, false, 'already_seated',
      jsonb_build_object('current_seat_index', v_my_seat));
    RETURN jsonb_build_object('success', false, 'error_code', 'already_seated',
      'message', 'You already hold seat ' || (v_my_seat + 1), 'current_seat_index', v_my_seat);
  END IF;

  IF v_my_seat = p_seat_index THEN
    RETURN jsonb_build_object('success', true, 'seat_index', p_seat_index, 'noop', true);
  END IF;

  SELECT user_id INTO v_occupied_by
  FROM public.room_participants
  WHERE room_id = p_room_id AND seat_index = p_seat_index AND left_at IS NULL
  LIMIT 1;

  IF v_occupied_by IS NOT NULL AND v_occupied_by <> v_user THEN
    INSERT INTO public.seat_events(room_id, user_id, action, seat_index, target_user_id, success, failure_reason)
    VALUES (p_room_id, v_user, 'join_attempt', p_seat_index, v_occupied_by, false, 'seat_taken');
    RETURN jsonb_build_object('success', false, 'error_code', 'seat_taken',
      'message', 'Seat already occupied', 'occupied_by', v_occupied_by);
  END IF;

  UPDATE public.room_participants
  SET seat_index = p_seat_index
  WHERE room_id = p_room_id AND user_id = v_user AND left_at IS NULL;

  INSERT INTO public.seat_events(room_id, user_id, action, seat_index, success)
  VALUES (p_room_id, v_user, 'join_success', p_seat_index, true);

  RETURN jsonb_build_object('success', true, 'seat_index', p_seat_index);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_seat(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_seat(uuid, integer) TO authenticated;

-- ============== leave_seat ==============
CREATE OR REPLACE FUNCTION public.leave_seat(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_seat int;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'unauthenticated');
  END IF;

  SELECT seat_index INTO v_seat
  FROM public.room_participants
  WHERE room_id = p_room_id AND user_id = v_user AND left_at IS NULL
  FOR UPDATE;

  IF v_seat IS NULL THEN
    RETURN jsonb_build_object('success', true, 'noop', true);
  END IF;

  UPDATE public.room_participants
  SET seat_index = NULL
  WHERE room_id = p_room_id AND user_id = v_user AND left_at IS NULL;

  INSERT INTO public.seat_events(room_id, user_id, action, seat_index, success)
  VALUES (p_room_id, v_user, 'leave', v_seat, true);

  RETURN jsonb_build_object('success', true, 'seat_index', v_seat);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.leave_seat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_seat(uuid) TO authenticated;

-- ============== request_seat_takeover ==============
CREATE OR REPLACE FUNCTION public.request_seat_takeover(p_room_id uuid, p_seat_index integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_owner uuid;
  v_req_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'unauthenticated');
  END IF;

  SELECT user_id INTO v_owner
  FROM public.room_participants
  WHERE room_id = p_room_id AND seat_index = p_seat_index AND left_at IS NULL
  LIMIT 1;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'seat_empty', 'message', 'Seat is empty - just claim it');
  END IF;

  IF v_owner = v_user THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'own_seat', 'message', 'This is your seat');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.seat_takeover_requests
    WHERE room_id = p_room_id AND seat_index = p_seat_index
      AND status = 'pending' AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'pending_request', 'message', 'A takeover request is already pending');
  END IF;

  INSERT INTO public.seat_takeover_requests(room_id, seat_index, requester_id, current_owner_id)
  VALUES (p_room_id, p_seat_index, v_user, v_owner)
  RETURNING id INTO v_req_id;

  INSERT INTO public.seat_events(room_id, user_id, action, seat_index, target_user_id, success, metadata)
  VALUES (p_room_id, v_user, 'takeover_requested', p_seat_index, v_owner, true,
    jsonb_build_object('request_id', v_req_id));

  RETURN jsonb_build_object('success', true, 'request_id', v_req_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_seat_takeover(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_seat_takeover(uuid, integer) TO authenticated;

-- ============== respond_seat_takeover ==============
CREATE OR REPLACE FUNCTION public.respond_seat_takeover(p_request_id uuid, p_accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_req RECORD;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'unauthenticated');
  END IF;

  SELECT * INTO v_req
  FROM public.seat_takeover_requests
  WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'not_found');
  END IF;

  IF v_req.current_owner_id <> v_user THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  IF v_req.status <> 'pending' OR v_req.expires_at < now() THEN
    UPDATE public.seat_takeover_requests SET status = 'expired'
    WHERE id = p_request_id AND status = 'pending';
    RETURN jsonb_build_object('success', false, 'error_code', 'expired');
  END IF;

  IF NOT p_accept THEN
    UPDATE public.seat_takeover_requests SET status = 'denied' WHERE id = p_request_id;
    INSERT INTO public.seat_events(room_id, user_id, action, seat_index, target_user_id, success)
    VALUES (v_req.room_id, v_user, 'takeover_denied', v_req.seat_index, v_req.requester_id, true);
    RETURN jsonb_build_object('success', true, 'accepted', false);
  END IF;

  -- Accept: atomic swap
  PERFORM 1 FROM public.room_participants WHERE room_id = v_req.room_id FOR UPDATE;

  UPDATE public.room_participants SET seat_index = NULL
  WHERE room_id = v_req.room_id AND user_id = v_req.current_owner_id AND left_at IS NULL;

  UPDATE public.room_participants SET seat_index = v_req.seat_index
  WHERE room_id = v_req.room_id AND user_id = v_req.requester_id AND left_at IS NULL;

  UPDATE public.seat_takeover_requests SET status = 'accepted' WHERE id = p_request_id;

  INSERT INTO public.seat_events(room_id, user_id, action, seat_index, target_user_id, success)
  VALUES (v_req.room_id, v_user, 'takeover_accepted', v_req.seat_index, v_req.requester_id, true);

  RETURN jsonb_build_object('success', true, 'accepted', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_seat_takeover(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_seat_takeover(uuid, boolean) TO authenticated;
