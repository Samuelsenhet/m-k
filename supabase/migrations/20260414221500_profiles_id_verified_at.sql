-- Add profiles.id_verified_at — timestamp of when the user's identity
-- verification was approved. Referenced by supabase/functions/initiate-verification/
-- (auto-approve path) but never added as an actual column, which caused every
-- verification upload to fail with "Failed to update profile" (500) in prod.
-- Nullable: stays NULL while status is 'none' or 'pending'; set on 'approved'.

alter table public.profiles
  add column if not exists id_verified_at timestamptz;

comment on column public.profiles.id_verified_at is
  'Timestamp when identity verification was approved (auto or via webhook). Null until status flips to approved.';
