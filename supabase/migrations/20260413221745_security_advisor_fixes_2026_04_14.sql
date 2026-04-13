-- Security fixes from Supabase advisors 2026-04-14.
-- Covers all actionable lints except auth_leaked_password_protection
-- (which is a Dashboard setting: Auth > Password > HaveIBeenPwned toggle).

-- ================================================================
-- 1. Drop SECURITY DEFINER from träff_rsvp_counts view [ERROR level]
-- Recreated with security_invoker so RLS on träffar / träff_rsvps applies
-- to the calling user instead of the view owner.
-- ================================================================
drop view if exists public."träff_rsvp_counts";

create view public."träff_rsvp_counts"
  with (security_invoker = true)
  as
  select
    t.id as "träff_id",
    count(r.*) filter (where r.user_id is not null) as rsvp_count,
    t.max_attendees
  from public."träffar" t
  left join public."träff_rsvps" r on r."träff_id" = t.id
  group by t.id, t.max_attendees;

comment on view public."träff_rsvp_counts" is
  'RSVP-räknare per träff. Security invoker — respekterar RLS på underliggande tabeller.';

-- ================================================================
-- 2. Lock search_path on set_updated_at trigger function [WARN]
-- Prevents a rogue public.now() or similar from being resolved before pg_catalog.
-- ================================================================
alter function public.set_updated_at() set search_path = public, pg_temp;

-- ================================================================
-- 3. Tighten profile-photos bucket SELECT policy [WARN]
-- The "Anyone can view photos" policy allows clients to .list() all objects
-- in a public bucket. Public URL access (.getPublicUrl()) bypasses RLS and
-- continues to work. Listing was never intended.
-- ================================================================
drop policy if exists "Anyone can view photos" on storage.objects;

-- ================================================================
-- 4. Deny-all RLS policies on service-role-only tables [INFO]
-- Both tables are written by edge functions via service_role (which bypasses
-- RLS). Explicit policies make the intent visible in schema and silence the
-- "rls_enabled_no_policy" linter.
-- ================================================================
drop policy if exists "service_role_only" on public.waitlist_signups;
create policy "service_role_only"
  on public.waitlist_signups
  for all
  using (false)
  with check (false);

drop policy if exists "service_role_only" on public.webhook_events;
create policy "service_role_only"
  on public.webhook_events
  for all
  using (false)
  with check (false);

comment on policy "service_role_only" on public.waitlist_signups is
  'Authenticated users read zero rows. Edge functions write via service_role, which bypasses RLS.';
comment on policy "service_role_only" on public.webhook_events is
  'Authenticated users read zero rows. RevenueCat webhook writes via service_role, which bypasses RLS.';
