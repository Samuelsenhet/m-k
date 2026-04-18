-- Fix (take 4): match the exact WITH CHECK shape used by id-documents
-- bucket (which uploaded successfully 2026-04-14), wrapping auth.uid()
-- in a SELECT subquery. Supabase's recommended pattern; some storage-api
-- code paths appear to require the subselect form to cache/evaluate
-- the claim correctly.

DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;

CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = ((SELECT auth.uid()))::text
  );
