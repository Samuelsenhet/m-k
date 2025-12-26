-- Add privacy visibility columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_age boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_job boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_education boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_last_name boolean NOT NULL DEFAULT false;