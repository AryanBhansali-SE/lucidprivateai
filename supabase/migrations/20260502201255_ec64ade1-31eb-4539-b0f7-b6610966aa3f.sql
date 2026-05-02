ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS intro_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tutorial_dismissed jsonb NOT NULL DEFAULT '[]'::jsonb;