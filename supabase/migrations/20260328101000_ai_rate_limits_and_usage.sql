-- Server-side rate limit buckets + AI call audit (no client access).
-- Consumed by Edge Functions via service role + SECURITY DEFINER RPC.

CREATE TABLE IF NOT EXISTS public.ai_rate_limit_buckets (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, window_start)
);

ALTER TABLE public.ai_rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_function_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  function_name text NOT NULL,
  match_id uuid REFERENCES public.matches (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_function_calls ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_function_calls_user_fn_time
  ON public.ai_function_calls (user_id, function_name, created_at DESC);

REVOKE ALL ON TABLE public.ai_rate_limit_buckets FROM PUBLIC;
REVOKE ALL ON TABLE public.ai_rate_limit_buckets FROM anon;
REVOKE ALL ON TABLE public.ai_rate_limit_buckets FROM authenticated;

REVOKE ALL ON TABLE public.ai_function_calls FROM PUBLIC;
REVOKE ALL ON TABLE public.ai_function_calls FROM anon;
REVOKE ALL ON TABLE public.ai_function_calls FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_rate_limit_buckets TO service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.ai_function_calls TO service_role;

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

REVOKE ALL ON FUNCTION public.try_consume_rate_limit(text, timestamptz, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_consume_rate_limit(text, timestamptz, int) TO service_role;
