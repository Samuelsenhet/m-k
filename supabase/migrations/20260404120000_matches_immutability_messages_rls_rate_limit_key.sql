-- Immutability: participants on matches cannot be reassigned via UPDATE.
CREATE OR REPLACE FUNCTION public.prevent_match_participant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.matched_user_id IS DISTINCT FROM OLD.matched_user_id THEN
    RAISE EXCEPTION 'match participant ids cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matches_prevent_participant_change ON public.matches;
CREATE TRIGGER trg_matches_prevent_participant_change
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_match_participant_change();

-- Messages UPDATE: sender must be in the match (USING + WITH CHECK so match_id cannot be moved out).
DROP POLICY IF EXISTS "Users can update messages in their matches" ON public.messages;
CREATE POLICY "Users can update messages in their matches"
  ON public.messages FOR UPDATE
  USING (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
        AND (m.user_id = (SELECT auth.uid()) OR m.matched_user_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user_id = (SELECT auth.uid()) OR m.matched_user_id = (SELECT auth.uid()))
    )
  );

-- Rate limit RPC: reject NULL/empty keys (avoids advisory lock / hashtext no-ops).
CREATE OR REPLACE FUNCTION public.try_consume_rate_limit(
  p_key text,
  p_window_start timestamptz,
  p_max int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF p_key IS NULL OR btrim(p_key) = '' THEN
    RETURN jsonb_build_object('allowed', false, 'count', 0, 'error', 'invalid_key');
  END IF;

  IF p_max IS NULL OR p_max < 1 THEN
    RETURN jsonb_build_object('allowed', true, 'count', 0, 'skipped', true);
  END IF;

  PERFORM pg_advisory_xact_lock(
    (hashtext(p_key || '|' || p_window_start::text))::bigint
  );

  SELECT b.count INTO v_count
  FROM public.ai_rate_limit_buckets b
  WHERE b.key = p_key AND b.window_start = p_window_start;

  IF v_count IS NULL THEN
    INSERT INTO public.ai_rate_limit_buckets (key, window_start, count)
    VALUES (p_key, p_window_start, 1);
    RETURN jsonb_build_object('allowed', true, 'count', 1);
  END IF;

  IF v_count >= p_max THEN
    RETURN jsonb_build_object('allowed', false, 'count', v_count);
  END IF;

  UPDATE public.ai_rate_limit_buckets
  SET count = count + 1, updated_at = now()
  WHERE key = p_key AND window_start = p_window_start
  RETURNING count INTO v_count;

  RETURN jsonb_build_object('allowed', true, 'count', v_count);
END;
$$;
