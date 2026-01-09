-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles
ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Add index for quick lookup
CREATE INDEX idx_profiles_onboarding_completed ON public.profiles(user_id, onboarding_completed);