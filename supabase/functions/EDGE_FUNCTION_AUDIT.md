# Edge Function Audit: match-daily & match-status

## Summary

Both functions use the request `Authorization` header and return 401 when unauthenticated. **Gateway `verify_jwt` is off** for these two (`supabase/config.toml`); validation runs inside via `verifySupabaseJWT` → `auth.getUser(accessToken)` against the linked project’s GoTrue (avoids platform gateway 401 with asymmetric JWTs while still enforcing auth in code).

---

## match-daily

### Auth ✅

- `verifySupabaseJWT` in `_shared/env.ts`: `createClient(url, anon)` + `auth.getUser(access_token)`.
- Ensures `body.user_id` (if present) matches the JWT user; 401 otherwise.
- Service-role path only when `ALLOW_MATCH_DAILY_SERVICE_ROLE=true` and header matches the service role key.

### Schema fixes applied

| Before (wrong) | After (correct) |
|----------------|------------------|
| `user_daily_match_pool` | `user_daily_match_pools` |
| `.eq('date', today)` | `.eq('pool_date', today)` |
| `matchPool.candidates` | `matchPool.candidates_data ?? matchPool.candidates` |

- **last_daily_matches:** Function upserts into `last_daily_matches`; that table is not in migrations. It is created in `supabase/RLS_AND_SCHEMA_ALIGNMENT.sql`. If the table is missing, the upsert is skipped and a warning is logged (no crash).

### Tables / columns used

- **profiles:** `onboarding_completed`, `onboarding_completed_at` (by `id`).
- **subscriptions:** `plan_type`, `status`, `expires_at` (by `user_id`) for plus/free daily limits.
- **Service-role test auth:** Only when `ALLOW_MATCH_DAILY_SERVICE_ROLE=true` (do not enable in production).
- **user_daily_match_pools:** `user_id`, `pool_date`, `candidates_data` (JSONB; treated as array or `{ candidates }`).
- **matches:** insert/select as in code; expects columns such as `match_score`, `match_date`, `match_type`, etc. (If your DB only has `compatibility_score`, you may need a migration to add the extra columns.)
- **last_daily_matches:** `user_id`, `date`, `match_ids` (see RLS_AND_SCHEMA_ALIGNMENT.sql).

---

## match-status

### Auth ✅

- Same as match-daily: `verifySupabaseJWT` → `getUser(access_token)`; optional service-role branch for dashboard-style calls.
- Ensures resolved `user_id` matches the JWT user; 401 otherwise.

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

---

## Production choices for `match-daily` service-role path

The optional **service-role** branch (dashboard / cron-style calls) must **not** be enabled accidentally in production. Pick one approach and document it in CI:

1. **Env gate:** `ALLOW_MATCH_DAILY_SERVICE_ROLE=true` only in staging; omit or `false` in production project secrets.
2. **Split deploys:** deploy Edge functions to staging with the flag on; production project never receives that secret / uses a build profile that omits the branch.
3. **Omit from prod:** if production only needs user JWT + cron user path, remove or don’t deploy the service-role entrypoint in the production function bundle / workflow.

---

## send-email

### Auth

- Requires a non-empty `Authorization` header.
- User calls: JWT verified via `verifySupabaseJWT` (GoTrue `getUser` with `SUPABASE_URL` + `SUPABASE_ANON_KEY`; supports ES256 and legacy HS256).
- Service role bearer: only accepted when `SEND_EMAIL_SERVICE_ROLE_ENABLED` is not set to `false` (default: allowed for server/cron). Set `SEND_EMAIL_SERVICE_ROLE_ENABLED=false` in production if nothing should send mail with the service key.

### Templates

- Inline user templates (`report_received`, `appeal_received`): recipient must match caller email unless moderator.
- Inline mod templates and DB `email_templates`: moderator only.
- Invalid template names return 400.

---

## AI functions (`ai-assistant`, `generate-icebreakers`, `generate-followups`)

### Rate limits and budget (Postgres `ai_rate_limit_buckets` + RPC `try_consume_rate_limit`)

| Env | Purpose |
|-----|---------|
| `AI_GLOBAL_DAILY_MAX_CALLS` | Global daily cap (UTC day); returns 503 with `ai_global_cap` when exceeded. `0` or unset = disabled. |
| `AI_RATE_FREE_TIER_PER_DAY` | Extra Stockholm-day bucket for non–paid users only; `0` or unset = disabled. |
| `AI_RATE_USER_PER_MINUTE` / `AI_RATE_USER_PER_DAY` | Per-user per function. |
| `AI_RATE_IP_PER_MINUTE` / `AI_RATE_IP_PER_HOUR` | Per-IP per function. |

### match-daily

- Service-role bearer path is **off** unless `ALLOW_MATCH_DAILY_SERVICE_ROLE=true`. Do **not** enable in production.
