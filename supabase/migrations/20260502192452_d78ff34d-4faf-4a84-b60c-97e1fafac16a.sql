-- Enable full row payloads for realtime
ALTER TABLE public.habit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.habits REPLICA IDENTITY FULL;
ALTER TABLE public.goals REPLICA IDENTITY FULL;
ALTER TABLE public.key_results REPLICA IDENTITY FULL;
ALTER TABLE public.journal_entries REPLICA IDENTITY FULL;

-- Add to realtime publication (idempotent guards)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='habit_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='habits') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='goals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='key_results') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.key_results;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='journal_entries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
  END IF;
END $$;