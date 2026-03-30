# Release — säkerhetsgate (checklista)

Använd denna checklista **inför viktiga släpp** (t.ex. App Store, stor kampanj, juridisk granskning). Den ersätter inte pentest men samlar **rimliga kontroller** ovanpå er CI och dokumentation.

**Relaterat:** [SECURITY_MAINTENANCE.md](./SECURITY_MAINTENANCE.md) · [SUPABASE_DEPLOY.md](./SUPABASE_DEPLOY.md) · [SECURITY_REMEDIATION_PLAN.md](./SECURITY_REMEDIATION_PLAN.md)

---

## 1. Prod = git

- [ ] **Deploy to Production** (GitHub Actions) är **grön** för den commit som ska ligga i prod.
- [ ] **Supabase remote migration check** är **grön** (eller manuellt körd och OK efter deploy).
- [ ] Inga kända **ofixade** migrerings-/deployfel kvar i prod.

## 2. Supabase Dashboard (snabbkoll)

- [ ] **Edge Functions → Secrets:** nödvändiga nycklar satta (`LOVABLE_API_KEY`, `RESEND_*`, `SUPABASE_SERVICE_ROLE_KEY`, ev. `AI_*`).
- [ ] Känsliga funktioner har **JWT verification** påslagen där `config.toml` kräver det (t.ex. `match-status`); övriga enligt er [EDGE_FUNCTION_AUDIT](../supabase/functions/EDGE_FUNCTION_AUDIT.md) / Dashboard.

## 3. Advisors (MCP eller Dashboard)

- [ ] **`get_advisors` (security)** körts; kvarvarande **WARN** antingen åtgärdade eller **skriftligt accepterade** (datum + kort motivering i t.ex. team-chat eller MCP snapshot i `SUPABASE_DEPLOY.md`).
- [ ] Om **endast phone auth:** `auth_leaked_password_protection` kan medvetet ignoreras (se [SECURITY_MAINTENANCE.md](./SECURITY_MAINTENANCE.md)).

## 4. CI & beroenden

- [ ] **CI** på `main` / release-branch **grön** (secret-guard, audit critical, tester).
- [ ] **npm audit (high)**-stegets logg granskad; öppna **Dependabot**-PR:ar hanterade eller planerade inom teamets tidsram (t.ex. 14 dagar för high).

## 5. Manuell abuse-smoke (kort)

Kör med **två konton** (A och B) i **web** och gärna **iOS** om release berör mobil:

- [ ] A kan **inte** läsa B:s privata data via PostgREST/Edge (fel `matchId` / fel användar-id → **403** eller tomt enligt RLS).
- [ ] Chatt: skicka/ta emot som avsett; **ingen** åtkomst till främmande tråd.
- [ ] AI/isbrytare: ogiltig match → **403** eller motsvarande fel från Edge.
- [ ] Rapport/support-flöden som anropar `send-email` beter sig som avsett (ingen öppen relay).

## 6. Övervakning & incident (minimalt)

- [ ] Ni vet var ni ser **Edge-/Auth-loggar** (Supabase Dashboard).
- [ ] **Incident:** vem roterar nycklar vid läcka; länk till [Supabase Status](https://status.supabase.com/) (och ev. Resend) finns i [SUPABASE_DEPLOY.md](./SUPABASE_DEPLOY.md) § Incident.

## 7. Definition of Done (v1 / “klar nog”)

När punkterna **1–6** är avbockade (eller explicit N/A med motivering) kan teamet säga att **release-säkerhetsgate** är passerad för detta släpp. **Extern pentest** eller **bug bounty** är ett **separat** steg om krav finns från investerare eller enterprise-kunder.

---

_Datum / release:_ _______________  
_Ansvarig:_ _______________
