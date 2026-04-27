-- Add video support to profile_photos.
-- media_type: 'image' (default, backwards-compatible) or 'video' (short clips ≤30s).

ALTER TABLE public.profile_photos
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
  CHECK (media_type IN ('image', 'video'));

-- Update storage bucket to accept video MIME types + increase size limit.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
    file_size_limit = 52428800  -- 50 MB
WHERE id = 'profile-photos';
