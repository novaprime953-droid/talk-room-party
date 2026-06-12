
-- Policy category enum
CREATE TYPE public.policy_category AS ENUM (
  'agency','host','admin','bd','super_admin','salary','commission','withdrawal'
);

-- Policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.policy_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX policies_category_idx ON public.policies(category, sort_order);
CREATE INDEX policies_active_idx ON public.policies(is_active);

GRANT SELECT ON public.policies TO authenticated;
GRANT ALL ON public.policies TO service_role;

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active policies
CREATE POLICY "Authenticated can view active policies"
  ON public.policies FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'owner'));

-- Only owner can manage
CREATE POLICY "Owner can insert policies"
  ON public.policies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update policies"
  ON public.policies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can delete policies"
  ON public.policies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- updated_at trigger
CREATE TRIGGER policies_set_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage RLS for "policies" bucket
CREATE POLICY "Authenticated can view policy images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'policies');

CREATE POLICY "Owner can upload policy images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'policies' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can update policy images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'policies' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner can delete policy images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'policies' AND public.has_role(auth.uid(), 'owner'));
