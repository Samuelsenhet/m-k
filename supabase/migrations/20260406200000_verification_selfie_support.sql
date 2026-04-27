-- Add selfie verification support to profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selfie_path TEXT;

-- Ensure id_verification_status supports all states.
-- Existing values: 'approved', 'rejected' (from webhook).
-- New: 'none' (default), 'pending' (submitted, awaiting review).
DO $$
BEGIN
  -- Drop old CHECK if exists, add new one with all states
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_verification_status_check;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_verification_status_check
    CHECK (id_verification_status IS NULL OR id_verification_status IN ('none', 'pending', 'approved', 'rejected'));
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if constraint doesn't exist
END $$;
