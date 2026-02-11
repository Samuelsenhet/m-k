-- Create app_logs table for client-side remote logging
CREATE TABLE IF NOT EXISTS public.app_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level       text NOT NULL CHECK (level IN ('DEBUG','INFO','WARN','ERROR')),
  message     text NOT NULL,
  data        jsonb,
  url         text,
  user_agent  text,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_logs IS 'Client-side application logs sent from the frontend logger utility.';

-- Index on level for filtering errors quickly
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON public.app_logs(level);

-- Index on created_at for time-range queries
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON public.app_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert logs (their own)
CREATE POLICY "Authenticated users can insert logs"
  ON public.app_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only service_role (admin/backend) can read logs
CREATE POLICY "Service role can read all logs"
  ON public.app_logs
  FOR SELECT
  TO service_role
  USING (true);

-- Auto-delete logs older than 30 days (optional: run via pg_cron)
-- SELECT cron.schedule('cleanup-app-logs', '0 3 * * *', $$DELETE FROM public.app_logs WHERE created_at < now() - interval '30 days'$$);
