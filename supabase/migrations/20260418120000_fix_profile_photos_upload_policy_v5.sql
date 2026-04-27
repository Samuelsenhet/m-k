-- Fix (take 5): id-documents has TWO permissive INSERT policies (one
-- using auth.uid() direct, one using (SELECT auth.uid())) and uploads
-- there succeed. Profile-photos has only one and fails. Permissive
-- policies OR, so adding both variants gives the same coverage.

DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own photos (direct)" ON storage.objects;

CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = ((SELECT auth.uid()))::text
  );

CREATE POLICY "Users can upload own photos (direct)"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
