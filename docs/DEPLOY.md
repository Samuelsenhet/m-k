# MÄÄK – Deploy checklist

Use this checklist before and after each production deploy.

**Before first production launch:** run through **`docs/PROD_LAUNCH_CHECKLIST.md`** (auth, RLS, Edge Functions, analytics, smoke test).

---

## 1. Prerequisites

- **Node.js** 20.x (see `package.json` engines).
- **Supabase project** with API URL and anon key.
- **Vercel** account; repo linked to the project (or `vercel link`).

---

## 2. Environment variables

### Frontend (Vercel)

Set in **Vercel → Settings → Environment Variables** for **Production** (and **Preview** if you use preview deploys). Vite bakes `VITE_*` into the build, so values must be set before deploy.

| Variable | Required | Notes |
|----------|----------|--------|
| `VITE_SUPABASE_URL` | Yes | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase → Settings → API → anon public key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Project ref (e.g. in Project URL or Settings → General → Reference ID) |
| `VITE_APP_URL` | No | Optional; set to `https://maakapp.se` (or your domain) for links/redirects |
| `VITE_ENABLE_DEMO` | No | **Leave unset or `false` in production.** Do not set `true` in prod (build will fail). |

**CLI (optional):** From project root: `npm run vercel:env` then paste values when prompted (adds the three required vars to production).

Details: **`docs/VERCEL_SETUP.md`**.

### Supabase Edge Functions

Secrets (e.g. for `match-daily`, `send-email`, Twilio) are set in **Supabase Dashboard → Edge Functions → Secrets**, or via CLI:

```bash
npx supabase secrets set KEY=value --project-ref YOUR_REF
```

---

## 3. Build and test locally

Run before pushing to trigger deploy:

```bash
npm ci
npm run lint
npm run test
npm run build
```

Fix any errors. Optional: `npm run typecheck`.

---

## 4. Deploy

### 4a. Supabase (migrations + Edge Functions)

**Migrations** – so remote DB matches the app:

```bash
npx supabase db push
```

If you see "Remote migration versions not found", use `npx supabase migration repair <version> --status reverted` then `db push` again.

**Edge Functions** (if you use them):

```bash
npx supabase functions deploy --project-ref YOUR_REF
```

Deploy individual functions if needed, e.g. `npx supabase functions deploy match-daily --project-ref YOUR_REF`.

### 4b. Vercel (frontend)

- **From Git:** Push to the connected branch; Vercel builds and deploys automatically.
- **From CLI:** `vercel --prod` (after `vercel link`).

After changing env vars, trigger a **Redeploy** so the new values are used.

---

## 5. After deploy

- [ ] App loads at the production URL.
- [ ] Auth works (phone login / signup).
- [ ] Key routes: `/`, `/matches`, `/chat`, `/profile`, `/report`, `/report-history`, `/appeal`, `/terms`, `/reporting`.
- [ ] No console errors on first load and after login.
- [ ] Moderators: `/admin/reports` and `/admin/appeals` work if used.

### Production URL returns 401

If the production site returns **401 Unauthorized** (e.g. when opening the URL or when checking with `curl`), the cause is usually **Vercel Deployment Protection**. To make the site publicly accessible:

1. **Vercel Dashboard** → your project → **Settings** → **Deployment Protection**.
2. For **Production**, set protection to **Standard** (production custom domain stays public, previews protected) or **None** (no auth on any deployment).
3. Save and, if needed, redeploy so the change applies.

After that, the production URL should return **200** and the app should load without a login prompt.

**Smoke test when domain is protected:** Use the direct deployment URL from the deploy output (e.g. `https://maakapp-xxxx.vercel.app`) to verify the app loads and key routes work; the alias or custom domain may require Vercel login until Deployment Protection is changed.

---

## 6. Optional / reference

### Custom domain (maakapp.se)

**`docs/DOMAIN_SETUP.md`** – Vercel domains, DNS (e.g. Loopia), Supabase Site URL and Redirect URLs.

### Moderator access

Supabase → SQL Editor (replace `USER_UUID` with auth user id):

```sql
INSERT INTO public.moderator_roles (user_id) VALUES ('USER_UUID') ON CONFLICT (user_id) DO NOTHING;
```

### Samlingar (gruppchatt)

**`docs/SAMLINGAR.md`** – migrations (e.g. `20260203100100_realtime_group_messages.sql`), Realtime for `group_messages`.

### GitHub Actions (CI deploy)

If you run `supabase db push` / `supabase functions deploy` from CI, set in **GitHub → Settings → Secrets and variables → Actions**:

- `SUPABASE_ACCESS_TOKEN` – [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
- `PRODUCTION_PROJECT_ID`, `PRODUCTION_DB_PASSWORD` (and staging equivalents if used)

### Reporting & moderation

- **Reports:** `public.reports`; users submit via Profil/Chatt/Inställningar.
- **Rapporthistorik:** `/report-history`; status updates trigger in-app notification (DB trigger).
- **Moderator:** only users in `public.moderator_roles` can use `/admin/reports` and `/admin/appeals`.
