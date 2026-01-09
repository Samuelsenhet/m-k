-- Create user_roles enum and table for admin controls
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Daily match batches table for admin-controlled batch sizes
CREATE TABLE public.daily_match_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  batch_size INTEGER NOT NULL DEFAULT 5 CHECK (batch_size >= 1 AND batch_size <= 50),
  special_event TEXT,
  special_event_message TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.daily_match_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view batches"
ON public.daily_match_batches FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage batches"
ON public.daily_match_batches FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- User match deliveries tracking
CREATE TABLE public.user_match_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  batch_id UUID REFERENCES public.daily_match_batches(id),
  matches_delivered INTEGER NOT NULL DEFAULT 0,
  last_matched_profile_ids UUID[] DEFAULT ARRAY[]::UUID[],
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.user_match_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deliveries"
ON public.user_match_deliveries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deliveries"
ON public.user_match_deliveries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deliveries"
ON public.user_match_deliveries FOR UPDATE
USING (auth.uid() = user_id);

-- User subscriptions for Plus tier
CREATE TABLE public.user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_plus BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'premium')),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- User journey state tracking
CREATE TABLE public.user_journey_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_completed_at TIMESTAMPTZ DEFAULT NOW(),
  first_matches_delivered_at TIMESTAMPTZ,
  journey_phase TEXT DEFAULT 'ONBOARDING' CHECK (journey_phase IN ('ONBOARDING', 'WAITING', 'READY', 'ACTIVE')),
  total_matches_received INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_journey_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journey state"
ON public.user_journey_state FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey state"
ON public.user_journey_state FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey state"
ON public.user_journey_state FOR UPDATE
USING (auth.uid() = user_id);

-- Add columns to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS is_first_day_match BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS special_effects JSONB,
ADD COLUMN IF NOT EXISTS composite_score NUMERIC DEFAULT 0;

-- Security definer function to check if user can view profile for matching
CREATE OR REPLACE FUNCTION public.can_view_profile_for_matching(_viewer_id UUID, _profile_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _viewer_id = _profile_user_id  -- Own profile
    OR (
      _viewer_id IS NOT NULL  -- Must be authenticated
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = _profile_user_id 
        AND onboarding_completed = true
      )
    )
$$;

-- Update profiles RLS to allow controlled visibility for matching
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles for matching"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id  -- Full access to own profile
  OR (
    auth.uid() IS NOT NULL  -- Must be authenticated
    AND onboarding_completed = true  -- Only completed profiles visible to others
  )
);

-- Create view for safe match candidate data (excludes sensitive fields)
CREATE OR REPLACE VIEW public.match_candidate_profiles AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  bio,
  date_of_birth,
  gender,
  looking_for,
  hometown,
  height,
  work,
  education,
  onboarding_completed,
  show_age,
  show_job,
  show_education,
  min_age,
  max_age,
  max_distance,
  interested_in,
  created_at
FROM public.profiles
WHERE onboarding_completed = true;

-- Create trigger to auto-create journey state on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_journey()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_journey_state (user_id, registration_completed_at)
  VALUES (NEW.user_id, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_journey
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_journey();

-- Create trigger to auto-create subscription on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, is_plus, subscription_tier)
  VALUES (NEW.user_id, FALSE, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_subscription();