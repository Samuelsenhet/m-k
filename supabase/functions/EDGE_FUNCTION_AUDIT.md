# Edge Function Audit: match-daily & match-status

## Summary

Both functions correctly use the request `Authorization` header and return 401 when unauthenticated. Schema alignment with the database was fixed so they use the same table/column names as migrations.

---

## match-daily

### Auth ✅

- Creates Supabase client with `headers: { Authorization: req.headers.get('Authorization')! }`.
- Calls `supabaseClient.auth.getUser()` and returns 401 when `authError || !user`.
- Verifies `requestUserId === user.id` and returns 401 if not.

### Schema fixes applied

| Before (wrong) | After (correct) |
|----------------|------------------|
| `user_daily_match_pool` | `user_daily_match_pools` |
| `.eq('date', today)` | `.eq('pool_date', today)` |
| `matchPool.candidates` | `matchPool.candidates_data ?? matchPool.candidates` |

- **last_daily_matches:** Function upserts into `last_daily_matches`; that table is not in migrations. It is created in `supabase/RLS_AND_SCHEMA_ALIGNMENT.sql`. If the table is missing, the upsert is skipped and a warning is logged (no crash).

### Tables / columns used

- **profiles:** `onboarding_completed`, `onboarding_completed_at`, `subscription_tier` (by `id`).
- **user_daily_match_pools:** `user_id`, `pool_date`, `candidates_data` (JSONB; treated as array or `{ candidates }`).
- **matches:** insert/select as in code; expects columns such as `match_score`, `match_date`, `match_type`, etc. (If your DB only has `compatibility_score`, you may need a migration to add the extra columns.)
- **last_daily_matches:** `user_id`, `date`, `match_ids` (see RLS_AND_SCHEMA_ALIGNMENT.sql).

---

## match-status

### Auth ✅

- Same pattern: client with `Authorization` header, `getUser()`, 401 when not authenticated.
- Verifies `requestUserId === user.id`.

### Schema fixes applied

| Before (wrong) | After (correct) |
|----------------|------------------|
| `user_daily_match_pool` | `user_daily_match_pools` |
| `.eq('date', today)` | `.eq('pool_date', today)` |

### Tables used

- **profiles:** `onboarding_completed` (by `id`).
- **matches:** `user_id`, `match_date`, `created_at`.
- **user_daily_match_pools:** `user_id`, `pool_date`.

---

## Env / CORS

- **match-daily:** `ALLOWED_ORIGIN` (default `*`).
- **match-status:** `CORS_ORIGIN` (default `*`).

Use the same name (e.g. `ALLOWED_ORIGIN`) in both if you want consistent config.

---

## Frontend

- **useMatches:** Sends `Authorization: Bearer ${session?.access_token}` on the initial `match-daily` invoke and on `fetchMoreMatches`; also on `generate-icebreakers` invoke.
- **useMatchStatus:** Sends `Authorization: Bearer ${session.access_token}` when invoking `match-status`.

No further auth changes needed for these two functions.
