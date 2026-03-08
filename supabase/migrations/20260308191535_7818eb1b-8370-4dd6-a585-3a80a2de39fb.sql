
-- Update handle_new_user to assign 'owner' role to the very first registered user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;

  IF user_count = 1 THEN
    -- First user gets owner + all admin roles
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$function$;

-- Prevent banning the owner
CREATE OR REPLACE FUNCTION public.prevent_owner_ban()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'owner') THEN
    RAISE EXCEPTION 'Cannot ban the system owner';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER prevent_owner_ban_trigger
  BEFORE INSERT ON public.bans
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_ban();

-- Prevent deleting owner's roles
CREATE OR REPLACE FUNCTION public.prevent_owner_role_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove the owner role';
  END IF;
  RETURN OLD;
END;
$function$;

CREATE TRIGGER prevent_owner_role_delete_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_role_delete();
