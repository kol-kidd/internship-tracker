-- Ensure Supabase Realtime emits profile and group membership changes used by
-- the profile page and leaderboards. Safe to run when the publication already
-- contains these tables.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'profiles'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'group_members'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
    END IF;
  END IF;
END $$;
