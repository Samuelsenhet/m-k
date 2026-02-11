# Demo removal – checklist (completed)

All demo functionality has been removed. MÄÄK is now account-based only; no demo/seed mode.

---

## What was removed

- **Flags:** `VITE_ENABLE_DEMO`, `isDemoEnabled` (from `src/config/supabase.ts`, `src/vite-env.d.ts`)
- **Routes:** `/demo-seed`, `/demo-samlingar`; `AppWithoutSupabase` and demo-only routing
- **Pages/components:** `DemoSeed.tsx`, `DemoRouteGuard.tsx` (deleted)
- **UI:** Demo button in Chat header; Demo link/button in Matches (header + empty state); Demo button on Landing; Demo tab in BottomNav; "Öppna demo" in SupabaseSetupPage
- **Docs:** Demo references in README, VERCEL_SANITY_CHECK.md, VERCEL_SETUP.md (where present), SAMLINGAR_SOFT_LAUNCH_CHECKLIST.md
- **Client copy:** Supabase client console warnings no longer mention demo

---

## Sanity test (recommended)

1. **Lokalt:** `npm run dev` → Landing, Matches, Chat ska **inte** visa någon demo-länk eller demo-flik.
2. **Direktlänk:** Öppna `/demo-seed` eller `/demo-samlingar` → ska ge **404** (NotFound).
3. **Utan Supabase:** Ta bort/rensa `.env` (eller använd en kopia utan Supabase-nycklar) → appen ska visa **SupabaseSetupPage** (ingen demo-knapp).

---

## Om ni vill ha demo igen

Gör det i **separat repo eller feature branch**, inte i main-appen.
