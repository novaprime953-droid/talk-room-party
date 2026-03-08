
-- Fix hosts FK to point to profiles
ALTER TABLE public.hosts DROP CONSTRAINT hosts_user_id_fkey;
ALTER TABLE public.hosts
  ADD CONSTRAINT hosts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
