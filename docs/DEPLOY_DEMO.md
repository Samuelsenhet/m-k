# Deploy demo to demo.example.com

Build and deploy a **demo-only** version of MÄÄK (e.g. at `demo.maakapp.se` or `demo.example.com`) so real users never see demo and the main app stays production-clean.

## 1. Build the demo bundle

```bash
npm run build:demo
```

This uses `--mode demo`, which loads `.env.demo` and sets `VITE_ENABLE_DEMO=true`. Output is in `dist/` (same as production build, but with demo enabled).

## 2. Deploy to a subdomain

### Option A: Vercel (recommended)

1. **Same project, second deployment**
   - In Vercel, go to your project → **Settings** → **Environment Variables**.
   - Add `VITE_ENABLE_DEMO` = `true` and scope it to a **Preview** environment (or a dedicated branch, e.g. `demo`).
   - Deploy from the `demo` branch (or run `npm run build:demo` in CI and deploy that artifact).
   - In **Settings** → **Domains**, add `demo.maakapp.se` (or your subdomain) and assign it to the **Preview** deployment or the `demo` branch.

2. **Separate Vercel project**
   - Create a second Vercel project that points at the same repo.
   - Set env: `VITE_ENABLE_DEMO=true` (and same Supabase vars if you want demo to hit a demo backend).
   - Add the domain `demo.maakapp.se` to this project.

### Option B: Static host (Netlify, S3, etc.)

1. Run `npm run build:demo`.
2. Upload the contents of `dist/` to the host.
3. Point `demo.maakapp.se` (or `demo.example.com`) at that deployment.

## 3. DNS

Add a CNAME (or A/ALIAS) for your demo subdomain to the host you use (e.g. Vercel or Netlify). Example:

- **Name:** `demo` (for `demo.maakapp.se`)
- **Target:** `cname.vercel-dns.com` (or the host’s given target).

## Summary

| Build        | Command           | Use case              |
|-------------|-------------------|------------------------|
| Production  | `npm run build`   | Main app (maakapp.se) |
| Demo        | `npm run build:demo` | Demo subdomain        |

Demo is **never** enabled in the production build; it is only enabled when you use the demo build or set `VITE_ENABLE_DEMO=true` in a separate deployment.
