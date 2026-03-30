## Summary

<!-- Vad ändras och varför? -->

## Checklist

- [ ] **Database:** Nya tabeller har RLS på och policies är granskade (inga onödiga `WITH CHECK (true)` för `authenticated`).
- [ ] **Migrations:** DDL finns som fil under `supabase/migrations/` (inte bara SQL Editor / MCP utan git-fil).
- [ ] **Secrets:** Inga servernycklar (`service_role`, Lovable, Resend, Stripe `sk_live`, …) i `src/`, `apps/mobile/` eller `packages/core/` — endast Edge secrets / server.
- [ ] **Web:** `npm run lint` och `npm run build` (om relevant för ändringen).
- [ ] **Mobil:** `npx tsc --noEmit -p apps/mobile/tsconfig.json` (om `apps/mobile/` eller delad core ändrats).

## Supabase / deploy

- [ ] Ej tillämpligt / redan deployat
- [ ] Kräver `supabase db push` +/eller `supabase functions deploy` efter merge (se [docs/SUPABASE_DEPLOY.md](docs/SUPABASE_DEPLOY.md))

## Efter merge till `main` (ansvar mergeare)

- [ ] **Deploy to Production** har passerat (eller uppföljning är bokad).
- [ ] Vid behov: manuellt kört **Supabase remote migration check** (GitHub Actions).
- [ ] Om CI **audit**-loggen visar *high*: planera åtgärd via Dependabot / `npm audit` (se [docs/SECURITY_MAINTENANCE.md](docs/SECURITY_MAINTENANCE.md)).
- [ ] Vid **större release** (App Store, kampanj, juridik): [docs/SECURITY_RELEASE_GATE.md](docs/SECURITY_RELEASE_GATE.md) avbockad eller N/A.
