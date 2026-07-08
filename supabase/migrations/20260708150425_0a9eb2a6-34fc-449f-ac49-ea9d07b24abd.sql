
-- Allow SECURITY DEFINER RPCs (which run as the function owner, typically 'postgres')
-- to bypass the field-protection triggers. Direct writes by authenticated clients
-- still hit the guard because current_user for them is 'authenticated'.

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user = 'postgres'
     OR current_user = 'supabase_admin'
     OR current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.coins_balance IS DISTINCT FROM OLD.coins_balance
     OR NEW.vip_level    IS DISTINCT FROM OLD.vip_level
     OR NEW.vip_xp       IS DISTINCT FROM OLD.vip_xp
     OR NEW.vip_start    IS DISTINCT FROM OLD.vip_start
     OR NEW.vip_end      IS DISTINCT FROM OLD.vip_end
     OR NEW.xp           IS DISTINCT FROM OLD.xp
     OR NEW.level        IS DISTINCT FROM OLD.level
     OR NEW.user_id_number IS DISTINCT FROM OLD.user_id_number
     OR NEW.user_id      IS DISTINCT FROM OLD.user_id
     OR NEW.email        IS DISTINCT FROM OLD.email
  THEN
    RAISE EXCEPTION 'Field cannot be modified directly. Use the appropriate RPC.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_host_earnings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user = 'postgres'
     OR current_user = 'supabase_admin'
     OR current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.total_earnings IS DISTINCT FROM OLD.total_earnings
     OR NEW.monthly_earnings IS DISTINCT FROM OLD.monthly_earnings THEN
    RAISE EXCEPTION 'Earnings fields cannot be modified directly. Use the appropriate RPC.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix the family_members self-privilege-escalation finding: restrict role on insert.
DROP POLICY IF EXISTS "Users join families" ON public.family_members;
CREATE POLICY "Users join families"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'member');
