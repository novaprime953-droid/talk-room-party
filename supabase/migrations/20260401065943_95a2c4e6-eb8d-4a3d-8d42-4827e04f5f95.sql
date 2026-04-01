
-- Banners table for home page banner slider
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners viewable by all" ON public.banners FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO public USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Add user_id_number to profiles for numeric ID system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id_number BIGINT UNIQUE;

-- Auto-generate numeric IDs for new profiles
CREATE OR REPLACE FUNCTION public.generate_user_id_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  IF NEW.user_id_number IS NULL THEN
    LOOP
      v_id := floor(random() * 90000000 + 10000000)::BIGINT;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id_number = v_id);
    END LOOP;
    NEW.user_id_number := v_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_user_id_number
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_user_id_number();

-- Backfill existing profiles with numeric IDs
DO $$
DECLARE
  r RECORD;
  v_id BIGINT;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE user_id_number IS NULL LOOP
    LOOP
      v_id := floor(random() * 90000000 + 10000000)::BIGINT;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id_number = v_id);
    END LOOP;
    UPDATE public.profiles SET user_id_number = v_id WHERE id = r.id;
  END LOOP;
END;
$$;
