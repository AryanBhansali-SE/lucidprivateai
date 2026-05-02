-- Calendar connections (per-user Google tokens)
CREATE TABLE public.calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'google',
  google_email text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY cc_select_own ON public.calendar_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY cc_insert_own ON public.calendar_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY cc_update_own ON public.calendar_connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY cc_delete_own ON public.calendar_connections
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER tg_cc_touch
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Short-lived OAuth state tokens for CSRF protection
CREATE TABLE public.oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'google',
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
-- No user-facing policies; only server (service role) reads/writes.
