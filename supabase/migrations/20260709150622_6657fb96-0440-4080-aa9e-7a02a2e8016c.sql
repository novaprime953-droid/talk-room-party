
-- Toggle follow / unfollow
CREATE OR REPLACE FUNCTION public.toggle_follow(p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exists boolean;
  v_now_following boolean;
  v_followers_count int;
  v_following_count int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_uid = p_target_id THEN RAISE EXCEPTION 'cannot_follow_self'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.followers WHERE follower_id = v_uid AND following_id = p_target_id) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.followers WHERE follower_id = v_uid AND following_id = p_target_id;
    v_now_following := false;
  ELSE
    INSERT INTO public.followers (follower_id, following_id) VALUES (v_uid, p_target_id)
    ON CONFLICT DO NOTHING;
    v_now_following := true;

    -- Notify target
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (p_target_id, 'New follower', 'Someone started following you', 'follow');
  END IF;

  SELECT count(*) INTO v_followers_count FROM public.followers WHERE following_id = p_target_id;
  SELECT count(*) INTO v_following_count FROM public.followers WHERE follower_id = p_target_id;

  RETURN jsonb_build_object(
    'success', true,
    'following', v_now_following,
    'followers_count', v_followers_count,
    'following_count', v_following_count
  );
END;
$$;

-- Counts for a given user
CREATE OR REPLACE FUNCTION public.get_follow_counts(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'followers', (SELECT count(*) FROM public.followers WHERE following_id = p_user_id),
    'following', (SELECT count(*) FROM public.followers WHERE follower_id = p_user_id),
    'friends', (
      SELECT count(*) FROM public.followers f1
      WHERE f1.follower_id = p_user_id
        AND EXISTS (SELECT 1 FROM public.followers f2 WHERE f2.follower_id = f1.following_id AND f2.following_id = p_user_id)
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.toggle_follow(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_follow_counts(uuid) TO authenticated, anon;
