# Supabase dashboard – quick check

Use this after running migrations or when verifying “all systems operational”.

## 1. **Table Editor**
- [ ] `profiles` – exists, has `user_id`, `id_verification_status`, and other expected columns
- [ ] `profile_photos` – exists
- [ ] `personality_results` – exists
- [ ] `matches` – exists, status allows `passed` (see RLS_AND_SCHEMA_ALIGNMENT.sql)
- [ ] `messages` – exists
- [ ] `achievements` – exists, has `code` column
- [ ] `user_achievements` – exists
- [ ] `user_daily_match_pools` – exists (for match-daily), has `pool_date`, `candidates_data`
- [ ] `last_daily_matches` – exists if you ran RLS_AND_SCHEMA_ALIGNMENT.sql
- [ ] `reports` – exists if you use reporting

## 2. **Authentication**
- [ ] Users can sign in; no unexpected auth errors in logs

## 3. **Storage**
- [ ] Bucket `profile-photos` – exists, public, policies allow upload/read
- [ ] Bucket `id-documents` – exists (private)
- [ ] Bucket `report-evidence` – exists if you use reports

## 4. **Edge Functions**
- [ ] `match-daily` – deployed, no 401 when called with valid session
- [ ] `match-status` – deployed, no 401 when called with valid session
- [ ] Secrets (e.g. `ID_VERIFICATION_WEBHOOK_SECRET`) set if you use id-verification webhook

## 5. **SQL / Migrations**
- [ ] Run **ONE_TIME_SETUP.sql** once if you haven’t (creates tables, RLS, storage)
- [ ] Run **RLS_AND_SCHEMA_ALIGNMENT.sql** once (matches `passed`, policies, `last_daily_matches`)
- [ ] `supabase migration list` – local and remote in sync (no pending or failed)

## 6. **Logs**
- [ ] API / Auth / Realtime logs – no repeated 401/404/500 for normal flows

If anything above fails, see **SUPABASE_CHECKLIST.md** and **RLS_AND_SCHEMA_ALIGNMENT.sql** for fixes.
