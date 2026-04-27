-- Harden app_logs RLS: ensure INSERT only for own user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'app_logs'
  ) THEN
    ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "app_logs_insert_own" ON public.app_logs;
    CREATE POLICY "app_logs_insert_own" ON public.app_logs
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "app_logs_select_own" ON public.app_logs;
    CREATE POLICY "app_logs_select_own" ON public.app_logs
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "app_logs_no_update" ON public.app_logs;
    CREATE POLICY "app_logs_no_update" ON public.app_logs
      FOR UPDATE TO authenticated
      USING (false);

    DROP POLICY IF EXISTS "app_logs_no_delete" ON public.app_logs;
    CREATE POLICY "app_logs_no_delete" ON public.app_logs
      FOR DELETE TO authenticated
      USING (false);
  END IF;
END $$;
