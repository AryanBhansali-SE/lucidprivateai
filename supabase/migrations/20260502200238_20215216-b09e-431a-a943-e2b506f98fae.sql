CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  daily_priority jsonb NOT NULL DEFAULT '{}'::jsonb,
  patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  goal_diagnoses jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_insights_select_own"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_insights_insert_own"
  ON public.ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_insights_update_own"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ai_insights_admin_select_all"
  ON public.ai_insights FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER ai_insights_touch_updated_at
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX ai_insights_user_id_idx ON public.ai_insights(user_id);