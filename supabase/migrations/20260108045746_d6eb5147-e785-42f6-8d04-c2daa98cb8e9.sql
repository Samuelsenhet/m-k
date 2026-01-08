-- Drop the security definer view and recreate as regular view
-- The underlying profiles table already has RLS, so the view inherits that security
DROP VIEW IF EXISTS public.match_candidate_profiles;

-- Recreate as a regular view (not security definer)
-- This view will respect the RLS policies on the profiles table
CREATE VIEW public.match_candidate_profiles AS
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
  CASE WHEN show_job THEN work ELSE NULL END as work,
  CASE WHEN show_education THEN education ELSE NULL END as education,
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