-- Fix: the BEFORE INSERT trigger on subscriptions blocks writes from
-- the SECURITY DEFINER profile trigger (ensure_subscription_row_for_profile).
--
-- SECURITY DEFINER changes current_user to 'postgres' but does NOT change
-- the PostgREST session variable request.jwt.claim.role, so the guard
-- sees 'authenticated' and raises an exception.
--
-- Fix: also allow writes when current_user is 'postgres' (SECURITY DEFINER
-- context from trusted server-side triggers).

CREATE OR REPLACE FUNCTION public.subscriptions_service_role_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND current_user IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'subscriptions can only be modified by the server';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.subscriptions_service_role_delete_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND current_user IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'subscriptions can only be deleted by the server';
  END IF;
  RETURN OLD;
END;
$$;
