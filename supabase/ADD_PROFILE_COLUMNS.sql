-- =============================================================================
-- Add missing profile columns – Run in Supabase Dashboard → SQL Editor
-- Fixes: PGRST204 "Could not find the 'alcohol' column of 'profiles'"
-- Run this once if you see "Kunde inte spara profilen" after onboarding.
-- Adds all profile columns the app expects (user_id + lifestyle + privacy + etc).
-- =============================================================================

DO $$
BEGIN
  -- Auth key (fixes 400 on profiles when querying by user_id)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
    ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
  END IF;
  -- Lifestyle & preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'alcohol') THEN
    ALTER TABLE public.profiles ADD COLUMN alcohol TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'smoking') THEN
    ALTER TABLE public.profiles ADD COLUMN smoking TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'religion') THEN
    ALTER TABLE public.profiles ADD COLUMN religion TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'politics') THEN
    ALTER TABLE public.profiles ADD COLUMN politics TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pronouns') THEN
    ALTER TABLE public.profiles ADD COLUMN pronouns TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profile_completion') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_completion INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_age') THEN
    ALTER TABLE public.profiles ADD COLUMN show_age BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_job') THEN
    ALTER TABLE public.profiles ADD COLUMN show_job BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_education') THEN
    ALTER TABLE public.profiles ADD COLUMN show_education BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'show_last_name') THEN
    ALTER TABLE public.profiles ADD COLUMN show_last_name BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'interested_in') THEN
    ALTER TABLE public.profiles ADD COLUMN interested_in TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'sexuality') THEN
    ALTER TABLE public.profiles ADD COLUMN sexuality TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'min_age') THEN
    ALTER TABLE public.profiles ADD COLUMN min_age INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'max_age') THEN
    ALTER TABLE public.profiles ADD COLUMN max_age INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'max_distance') THEN
    ALTER TABLE public.profiles ADD COLUMN max_distance INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hometown') THEN
    ALTER TABLE public.profiles ADD COLUMN hometown TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'work') THEN
    ALTER TABLE public.profiles ADD COLUMN work TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'height') THEN
    ALTER TABLE public.profiles ADD COLUMN height INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'education') THEN
    ALTER TABLE public.profiles ADD COLUMN education TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'instagram') THEN
    ALTER TABLE public.profiles ADD COLUMN instagram TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linkedin') THEN
    ALTER TABLE public.profiles ADD COLUMN linkedin TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_verification_status') THEN
    ALTER TABLE public.profiles ADD COLUMN id_verification_status TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_verification_submitted_at') THEN
    ALTER TABLE public.profiles ADD COLUMN id_verification_submitted_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_document_front_path') THEN
    ALTER TABLE public.profiles ADD COLUMN id_document_front_path TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id_document_back_path') THEN
    ALTER TABLE public.profiles ADD COLUMN id_document_back_path TEXT;
  END IF;
END $$;
