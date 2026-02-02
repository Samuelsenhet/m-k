# generate-match-pools

Edge Function that **generates daily match pools** from personality test results and profile data, and writes them to `user_daily_match_pools`. This connects the personality test to the matching system.

## What it does

1. **Reads** all profiles with `onboarding_completed = true` and a row in `personality_results`.
2. **Builds** candidate list with personality scores (ei, sn, tf, jp, at), archetype, category, age, gender, dealbreakers (min_age, max_age, interested_in).
3. **Runs** the same matching algorithm as `src/lib/matching.ts`: dealbreakers, 60% similar / 40% complementary, repeat avoidance using yesterday’s delivered matches.
4. **Writes** one row per user per day into `user_daily_match_pools` with `candidates_data` in the format expected by `match-daily`.

## Invocation

- **Auth:** Uses `SUPABASE_SERVICE_ROLE_KEY` only (no user JWT). RLS is bypassed so the function can read all profiles/personality_results and insert pools for any user.
- **Schedule:** Run once per day (e.g. 00:00 CET) so pools exist before users call `match-daily`.
- **Cron (Supabase):** In Dashboard → Database → Extensions, enable `pg_cron`, then add a job that calls this function’s URL with a `POST` and the service role key as `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`.
- **Manual:**  
  `curl -X POST "https://<project>.supabase.co/functions/v1/generate-match-pools" -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"`

## Environment

- `SUPABASE_URL` – project URL (set by Supabase for Edge Functions).
- `SUPABASE_SERVICE_ROLE_KEY` – required; used to read/write across users.

## Response

- `200`: `{ date, users_processed, total_eligible, batch_size }`
- `500`: configuration or DB error

## Flow after this runs

1. **generate-match-pools** (this function) fills `user_daily_match_pools` for today (CET).
2. Users call **match-daily** (with their JWT); it reads their pool and inserts into `matches`, then returns matches to the client.

Without running this function daily, `match-daily` will return “Match pool not yet generated for today.”
