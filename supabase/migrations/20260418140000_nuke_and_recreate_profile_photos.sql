-- Recreate profile-photos bucket after manual dashboard deletion.
-- The bucket was dropped via the Supabase Storage API (dashboard) to clear
-- any corrupted/cached bucket metadata that caused RLS-400 rejections on
-- inserts despite identical policies to id-documents working fine.
--
-- Idempotent: if the bucket still exists for any reason, ON CONFLICT skips.

-- Ensure policies referencing profile-photos are gone before recreating
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own photos (direct)" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Create the bucket fresh
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  52428800,  -- 50 MB for video support
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies mirror the proven id-documents INSERT pattern exactly
CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = ((SELECT auth.uid()))::text
  );

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = ((SELECT auth.uid()))::text
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = ((SELECT auth.uid()))::text
  );

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = ((SELECT auth.uid()))::text
  );
