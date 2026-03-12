
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage RLS: anyone can view, users upload/update/delete own
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed newbie props
INSERT INTO public.props (name, category, image_url, price, duration_days, is_active) VALUES
  ('Newbie Frame', 'frame', null, 0, 3, true),
  ('Newbie Vehicle', 'vehicle', null, 0, 3, true),
  ('Newbie Bubble', 'chat_bubble', null, 0, 3, true);

-- Function to grant newbie props (called from handle_new_user)
CREATE OR REPLACE FUNCTION public.grant_newbie_props(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prop RECORD;
BEGIN
  FOR v_prop IN SELECT id, duration_days FROM public.props WHERE name LIKE 'Newbie%' AND is_active = true
  LOOP
    INSERT INTO public.user_props (user_id, prop_id, is_equipped, expires_at)
    VALUES (p_user_id, v_prop.id, true, now() + (COALESCE(v_prop.duration_days, 3) || ' days')::INTERVAL);
  END LOOP;
END;
$$;

-- Update handle_new_user to also grant newbie props
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  INSERT INTO public.profiles (user_id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  SELECT COUNT(*) INTO user_count FROM public.profiles;

  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  -- Grant newbie props
  PERFORM public.grant_newbie_props(NEW.id);

  RETURN NEW;
END;
$$;
