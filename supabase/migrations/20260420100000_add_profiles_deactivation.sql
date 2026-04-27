-- Deactivation state for profiles.
-- Replaces the previous "delete account" flow with a soft-pause model.
-- An account is active while deactivated_at IS NULL. When a user chooses to
-- deactivate, we set deactivated_at = now() and remember the visibility
-- preference they picked. A daily cron (see 20260420110000_*.sql) hard-deletes
-- any row whose deactivated_at is older than 90 days. Logging back in clears
-- deactivated_at automatically (handled client-side in SupabaseProvider).

alter table public.profiles
  add column if not exists deactivated_at timestamptz,
  add column if not exists deactivation_hidden boolean not null default true;

create index if not exists idx_profiles_deactivated_at
  on public.profiles (deactivated_at)
  where deactivated_at is not null;

comment on column public.profiles.deactivated_at is
  'When not null, the account is deactivated. The 90-day purge cron hard-deletes rows where deactivated_at < now() - interval ''90 days''. Login auto-clears this column.';

comment on column public.profiles.deactivation_hidden is
  'Only meaningful when deactivated_at is not null. true = profile and existing chats hidden from other users during deactivation. false = profile still appears in discovery; owner is simply non-responsive until reactivation.';
