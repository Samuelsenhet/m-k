-- Fix: Ensure profile-photos bucket supports video MIME types and 50MB limit.
-- Previous migration (20260406110000) was marked as applied before the bucket
-- UPDATE was added. This migration ensures the bucket config is correct.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
    file_size_limit = 52428800  -- 50 MB
WHERE id = 'profile-photos';
