-- Fix: storage-api does not propagate JWT claims into request.jwt.claims
-- for this project, so auth.role() / auth.uid() return NULL in storage
-- context. The previous relaxed policy checked auth.role()='authenticated'
-- which always evaluated to NULL → RLS rejection.
--
-- The PG role is correctly set to 'authenticated' by storage-api, so we
-- restrict the policy to that role directly via TO authenticated. User-id
-- prefix is still enforced client-side in the upload path.

DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;

CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');
