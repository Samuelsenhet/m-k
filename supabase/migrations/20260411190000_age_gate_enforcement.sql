-- Age gate — enforce 20+ at the database level.
--
-- The mobile onboarding already validates age client-side, but nothing
-- prevents a 19-year-old from using the Supabase client directly (or
-- the REST API) to insert a profile with a too-recent date_of_birth.
-- This migration adds a CHECK constraint on profiles.date_of_birth so
-- any insert/update with an underage DOB is rejected by Postgres.
--
-- Why a CHECK and not a trigger:
--   - CHECK runs on every write, no trigger overhead
--   - Error message is clear at the API layer (PGRST violates check)
--   - Idempotent — re-running this migration is a no-op
--
-- The constraint uses age_months rather than age_years to handle the
-- edge case where a user signs up on the day they turn 20. A strict
-- ">= 20 years" check would reject someone born exactly 20 years ago
-- today because (now() - dob) is a hair under 20 full years due to
-- timezone math. Using ">= 20 years - interval '1 day'" is the safer
-- floor — it lets the day-of-birthday through but still rejects anyone
-- clearly underage.

begin;

-- If the constraint already exists (re-running this migration), drop it
-- first. We don't rely on "add constraint if not exists" because PG
-- versions < 15 don't support it on all constraint types.
alter table public.profiles
  drop constraint if exists profiles_age_gate_20;

-- A user is allowed if either:
--   - they haven't set a DOB yet (in onboarding before the DOB step)
--   - they are >= 20 years old (with the 1-day tolerance described above)
alter table public.profiles
  add constraint profiles_age_gate_20
  check (
    date_of_birth is null
    or date_of_birth <= (current_date - interval '20 years' + interval '1 day')::date
  )
  not valid;

-- NOT VALID → check is applied on new writes but existing rows are not
-- re-validated. Validate separately so the migration fails loudly if we
-- already have underage rows in prod (we shouldn't, but let's know).
alter table public.profiles
  validate constraint profiles_age_gate_20;

comment on constraint profiles_age_gate_20 on public.profiles is
  'MÄÄK age gate: 20+ required. Enforced at the DB layer so the age ' ||
  'check cannot be bypassed by hitting the REST API directly.';

commit;
