-- Restrict client updates on icebreaker_analytics to outcome flags only (integrity for analytics).
-- Category immutability is already enforced by trg_icebreaker_analytics_category_immutable.

CREATE OR REPLACE FUNCTION public.icebreaker_analytics_restrict_row_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.match_id IS DISTINCT FROM OLD.match_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.icebreaker_text IS DISTINCT FROM OLD.icebreaker_text
     OR NEW.category IS DISTINCT FROM OLD.category
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'icebreaker_analytics: only was_used, led_to_response, and response_time_seconds may be updated';
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
    DROP TRIGGER IF EXISTS trg_icebreaker_analytics_row_updates ON public.icebreaker_analytics;
    CREATE TRIGGER trg_icebreaker_analytics_row_updates
      BEFORE UPDATE ON public.icebreaker_analytics
      FOR EACH ROW
      EXECUTE FUNCTION public.icebreaker_analytics_restrict_row_updates();
  END IF;
END $icebreaker$;
