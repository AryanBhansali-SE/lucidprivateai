-- 1. Roles enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role security definer (no recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 4. RLS on user_roles
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
CREATE POLICY "user_roles_admin_insert"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
CREATE POLICY "user_roles_admin_update"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
CREATE POLICY "user_roles_admin_delete"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. Admin read-all policies on data tables
DROP POLICY IF EXISTS "habits_admin_select_all" ON public.habits;
CREATE POLICY "habits_admin_select_all"
ON public.habits FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "habit_logs_admin_select_all" ON public.habit_logs;
CREATE POLICY "habit_logs_admin_select_all"
ON public.habit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "goals_admin_select_all" ON public.goals;
CREATE POLICY "goals_admin_select_all"
ON public.goals FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "key_results_admin_select_all" ON public.key_results;
CREATE POLICY "key_results_admin_select_all"
ON public.key_results FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "journal_admin_select_all" ON public.journal_entries;
CREATE POLICY "journal_admin_select_all"
ON public.journal_entries FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));