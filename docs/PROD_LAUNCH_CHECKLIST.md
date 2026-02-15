# Final production launch checklist

Use this once before going live. Tick each item; fix anything that fails.

---

## 1. Auth (Supabase)

- [ ] **Phone provider** (Twilio): In Supabase Dashboard → **Authentication → Providers → Phone**, SMS is configured and enabled. Test with a real number (or your test number).
- [ ] **Site URL & redirects**: **Authentication → URL Configuration**
  - **Site URL** = your production URL (e.g. `https://maakapp.se` or your Vercel URL).
  - **Redirect URLs** includes `https://your-domain.com/**` (and any custom domains).
- [ ] **Edge functions for OTP**: `twilio-send-otp` and `twilio-verify-otp` are deployed and their **secrets** are set in Supabase (Dashboard → Edge Functions → each function → Secrets: `TWILIO_*` etc.). See `supabase/functions/twilio-*` READMEs.
- [ ] **No demo in prod**: `VITE_ENABLE_DEMO` is unset or `false` in Vercel production env. App throws on build if demo is enabled in prod.

---

## 2. Database & RLS

- [ ] **Migrations applied**: Production DB has all migrations (`supabase db push` or CI “Push Migrations to Production” has run successfully).
- [ ] **RLS enabled**: All user-facing tables (e.g. `profiles`, `matches`, `messages`, `reports`, `group_*`) have RLS enabled and policies that restrict access by `auth.uid()`. No table is wide-open to anon.
- [ ] **Service role safe**: Service role key is never in frontend or in Vercel env; only anon key is in `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## 3. Edge functions (Supabase)

- [ ] **Deployed**: `supabase functions deploy` (or CI “Deploy Edge Functions to Production”) has run. In Dashboard → **Edge Functions**, all required functions are listed and deployed.
- [ ] **Secrets set**: For each function that needs keys (Twilio, OpenAI, Resend, etc.), secrets are set in Supabase (Edge Functions → function → Secrets). No secrets in repo.
- [ ] **Key functions**: At minimum, `twilio-send-otp`, `twilio-verify-otp`; if you use AI icebreakers/follow-ups, `generate-icebreakers`, `generate-followups`, `ai-assistant`; if you use cron, `match-daily`, `generate-match-pools`, `match-status`. Enable Realtime for presence if you use the online counter.

---

## 4. Vercel & frontend

- [ ] **Env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (and optional `VITE_APP_URL`, `VITE_SUPABASE_PROJECT_ID`) set for **Production**. See `docs/DEPLOY.md` §3.
- [ ] **Build**: `npm run build` and `npm run lint` pass. No type errors.
- [ ] **Custom domain** (if used): Domain added in Vercel; DNS points to Vercel; Supabase redirect URLs include that domain. See `docs/DOMAIN_SETUP.md`.

---

## 5. Analytics & monitoring (optional)

- [ ] **Vercel Analytics / Speed Insights**: Already in app (`App.tsx`). Ensure they’re enabled in Vercel project if you want metrics.
- [ ] **Error tracking**: If you add Sentry or similar later, add it here.

---

## 6. Post-deploy smoke test

After deploy, run through **docs/FULL_PASS_BEFORE_DEPLOY.md** on the **production URL**:

- [ ] Homepage loads; CTA works.
- [ ] Phone auth: send OTP → verify → age check → onboard or matches.
- [ ] Core routes: `/`, `/matches`, `/chat`, `/profile`; send a message; try icebreakers if enabled.
- [ ] No console errors on load and after login.
- [ ] Moderators: `/admin/reports` (and `/admin/appeals` if used) work for users in `moderator_roles`.

---

## Quick reference

| Area        | Where to check |
|------------|-----------------|
| Auth       | Supabase → Authentication → Providers, URL Configuration |
| RLS        | Supabase → Table Editor → table → RLS policies |
| Edge Fns   | Supabase → Edge Functions; secrets per function |
| Env vars   | Vercel → Settings → Environment Variables |
| Migrations | `supabase db push` or GitHub Actions “Push Migrations to Production” |
| Deploy     | **docs/DEPLOY.md** (full before/after deploy steps) |

---

When everything above is ticked, you’re ready for production traffic.
