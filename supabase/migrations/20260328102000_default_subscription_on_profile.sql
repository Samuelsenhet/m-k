-- Ensure every profile has a subscriptions row (server-owned; clients only SELECT).
CREATE OR REPLACE FUNCTION public.ensure_subscription_row_for_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status, started_at, updated_at)
  VALUES (NEW.id, 'free', 'active', now(), now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_ensure_subscription ON public.profiles;
CREATE TRIGGER trg_profiles_ensure_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_subscription_row_for_profile();

-- Backfill existing profiles missing a subscription row (idempotent).
INSERT INTO public.subscriptions (user_id, plan_type, status, started_at, updated_at)
SELECT p.id, 'free', 'active', now(), now()
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;
