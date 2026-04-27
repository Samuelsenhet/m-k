-- Reject NULL window_start so pg_advisory_xact_lock is never fed a NULL-derived key.
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

  IF p_window_start IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'count', 0, 'error', 'invalid_window_start');
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
