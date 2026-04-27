-- =============================================================================
-- FIX FUNCTION SEARCH PATHS - Security hardening
-- Addresses Supabase security warnings about "role mutable search path"
-- =============================================================================

-- 1. Fix update_updated_at_column() - used by multiple triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 2. Fix set_reports_updated_at() - used by reports table trigger
CREATE OR REPLACE FUNCTION public.set_reports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Fix handle_new_user_privacy_settings() - auto-creates privacy settings
CREATE OR REPLACE FUNCTION public.handle_new_user_privacy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Fix handle_new_user_delivery_status() - auto-creates delivery status
CREATE OR REPLACE FUNCTION public.handle_new_user_delivery_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_match_delivery_status (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_reports_updated_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_privacy_settings() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_delivery_status() TO authenticated, service_role;
