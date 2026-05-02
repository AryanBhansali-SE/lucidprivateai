CREATE POLICY oauth_states_deny_all ON public.oauth_states
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);