-- Restore profile-photos to public=true. It was temporarily flipped to
-- private in 20260418130000 as a diagnostic test for the storage-api
-- RLS issue. The actual fix was the edge function proxy; the public
-- flag was not the cause. Public is required for getPublicUrl() to
-- render thumbnails without signed URLs.

UPDATE storage.buckets SET public = true WHERE id = 'profile-photos';
