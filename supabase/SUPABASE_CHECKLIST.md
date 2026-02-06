# Supabase “known-good” checklist

Use this to clear 401, 404, and 400 errors before production.

---

## 1. Edge Functions returning 401 Unauthorized

**Symptom:** `POST /functions/v1/match-daily` or `match-status` returns 401.

**Cause:** Request is missing or invalid `Authorization: Bearer <access_token>`.

**Fix:**

- **Frontend:** The app now passes the session token when invoking Edge Functions:
  - `useMatches`: passes `Authorization: Bearer ${session.access_token}` to `match-daily`.
  - `useMatchStatus`: passes `Authorization: Bearer ${session.access_token}` to `match-status`.
- **Edge Function:** Must create the Supabase client with the request’s Authorization header:
  ```ts
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  ```
- Ensure the user is logged in when calling these functions (session exists).

---

## 2. REST 404 on tables (personality_results, profile_photos, user_achievements, etc.)

**Symptom:** `GET /rest/v1/personality_results` or similar returns 404.

**Cause:** Table doesn’t exist, or RLS has no policy that allows the request (Supabase can return 404 when no row is visible).

**Fix:**

1. **Create tables and RLS:** Run **ONE_TIME_SETUP.sql** in Supabase Dashboard → SQL Editor (or use migrations).
2. **Table Editor:** Confirm these exist with correct names (case-sensitive):
   - `profiles`
   - `profile_photos`
   - `personality_results`
   - `achievements`
   - `user_achievements`
3. **RLS policies:** For each table, ensure at least:
   - **SELECT** policy: `using (user_id = auth.uid())` (or equivalent for your key column).
   - **INSERT** policy: `with check (user_id = auth.uid())` where applicable.
   - **UPDATE** policy: `using (user_id = auth.uid())` where applicable.

If there is **no SELECT policy**, Supabase can respond with 404.

---

## 3. REST 400 – column not found (e.g. `alcohol`, `achievements_1.code`)

**Symptom:** `PATCH /rest/v1/profiles` → "Could not find the 'alcohol' column".

**Cause:** App expects columns that don’t exist in the current schema.

**Fix:**

- Run **ONE_TIME_SETUP.sql** (or **ADD_PROFILE_COLUMNS.sql**) so `profiles` has all required columns (e.g. `alcohol`, `smoking`, `id_verification_status`, etc.).
- For achievements: ensure `achievements` table has a `code` column and is seeded; `user_achievements` links to it. The app fetches earned achievements in two steps (user_achievements → achievements by id) to avoid join/schema mismatches.

---

## 4. Storage 400 – “Bucket not found” or upload rejected

**Symptom:** `POST /storage/v1/object/profile-photos/...` returns 400.

**Cause:** Bucket missing or storage policies block the upload.

**Fix:**

1. **Create bucket:** ONE_TIME_SETUP.sql creates `profile-photos` (and `id-documents`). Run it if you haven’t.
2. **Storage policies:** In Dashboard → Storage → `profile-photos` → Policies, ensure:
   - **INSERT:** `bucket_id = 'profile-photos'` and folder/owner = `auth.uid()` (e.g. `(storage.foldername(name))[1] = auth.uid()::text`).
   - **SELECT:** so users can read their (or public) objects.
   - **UPDATE/DELETE:** for own objects if the app needs them.
3. **Auth:** Upload only when the user is logged in (Supabase client uses the session).

---

## 5. Frontend crash – “t is not a function” (e.g. in SortablePhotoCard)

**Symptom:** `Uncaught TypeError: t is not a function` in a component that uses translations.

**Cause:** Translation function `t` from `useTranslation()` was not passed or was shadowed.

**Fix:**

- The app now uses a safe `translate` in `SortablePhotoCard`: `const translate = typeof t === 'function' ? t : (key) => key`, and uses `translate(...)` for all strings in that component.
- Everywhere else: ensure `const { t } = useTranslation()` and that `t` is passed correctly to children (no variable named `t` overwriting it).

---

## Quick order of operations

1. Run **ONE_TIME_SETUP.sql** in Supabase (SQL Editor or migrations).
2. Run **RLS_AND_SCHEMA_ALIGNMENT.sql** (adds `passed` to matches status, fixes matches UPDATE policy, creates `last_daily_matches`, aligns profiles/messages SELECT).
3. Confirm tables and buckets exist; fix any missing columns with **ADD_PROFILE_COLUMNS.sql** if needed.
4. Edge Functions `match-daily` and `match-status` use table `user_daily_match_pools` and column `pool_date`; see **functions/EDGE_FUNCTION_AUDIT.md**.
5. Hard refresh the app after DB/setup changes so the frontend doesn’t use stale schema/cache.

After this, 401 on Edge Functions, 404 on REST tables, 400 on profiles/storage, and the “t is not a function” crash should be addressed.
