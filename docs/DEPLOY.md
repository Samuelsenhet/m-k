# MÄÄK – Deploy checklist

Use this checklist before and after each production deploy.

---

## Before deploy

### 1. Supabase migrations

Run pending migrations so the remote DB matches the app:

```bash
npx supabase db push
```

If you get "Remote migration versions not found", see the repair steps in the repo (or run `npx supabase migration repair <version> --status reverted` then `db push` again).

### 2. Moderator access (reports)

To let a user moderate reports (see and update all reports):

1. Supabase Dashboard → **SQL Editor**.
2. Run (replace `USER_UUID` with the user’s auth id):

```sql
INSERT INTO public.moderator_roles (user_id) VALUES ('USER_UUID') ON CONFLICT (user_id) DO NOTHING;
```

3. That user can open **Profil → Inställningar → Moderering – Rapporter** (or go to `/admin/reports`).

### 3. Env vars (Vercel)

Ensure these are set in Vercel (Settings → Environment Variables) for **Production** (and Preview if needed):

| Name | Required |
|------|----------|
| `VITE_SUPABASE_URL` | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Yes |
| `VITE_APP_URL` | No (optional; set to `https://maakapp.se` when using custom domain) |

See `docs/VERCEL_SETUP.md` for details.

### 3b. Custom domain (maakapp.se)

To use **maakapp.se** (or määkapp.com / määkapp.se):

1. **Vercel:** Settings → Domains → Add `maakapp.se` (and optionally www).
2. **Loopia DNS:** A @ → `216.198.79.1`, CNAME www → värdet från Vercel (Settings → Domains, t.ex. …vercel-dns-017.com).
3. **Supabase:** Authentication → URL Configuration → Site URL `https://maakapp.se`, Redirect URLs `https://maakapp.se/**`.

Full steps, checklist and optional domains: **`docs/DOMAIN_SETUP.md`**.

### 4. Build locally

```bash
npm ci
npm run build
npm run lint
```

Fix any errors before pushing.

---

## Deploy

- **Vercel:** Push to the connected branch, or run `vercel --prod` after `vercel link`.
- After changing env vars, trigger a **Redeploy** so the new values are used.

---

## After deploy

- [ ] App loads at the production URL.
- [ ] Auth works (phone login / signup).
- [ ] Key routes work: `/`, `/matches`, `/chat`, `/profile`, `/report`, `/report-history`, `/appeal`, `/terms`, `/reporting`.
- [ ] No console errors on first load and after login.
- [ ] If you use moderators: open `/admin/reports` as a moderator and confirm reports list and status update work.
- [ ] Moderators: open `/admin/appeals` and confirm appeals list and status update work.

---

## Reporting & moderation (reference)

- **Reports:** Stored in `public.reports`. Users submit via Profil (tre prickar), Chatt (tre prickar), or Inställningar → Rapportera problem.
- **Rapporthistorik:** Inställningar → Rapporthistorik (`/report-history`). Status updates trigger an in-app notification to the reporter (DB trigger).
- **Moderator:** Only users in `public.moderator_roles` can open `/admin/reports` and change report status.
- **Appeals:** Inställningar → Överklaga påföljd (`/appeal`). Stored in `public.appeals`; moderators can review in Supabase Table Editor until an admin UI exists.
