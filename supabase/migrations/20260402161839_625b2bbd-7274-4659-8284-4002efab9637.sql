
DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;

CREATE POLICY "Admins select banners" ON public.banners
  FOR SELECT USING (true);

CREATE POLICY "Admins insert banners" ON public.banners
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins update banners" ON public.banners
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins delete banners" ON public.banners
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
