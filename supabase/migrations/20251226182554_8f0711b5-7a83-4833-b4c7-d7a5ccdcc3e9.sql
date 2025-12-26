-- Add new profile fields for comprehensive onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pronouns text,
ADD COLUMN IF NOT EXISTS height integer,
ADD COLUMN IF NOT EXISTS sexuality text,
ADD COLUMN IF NOT EXISTS hometown text,
ADD COLUMN IF NOT EXISTS work text,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS politics text,
ADD COLUMN IF NOT EXISTS alcohol text,
ADD COLUMN IF NOT EXISTS smoking text,
ADD COLUMN IF NOT EXISTS profile_completion integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.height IS 'Height in centimeters';
COMMENT ON COLUMN public.profiles.profile_completion IS 'Profile completion percentage 0-100';