
CREATE TABLE public.dm_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_sender_id UUID,
  unread_a INTEGER NOT NULL DEFAULT 0,
  unread_b INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dm_threads_users_order CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
GRANT SELECT, INSERT, UPDATE ON public.dm_threads TO authenticated;
GRANT ALL ON public.dm_threads TO service_role;
ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view threads" ON public.dm_threads FOR SELECT TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE TRIGGER trg_dm_threads_updated BEFORE UPDATE ON public.dm_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'text',
  duration_seconds INTEGER,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dm_messages_thread ON public.dm_messages(thread_id, created_at DESC);
GRANT SELECT, INSERT ON public.dm_messages TO authenticated;
GRANT ALL ON public.dm_messages TO service_role;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view messages" ON public.dm_messages FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_threads;

CREATE OR REPLACE FUNCTION public.send_dm(
  p_receiver_id UUID, p_content TEXT DEFAULT NULL, p_media_url TEXT DEFAULT NULL,
  p_media_type TEXT DEFAULT 'text', p_duration INTEGER DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sender UUID := auth.uid(); v_a UUID; v_b UUID; v_thread_id UUID; v_preview TEXT; v_msg_id UUID;
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_sender = p_receiver_id THEN RAISE EXCEPTION 'cannot_message_self'; END IF;
  IF (p_content IS NULL OR length(trim(p_content)) = 0) AND p_media_url IS NULL THEN RAISE EXCEPTION 'empty_message'; END IF;
  IF v_sender < p_receiver_id THEN v_a := v_sender; v_b := p_receiver_id; ELSE v_a := p_receiver_id; v_b := v_sender; END IF;
  INSERT INTO public.dm_threads(user_a, user_b) VALUES (v_a, v_b)
  ON CONFLICT (user_a, user_b) DO UPDATE SET updated_at = now() RETURNING id INTO v_thread_id;
  v_preview := CASE p_media_type WHEN 'voice' THEN '🎤 Voice message' WHEN 'image' THEN '📷 Image' ELSE left(coalesce(p_content,''),80) END;
  INSERT INTO public.dm_messages(thread_id, sender_id, receiver_id, content, media_url, media_type, duration_seconds)
  VALUES (v_thread_id, v_sender, p_receiver_id, p_content, p_media_url, p_media_type, p_duration) RETURNING id INTO v_msg_id;
  UPDATE public.dm_threads SET last_message_at = now(), last_message_preview = v_preview, last_sender_id = v_sender,
    unread_a = CASE WHEN v_a = p_receiver_id THEN unread_a + 1 ELSE unread_a END,
    unread_b = CASE WHEN v_b = p_receiver_id THEN unread_b + 1 ELSE unread_b END,
    updated_at = now() WHERE id = v_thread_id;
  RETURN jsonb_build_object('success', true, 'thread_id', v_thread_id, 'message_id', v_msg_id);
END $$;

CREATE OR REPLACE FUNCTION public.mark_thread_read(p_thread_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_a UUID; v_b UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT user_a, user_b INTO v_a, v_b FROM public.dm_threads WHERE id = p_thread_id;
  IF v_uid <> v_a AND v_uid <> v_b THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.dm_messages SET read_at = now() WHERE thread_id = p_thread_id AND receiver_id = v_uid AND read_at IS NULL;
  UPDATE public.dm_threads SET
    unread_a = CASE WHEN v_uid = v_a THEN 0 ELSE unread_a END,
    unread_b = CASE WHEN v_uid = v_b THEN 0 ELSE unread_b END
  WHERE id = p_thread_id;
  RETURN jsonb_build_object('success', true);
END $$;

CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stories_active ON public.stories(expires_at, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT SELECT ON public.stories TO anon;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View active stories" ON public.stories FOR SELECT TO authenticated, anon USING (expires_at > now());
CREATE POLICY "Users create own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.story_views (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users record own views" ON public.story_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Owners and viewers can read" ON public.story_views FOR SELECT TO authenticated
USING (auth.uid() = viewer_id OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.post_story(p_media_url TEXT, p_media_type TEXT DEFAULT 'image', p_caption TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_media_url IS NULL OR length(p_media_url) = 0 THEN RAISE EXCEPTION 'media_required'; END IF;
  INSERT INTO public.stories(user_id, media_url, media_type, caption) VALUES (v_uid, p_media_url, p_media_type, p_caption) RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'story_id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.view_story(p_story_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_owner UUID; v_inserted BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT user_id INTO v_owner FROM public.stories WHERE id = p_story_id AND expires_at > now();
  IF v_owner IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  IF v_owner = v_uid THEN RETURN jsonb_build_object('success', true, 'own', true); END IF;
  INSERT INTO public.story_views(story_id, viewer_id) VALUES (p_story_id, v_uid) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted THEN UPDATE public.stories SET view_count = view_count + 1 WHERE id = p_story_id; END IF;
  RETURN jsonb_build_object('success', true);
END $$;
