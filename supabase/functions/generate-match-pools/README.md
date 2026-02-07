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

## Schedule (daily cron) – next step

Run the function once per day (e.g. 00:00 CET). Two options:

### Option A: Supabase (pg_cron + pg_net)

1. **Dashboard** → **Database** → **Extensions** → enable **pg_cron** and **pg_net**.
2. **Dashboard** → **SQL Editor** → run (replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY`; keep the key secret):

```sql
-- Store URL and service_role key in Vault (run once; use your real values)
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'generate_pools_base_url');
select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'generate_pools_service_role_key');

-- Schedule daily at 00:00 CET (cron: minute hour day month dow; 0 0 = midnight UTC, use 22 23 for ~00:00 CET in UTC)
select cron.schedule(
  'generate-match-pools-daily',
  '0 0 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'generate_pools_base_url') || '/functions/v1/generate-match-pools',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'generate_pools_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

- Get **Project ref** and **service_role** from **Dashboard** → **Settings** → **API** (Project URL and service_role key).  
- For 00:00 CET use cron `0 0 * * *` if your DB is in UTC (CET = UTC+1, so 00:00 CET = 23:00 UTC previous day → use `0 23 * * *` for 23:00 UTC = 00:00 CET).

3. **Unschedule (if needed):** `select cron.unschedule('generate-match-pools-daily');`

### Option B: GitHub Actions (no key in DB)

1. In your repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key  
   - `SUPABASE_URL` = `https://YOUR_PROJECT_REF.supabase.co`
2. Add `.github/workflows/generate-match-pools-cron.yml`:

```yaml
name: Generate match pools daily
on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Call generate-match-pools
        run: |
          curl -sSf -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/generate-match-pools" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

- Default schedule is 00:00 UTC; for 00:00 CET use `cron: '0 23 * * *'` (23:00 UTC).

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
