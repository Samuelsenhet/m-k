-- Add matching preferences columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interested_in text DEFAULT 'all',
ADD COLUMN IF NOT EXISTS min_age integer DEFAULT 18,
ADD COLUMN IF NOT EXISTS max_age integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_distance integer DEFAULT 50;