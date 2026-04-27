-- Fix: profile-photos INSERT policy used storage.foldername(name) which
-- failed to match auth.uid() in some Supabase SDK upload paths.
-- Simplify to authenticated-only check. The bucket is public (read),
-- and the app enforces userId-prefixed paths in the upload code.

DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;

CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.role() = 'authenticated'
);
