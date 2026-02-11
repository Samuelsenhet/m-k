# How to fix / set up Vercel for MÄÄK

Follow these steps in order.

---

## 1. Add environment variables on Vercel

Your app needs these at **build time** (Vite bakes `VITE_*` into the bundle). Names must match exactly.

### Option A – Vercel Dashboard (recommended)

1. Open **[Vercel Dashboard](https://vercel.com/dashboard)** and select your project (or create one and import this repo).
2. Go to **Settings** → **Environment Variables**.
3. Add **each** of these (use your real values from [Supabase](https://supabase.com/dashboard) → your project → **Settings** → **API**):

| Name | Value | Where to get it |
|------|--------|------------------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` | Supabase → Settings → API → **Project URL** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbG...` (long string) | Supabase → Settings → API → **anon public** key |
| `VITE_SUPABASE_PROJECT_ID` | Your project ref (e.g. `abcdefgh`) | In the Project URL or Supabase → Settings → General → **Reference ID** |
| `VITE_ENABLE_DEMO` | `false` (or leave unset) | **Production:** always `false` so demo is hidden. Only set `true` for demo/pitch deployments. |

- For **Environment**, select **Production** (and **Preview** if you use preview deployments).
- **Production:** set `VITE_ENABLE_DEMO=false` (or omit) so demo links and `/demo-seed` are not shown.
- Click **Save** after each variable.

### Option B – Vercel CLI

From the project root (after `vercel link`), run for each variable and paste the value when prompted:

```bash
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
npx vercel env add VITE_SUPABASE_PROJECT_ID production
```

Use the same values as in `.env.example` (from Supabase Dashboard → Settings → API).

**Important:** After changing env vars, trigger a **new deployment** (Redeploy) so the new values are used.

---

## 2. Set Node.js version (if build fails)

If the build fails with a Node/engine error:

1. In Vercel: **Settings** → **General**.
2. Find **Node.js Version**.
3. Choose **20.x** (matches `package.json` engines).
4. Save and redeploy.

---

## 3. Deploy

**Option A – From Git (recommended)**

1. In Vercel, go to **Deployments**.
2. Click **Redeploy** on the latest deployment (after adding env vars), or push a new commit to your connected branch.

**Option B – From your computer**

1. Install Vercel CLI: `npm i -g vercel`
2. In the project folder run: `vercel` (or `vercel --prod` for production).
3. Log in if asked and follow the prompts. Env vars from the dashboard are used automatically.

---

## 4. Check that it worked

- The deployment finishes without errors.
- Opening your Vercel URL (e.g. `https://your-app.vercel.app`) loads the app.
- Opening a route like `https://your-app.vercel.app/matches` or `/chat` does **not** show 404 (thanks to `vercel.json` rewrites).

If the app loads but Supabase calls fail (e.g. 401, “invalid key”), double-check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set correctly on Vercel and that you redeployed after adding them.

---

## 5. Recommended env for Production vs Demo

| Environment | VITE_SUPABASE_URL | VITE_SUPABASE_PUBLISHABLE_KEY | VITE_ENABLE_DEMO |
|-------------|-------------------|-------------------------------|------------------|
| **Production** | Your real URL | Your anon key | `false` or unset |
| **Preview (staging)** | Your real URL | Your anon key | `false` or unset |
| **Demo / pitch build** | Can be empty | Can be empty | `true` |

When `VITE_ENABLE_DEMO=false` (or unset), demo links and the Demo tab are hidden; `/demo-seed` redirects to `/`.
