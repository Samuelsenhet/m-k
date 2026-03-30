-- Vibe Security / Supabase advisor follow-up:
-- 1) Remove legacy permissive app_logs INSERT (WITH CHECK true) that ORs with stricter policy.
-- 2) AI usage tables: RLS with zero policies triggers linter; tables are REVOKEd from anon/authenticated — disable RLS, enforce via GRANTs + Edge service_role only.
-- 3) Mutable search_path on trigger functions — pin to public.
-- Version aligned with production migration history (incl. MCP apply name vibe_security_linter_fixes).

-- -----------------------------------------------------------------------------
-- app_logs: drop permissive INSERT + redundant service_role SELECT policy
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.app_logs;
DROP POLICY IF EXISTS "Service role can read all logs" ON public.app_logs;

-- Ensure hardened policies exist (idempotent if 20260328104000 already ran)
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

COMMENT ON TABLE public.app_logs IS 'Client logs: INSERT only own user_id (RLS). No permissive WITH CHECK(true).';

-- -----------------------------------------------------------------------------
-- AI rate / usage: not exposed to PostgREST clients (REVOKE on anon/authenticated)
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.ai_rate_limit_buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_function_calls DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ai_rate_limit_buckets IS 'Edge/service_role only. RLS disabled; access controlled via GRANT + no client role privileges.';
COMMENT ON TABLE public.ai_function_calls IS 'Edge/service_role only. RLS disabled; access controlled via GRANT + no client role privileges.';

-- -----------------------------------------------------------------------------
-- Trigger functions: fixed search_path (advisor function_search_path_mutable)
-- -----------------------------------------------------------------------------
ALTER FUNCTION public.prevent_read_by_tamper() SET search_path = public;
ALTER FUNCTION public.set_groups_updated_at() SET search_path = public;
ALTER FUNCTION public.set_email_templates_updated_at() SET search_path = public;
ALTER FUNCTION public.set_appeals_updated_at() SET search_path = public;
ALTER FUNCTION public.set_bulk_emails_updated_at() SET search_path = public;
