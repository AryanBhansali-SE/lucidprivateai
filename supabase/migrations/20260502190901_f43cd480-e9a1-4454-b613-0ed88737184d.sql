-- ============================================================
-- LUCID schema
-- ============================================================

-- Enums
CREATE TYPE public.habit_tier AS ENUM ('keystone', 'core', 'supporting');
CREATE TYPE public.kr_kind AS ENUM ('numeric', 'checklist');
CREATE TYPE public.goal_status AS ENUM ('active', 'paused', 'achieved', 'archived');
CREATE TYPE public.sentiment AS ENUM ('focused', 'steady', 'drifting', 'depleted', 'energized');

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- habits
-- ============================================================
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier public.habit_tier NOT NULL DEFAULT 'core',
  break_penalty BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX habits_user_idx ON public.habits(user_id) WHERE archived_at IS NULL;

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits_select_own" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habits_insert_own" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_update_own" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habits_delete_own" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER habits_touch BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- habit_logs
-- ============================================================
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, log_date)
);

CREATE INDEX habit_logs_user_date_idx ON public.habit_logs(user_id, log_date DESC);
CREATE INDEX habit_logs_habit_date_idx ON public.habit_logs(habit_id, log_date DESC);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_logs_select_own" ON public.habit_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habit_logs_insert_own" ON public.habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_logs_update_own" ON public.habit_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habit_logs_delete_own" ON public.habit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- goals
-- ============================================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status public.goal_status NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX goals_user_idx ON public.goals(user_id);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select_own" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER goals_touch BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- key_results
-- ============================================================
CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind public.kr_kind NOT NULL DEFAULT 'numeric',
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX key_results_goal_idx ON public.key_results(goal_id);

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursion / multi-table joins in RLS expressions
CREATE OR REPLACE FUNCTION public.user_owns_goal(_goal_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.goals
    WHERE id = _goal_id AND user_id = auth.uid()
  );
$$;

CREATE POLICY "kr_select_own" ON public.key_results
  FOR SELECT USING (public.user_owns_goal(goal_id));
CREATE POLICY "kr_insert_own" ON public.key_results
  FOR INSERT WITH CHECK (public.user_owns_goal(goal_id));
CREATE POLICY "kr_update_own" ON public.key_results
  FOR UPDATE USING (public.user_owns_goal(goal_id));
CREATE POLICY "kr_delete_own" ON public.key_results
  FOR DELETE USING (public.user_owns_goal(goal_id));

CREATE TRIGGER kr_touch BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- key_result_items (checklist)
-- ============================================================
CREATE TABLE public.key_result_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX kri_kr_idx ON public.key_result_items(key_result_id);

ALTER TABLE public.key_result_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_owns_key_result(_kr_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.key_results kr
    JOIN public.goals g ON g.id = kr.goal_id
    WHERE kr.id = _kr_id AND g.user_id = auth.uid()
  );
$$;

CREATE POLICY "kri_select_own" ON public.key_result_items
  FOR SELECT USING (public.user_owns_key_result(key_result_id));
CREATE POLICY "kri_insert_own" ON public.key_result_items
  FOR INSERT WITH CHECK (public.user_owns_key_result(key_result_id));
CREATE POLICY "kri_update_own" ON public.key_result_items
  FOR UPDATE USING (public.user_owns_key_result(key_result_id));
CREATE POLICY "kri_delete_own" ON public.key_result_items
  FOR DELETE USING (public.user_owns_key_result(key_result_id));

-- ============================================================
-- journal_entries
-- ============================================================
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  content_md TEXT NOT NULL DEFAULT '',
  sentiment public.sentiment,
  key_takeaways TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE INDEX journal_user_date_idx ON public.journal_entries(user_id, entry_date DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_select_own" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "journal_insert_own" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_update_own" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "journal_delete_own" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER journal_touch BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
