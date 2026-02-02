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

See `VERCEL_SETUP.md` in the project root for details.

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

---

## Reporting & moderation (reference)

- **Reports:** Stored in `public.reports`. Users submit via Profil (tre prickar), Chatt (tre prickar), or Inställningar → Rapportera problem.
- **Rapporthistorik:** Inställningar → Rapporthistorik (`/report-history`). Status updates trigger an in-app notification to the reporter (DB trigger).
- **Moderator:** Only users in `public.moderator_roles` can open `/admin/reports` and change report status.
- **Appeals:** Inställningar → Överklaga påföljd (`/appeal`). Stored in `public.appeals`; moderators can review in Supabase Table Editor until an admin UI exists.
