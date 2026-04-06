-- Allow moderators to read id-documents for verification review.
-- Moderators are users with a row in moderator_roles table.

CREATE POLICY "Moderators can view all id documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'id-documents'
    AND EXISTS (
      SELECT 1 FROM public.moderator_roles
      WHERE user_id = auth.uid()
    )
  );

-- Also allow moderators to read all verification selfie paths from profiles.
CREATE POLICY "Moderators can view verification status" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.moderator_roles
      WHERE user_id = auth.uid()
    )
  );
