-- =============================================================================
-- IAP SECURITY HARDENING
-- 1. Ensure subscriptions table is read-only for clients (defense-in-depth)
-- 2. Gate group creation behind active subscription
-- 3. Gate group message INSERT behind active subscription
-- 4. Create webhook_events audit table for deduplication & forensics
-- 5. Add rate-limit bucket for webhook endpoint
-- =============================================================================

-- =============================================================================
-- 1. SUBSCRIPTIONS: Bulletproof read-only for clients
--    Even though migration 20260328100000 dropped INSERT/UPDATE policies,
--    re-drop as a safety net. Also add an explicit DENY via a BEFORE trigger
--    that blocks non-service-role writes.
-- =============================================================================

-- Drop any leftover INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscription" ON public.subscriptions;

-- Ensure the SELECT-only policy exists
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Trigger: reject any INSERT/UPDATE from non-service-role callers.
-- This is a hard backstop even if someone re-introduces an RLS policy.
CREATE OR REPLACE FUNCTION public.subscriptions_service_role_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- current_setting('role') = 'service_role' when called via the service role key.
  -- The RPC request.jwt.claim.role also works but role is simpler.
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'subscriptions can only be modified by the server';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_service_role_only ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_service_role_only
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.subscriptions_service_role_only();

-- Also block DELETE from non-service-role
CREATE OR REPLACE FUNCTION public.subscriptions_service_role_delete_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'subscriptions can only be deleted by the server';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_service_role_delete_only ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_service_role_delete_only
  BEFORE DELETE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.subscriptions_service_role_delete_only();

-- =============================================================================
-- 2. GROUPS: Gate creation behind active paid subscription
--    Replace the open "Authenticated users can create groups" policy with
--    one that requires an active subscription (basic/plus/premium/vip).
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Paid users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = (SELECT auth.uid())
        AND s.status = 'active'
        AND s.plan_type IN ('basic', 'plus', 'premium', 'vip')
        AND (s.expires_at IS NULL OR s.expires_at > now())
    )
  );

-- =============================================================================
-- 3. GROUP MESSAGES: Gate sending behind active paid subscription
--    Free users who are already members (legacy or invited) should not be able
--    to send messages. Read-only access is kept.
-- =============================================================================

DROP POLICY IF EXISTS "Group members can insert group_messages" ON public.group_messages;
CREATE POLICY "Paid group members can insert group_messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_messages.group_id AND user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = (SELECT auth.uid())
        AND s.status = 'active'
        AND s.plan_type IN ('basic', 'plus', 'premium', 'vip')
        AND (s.expires_at IS NULL OR s.expires_at > now())
    )
  );

-- =============================================================================
-- 4. WEBHOOK_EVENTS: Audit log & deduplication table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'skipped', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique constraint on event_id for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON public.webhook_events(user_id);
-- Cleanup of old events
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- No client access at all — only service role
-- (RLS is enabled with no policies = deny all for anon/authenticated)

-- =============================================================================
-- 5. WEBHOOK RATE LIMIT: reuse existing ai_rate_limit_buckets with a
--    'webhook:' key prefix. The try_consume_rate_limit RPC already exists.
-- =============================================================================
-- No new table needed — the webhook will call try_consume_rate_limit
-- with key = 'webhook:revenuecat' and a 60-second window.

