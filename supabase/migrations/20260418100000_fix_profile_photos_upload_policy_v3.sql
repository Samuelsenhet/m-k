-- Fix (take 3): restore original INSERT policy pattern from
-- 20260127100300_fix_storage_policies.sql.
-- Superseded by v4 (20260418110000) which uses the (SELECT auth.uid())
-- subselect pattern that id-documents uses.

DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;

CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
