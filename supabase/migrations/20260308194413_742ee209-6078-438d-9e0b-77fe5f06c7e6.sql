
-- Create storage bucket for gift assets (icons and animations)
INSERT INTO storage.buckets (id, name, public) VALUES ('gift-assets', 'gift-assets', true);

-- Allow anyone to view gift assets (public bucket)
CREATE POLICY "Gift assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gift-assets');

-- Allow admins to upload gift assets
CREATE POLICY "Admins can upload gift assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gift-assets' AND
  public.has_any_admin_role(auth.uid())
);

-- Allow admins to update gift assets
CREATE POLICY "Admins can update gift assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gift-assets' AND
  public.has_any_admin_role(auth.uid())
);

-- Allow admins to delete gift assets
CREATE POLICY "Admins can delete gift assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gift-assets' AND
  public.has_any_admin_role(auth.uid())
);
