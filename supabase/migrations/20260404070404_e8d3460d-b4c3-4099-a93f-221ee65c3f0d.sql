CREATE POLICY "Privileged users create agencies"
ON public.agencies
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  OR public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
);

DROP POLICY IF EXISTS "Authenticated insert coin transactions" ON public.coin_transactions;
CREATE POLICY "Privileged users insert coin transactions"
ON public.coin_transactions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'coins_seller'::public.app_role)
);

DROP POLICY IF EXISTS "Hosts update own record" ON public.hosts;
CREATE POLICY "Hosts and agency owners update hosts"
ON public.hosts
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_any_admin_role(auth.uid())
  OR (
    public.has_role(auth.uid(), 'agency_owner'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.agencies a
      WHERE a.id = hosts.agency_id
        AND a.owner_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR public.has_any_admin_role(auth.uid())
  OR (
    public.has_role(auth.uid(), 'agency_owner'::public.app_role)
    AND (
      agency_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.agencies a
        WHERE a.id = agency_id
          AND a.owner_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Admins and agency owners create hosts"
ON public.hosts
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.has_any_admin_role(auth.uid())
  OR (
    public.has_role(auth.uid(), 'agency_owner'::public.app_role)
    AND agency_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.agencies a
      WHERE a.id = agency_id
        AND a.owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Privileged users insert roles"
ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "Privileged users update roles"
ON public.user_roles
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "Privileged users delete roles"
ON public.user_roles
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins manage gifts" ON public.gifts;
CREATE POLICY "Admins insert gifts"
ON public.gifts
FOR INSERT TO authenticated
WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins update gifts"
ON public.gifts
FOR UPDATE TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins delete gifts"
ON public.gifts
FOR DELETE TO authenticated
USING (public.has_any_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admins manage props" ON public.props;
CREATE POLICY "Privileged users insert props"
ON public.props
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "Privileged users update props"
ON public.props
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "Privileged users delete props"
ON public.props
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Privileged users insert events"
ON public.events
FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
);
CREATE POLICY "Privileged users update events"
ON public.events
FOR UPDATE TO authenticated
USING (
  public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
)
WITH CHECK (
  public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
);
CREATE POLICY "Privileged users delete events"
ON public.events
FOR DELETE TO authenticated
USING (
  public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
);

DROP POLICY IF EXISTS "Admins manage competitions" ON public.competitions;
CREATE POLICY "Privileged users insert competitions"
ON public.competitions
FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
);
CREATE POLICY "Privileged users update competitions"
ON public.competitions
FOR UPDATE TO authenticated
USING (
  public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
)
WITH CHECK (
  public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
);
CREATE POLICY "Privileged users delete competitions"
ON public.competitions
FOR DELETE TO authenticated
USING (
  public.has_any_admin_role(auth.uid())
  OR public.has_role(auth.uid(), 'business_dev'::public.app_role)
);

DROP POLICY IF EXISTS "Owner manages settings" ON public.system_settings;
CREATE POLICY "Privileged users insert settings"
ON public.system_settings
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "Privileged users update settings"
ON public.system_settings
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);
CREATE POLICY "Privileged users delete settings"
ON public.system_settings
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);