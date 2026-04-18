-- Diagnostic: id-documents (public=false) uploads succeed, profile-photos
-- (public=true) uploads fail with identical RLS policy. Test whether the
-- public flag is the relevant differentiator by flipping it temporarily.
-- Public URL reads via getPublicUrl() for existing objects will still work
-- because the storage-api only gates SELECT on public readability — not
-- INSERT. If uploads succeed after this, we know public=true triggered
-- the broken code path in this project's storage-api.

UPDATE storage.buckets SET public = false WHERE id = 'profile-photos';
