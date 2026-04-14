-- id-documents bucket: selfies + ID documents for verification.
-- Bucket was previously created manually in the Dashboard; this migration
-- makes it reproducible and adds the missing INSERT/UPDATE/SELECT RLS so
-- authenticated users can upload their own selfie. Moderator SELECT policy
-- is already in place from 20260406210000_moderator_id_documents_access.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'id-documents',
  'id-documents',
  false,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png'];

-- Authenticated users can upload to their own folder: {user_id}/{filename}.jpg
drop policy if exists "Users can upload own id-documents" on storage.objects;
create policy "Users can upload own id-documents"
  on storage.objects for insert
  with check (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Authenticated users can upsert (x-upsert: true) their own file during retake.
drop policy if exists "Users can update own id-documents" on storage.objects;
create policy "Users can update own id-documents"
  on storage.objects for update
  using (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Authenticated users can read their own selfie.
drop policy if exists "Users can read own id-documents" on storage.objects;
create policy "Users can read own id-documents"
  on storage.objects for select
  using (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

comment on policy "Users can upload own id-documents" on storage.objects is
  'Verifiering: användare får bara skriva selfies till {user_id}/*.';
