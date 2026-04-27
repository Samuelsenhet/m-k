-- Security remediation: restore messages/matches RLS, profiles match visibility,
-- revoke client writes on subscriptions, prevent icebreaker_analytics category tampering.

-- =============================================================================
-- MATCHES: SELECT for both participants; UPDATE for both participants
-- =============================================================================
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
CREATE POLICY "Users can view their own matches"
  ON public.matches FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR matched_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own matches" ON public.matches;
CREATE POLICY "Users can update their own matches"
  ON public.matches FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR matched_user_id = (SELECT auth.uid()));

-- =============================================================================
-- MESSAGES: participant-based SELECT/INSERT; sender UPDATE; DELETE unchanged
-- =============================================================================
DROP POLICY IF EXISTS "Users can view messages from their matches" ON public.messages;
CREATE POLICY "Users can view messages from their matches"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (m.user_id = (SELECT auth.uid()) OR m.matched_user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to their matches" ON public.messages;
CREATE POLICY "Users can insert messages to their matches"
  ON public.messages FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user_id = (SELECT auth.uid()) OR m.matched_user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update messages in their matches" ON public.messages;
CREATE POLICY "Users can update messages in their matches"
  ON public.messages FOR UPDATE
  USING ((SELECT auth.uid()) = sender_id);

-- =============================================================================
-- PROFILES: own row or match partner (dating UX)
-- =============================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or matches" ON public.profiles;
CREATE POLICY "Users can view their own profile or matches"
  ON public.profiles FOR SELECT
  USING (
    id = (SELECT auth.uid())
    OR id IN (
      SELECT matched_user_id FROM public.matches WHERE user_id = (SELECT auth.uid())
      UNION
      SELECT user_id FROM public.matches WHERE matched_user_id = (SELECT auth.uid())
    )
  );

-- =============================================================================
-- SUBSCRIPTIONS: read-only for authenticated (server / service role writes)
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- =============================================================================
-- ICEBREAKER_ANALYTICS: block category changes (rate-limit / analytics integrity)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.icebreaker_analytics_prevent_category_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.category IS DISTINCT FROM OLD.category THEN
    RAISE EXCEPTION 'category cannot be changed on icebreaker_analytics';
  END IF;
  RETURN NEW;
END;
$$;

DO $icebreaker$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'icebreaker_analytics'
  ) THEN
    DROP TRIGGER IF EXISTS trg_icebreaker_analytics_category_immutable ON public.icebreaker_analytics;
    CREATE TRIGGER trg_icebreaker_analytics_category_immutable
      BEFORE UPDATE ON public.icebreaker_analytics
      FOR EACH ROW
      EXECUTE FUNCTION public.icebreaker_analytics_prevent_category_change();
  END IF;
END $icebreaker$;
