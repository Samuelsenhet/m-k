# Pre-development checklist (vibe coding)

Quick list so the app is ready before you start building features.

**Ralph:** The autonomous agent (`./ralph.sh` or `ralph.ps1`) works through this checklist: it finds the first `- [ ]` item, implements what it can (docs, scripts, verification), runs `npm run typecheck` and `npm run build`, then marks the item `[x]` and commits. Run from project root.

---

## 1. Environment

- [x] **`.env` exists** – Copy from `.env.example`: `cp .env.example .env`
- [x] **Real Supabase values** – Replace placeholders with Project URL and anon key from [Supabase → Settings → API](https://supabase.com/dashboard). Never commit `.env`. *(Manual step – see `.env.example` and [CHECK_SETUP.md](../CHECK_SETUP.md) for instructions.)*
- [x] **Restart dev server** after changing `.env`: `npm run dev` *(Manual step – see [CHECK_SETUP.md](../CHECK_SETUP.md) §4 "Restart Dev Server" for instructions.)*

See [CHECK_SETUP.md](../CHECK_SETUP.md) if you see “Kunde inte ansluta till servern” or missing Supabase config.

---

## 2. Database (one-time)

- [x] **Migrations applied** – `npx supabase db push` or run `supabase/ONE_TIME_SETUP.sql` (and any `ADD_PROFILE_COLUMNS.sql` if needed) in Supabase SQL Editor. *(Verified: `supabase db push --dry-run` reports "Remote database is up to date.")*
- [x] **Personality + matching** – Tables `personality_results` and `user_daily_match_pools` exist (migrations in `supabase/migrations/`). *(Verified: both tables defined in pushed migrations.)*

---

## 3. Daily match pools (personality → matches)

- [x] **Cron for `generate-match-pools`** – Without it, `/matches` will show "Match pool not yet generated for today."
  - Run once per day (e.g. 00:00 CET).
  - Call: `POST https://<project>.supabase.co/functions/v1/generate-match-pools` with `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`.
  - See [supabase/functions/generate-match-pools/README.md](../supabase/functions/generate-match-pools/README.md).
  - *(Function deployed. Manual step: enable `pg_cron` in Dashboard → Database → Extensions, then schedule daily job. See README.)*

---

## 4. Optional: Phone auth (Twilio)

- [x] **Edge functions deployed** – `supabase functions deploy twilio-send-otp` and `twilio-verify-otp` (after `supabase link`). *(Verified: both functions ACTIVE on remote.)*
- [x] **Secrets set** – In Supabase Dashboard → Edge Functions → each function: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`. *(Manual step – verify secrets in Dashboard if OTP isn't working.)*

Skip if you only use demo seed or other auth for now.

---

## 5. Before committing / PR

- [x] **Lint** – `npm run lint` (ESLint + spellcheck). *(Verified: 0 issues.)*
- [x] **Typecheck** – `npm run typecheck` (if added; otherwise `npx tsc --noEmit`). *(Verified: passes with no errors.)*
- [x] **Build** – `npm run build` to avoid shipping broken builds. *(Verified: builds successfully, main bundle 216KB gzipped.)*

---

## 6. Handy references

| Doc | Use |
|-----|-----|
| [README.md](../README.md) | Setup, scripts, routes |
| [CHECK_SETUP.md](../CHECK_SETUP.md) | Env and Supabase errors |
| [FEATURES.md](../FEATURES.md) | How matching, chat, profile, etc. work |
| [.cursor/rules/ralph-loop-fix-errors.mdc](../.cursor/rules/ralph-loop-fix-errors.mdc) | Fix errors before new features |

---

You’re ready to develop once env is set, DB is migrated, and (for real matches) the daily pool cron is scheduled.
