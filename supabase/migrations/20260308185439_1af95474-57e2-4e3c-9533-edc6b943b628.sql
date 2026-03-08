
-- Drop existing FKs that point to auth.users
ALTER TABLE public.voice_rooms DROP CONSTRAINT voice_rooms_host_id_fkey;
ALTER TABLE public.room_participants DROP CONSTRAINT room_participants_user_id_fkey;
ALTER TABLE public.room_messages DROP CONSTRAINT room_messages_user_id_fkey;

-- Recreate FKs pointing to profiles.user_id
ALTER TABLE public.voice_rooms
  ADD CONSTRAINT voice_rooms_host_id_fkey
  FOREIGN KEY (host_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.room_participants
  ADD CONSTRAINT room_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.room_messages
  ADD CONSTRAINT room_messages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
