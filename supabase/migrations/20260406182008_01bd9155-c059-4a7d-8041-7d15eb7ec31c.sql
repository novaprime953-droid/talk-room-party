
-- Fix notifications type check
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type = ANY (ARRAY[
    'info', 'gift', 'system', 'moderation', 'earnings', 'promotion',
    'level_up', 'vip', 'follow', 'family', 'task', 'welcome', 'room',
    'achievement', 'coin', 'social', 'event', 'competition'
  ]));

-- Add custom room background
ALTER TABLE public.voice_rooms ADD COLUMN IF NOT EXISTS background_url text;
