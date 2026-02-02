-- Migration: Create profile_photos table
-- Fixes 404 errors on profile_photos queries

-- Create profile_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_photo_order UNIQUE(user_id, display_order)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_order ON public.profile_photos(user_id, display_order);

-- Enable RLS
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.profile_photos;

-- RLS Policies
CREATE POLICY "Users can view their own photos"
ON public.profile_photos FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own photos"
ON public.profile_photos FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own photos"
ON public.profile_photos FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own photos"
ON public.profile_photos FOR DELETE
USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE public.profile_photos IS 'Stores user profile photos with display order for drag-to-reorder functionality';
