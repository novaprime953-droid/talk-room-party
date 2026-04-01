
-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_promoted BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post media table
CREATE TABLE public.post_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post likes
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post shares
CREATE TABLE public.post_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post reports
CREATE TABLE public.post_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ID change history
CREATE TABLE public.id_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  old_id BIGINT NOT NULL,
  new_id BIGINT NOT NULL,
  changed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_change_history ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts viewable by all" ON public.posts FOR SELECT USING (status = 'active' OR status = 'promoted' OR user_id = auth.uid() OR has_any_admin_role(auth.uid()));
CREATE POLICY "Users create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id OR has_any_admin_role(auth.uid()));
CREATE POLICY "Admins delete posts" ON public.posts FOR DELETE USING (auth.uid() = user_id OR has_any_admin_role(auth.uid()));

-- Post media policies
CREATE POLICY "Media viewable by all" ON public.post_media FOR SELECT USING (true);
CREATE POLICY "Users add media to own posts" ON public.post_media FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid()));

-- Post likes policies
CREATE POLICY "Likes viewable by all" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Comments viewable by all" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id OR has_any_admin_role(auth.uid()));

-- Post shares policies
CREATE POLICY "Shares viewable by all" ON public.post_shares FOR SELECT USING (true);
CREATE POLICY "Users share posts" ON public.post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Post reports policies
CREATE POLICY "Users create reports" ON public.post_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins view reports" ON public.post_reports FOR SELECT USING (has_any_admin_role(auth.uid()) OR auth.uid() = reporter_id);
CREATE POLICY "Admins update reports" ON public.post_reports FOR UPDATE USING (has_any_admin_role(auth.uid()));

-- ID change history policies
CREATE POLICY "Owner views id history" ON public.id_change_history FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Owner inserts id history" ON public.id_change_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

-- Storage policies for post media
CREATE POLICY "Anyone can view post media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Authenticated users upload post media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users delete own post media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update trigger for posts
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
