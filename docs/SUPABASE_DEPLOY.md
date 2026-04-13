# Supabase: deploy, git som sanning, secrets

Denna guide stödjer **git/prod-paritet** och säker rutin för MĀĀK (web + iOS). Relaterat: [SECURITY_REMEDIATION_PLAN.md](./SECURITY_REMEDIATION_PLAN.md).

## Källordning: git före Dashboard och MCP

1. **All DDL** (tabeller, RLS, funktioner som kräver migration) ska finnas som fil under [`supabase/migrations/`](../supabase/migrations/) och mergas till `develop` / `main`.
2. **Undvik** att applicera migreringar enbart via Supabase SQL Editor eller **MCP `apply_migration`** utan att samma SQL finns i repot. Om undantag måste ske: lägg **omedelbart** en ny migreringsfil med samma innehåll så nästa `supabase db push` och historiken stämmer.
3. **Edge Functions** ska underhållas i [`supabase/functions/`](../supabase/functions/) och deployas via CI (`supabase functions deploy`), inte redigeras “bara i Dashboard”.

## CI-deploy (GitHub Actions)

| Gren      | Workflow | Åtgärd |
|-----------|----------|--------|
| `develop` | [`.github/workflows/staging.yaml`](../.github/workflows/staging.yaml) | `supabase link` + `db push` + `functions deploy` |
| `main`    | [`.github/workflows/production.yaml`](../.github/workflows/production.yaml) | samma mot production secrets |
| `main` (+ schema) | [`.github/workflows/supabase-remote-check.yaml`](../.github/workflows/supabase-remote-check.yaml) | Efter lyckad **Deploy to Production**, veckoschema (`cron`) eller `workflow_dispatch`: `supabase link` + `db push --dry-run` — **failar** om prod saknar migreringar som finns i git |

Krävs i GitHub **Actions secrets**: `SUPABASE_ACCESS_TOKEN`, `STAGING_PROJECT_ID` / `PRODUCTION_PROJECT_ID`, samt DB-lösen (`STAGING_DB_PASSWORD` / `PRODUCTION_DB_PASSWORD`).

**Obs:** `get_advisors` (Supabase security linter) finns **inte** som CLI/Action i samma form som MCP — kör **`get_advisors`** i Cursor eller granska Dashboard vid release. Migreringsdrift täcks av `supabase-remote-check` ovan.

## Edge Functions — secrets (Supabase Dashboard)

Sätt under **Project → Edge Functions → Secrets** (eller projektets secrets). Dessa får **inte** ligga i `VITE_*`, `EXPO_PUBLIC_*`, Vercel eller mobilbygge som servernycklar.

| Secret | Typisk användning |
|--------|-------------------|
| `SUPABASE_URL` | Ofta injicerad av plattformen; annars projekt-URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Endast Edge (service client); **aldrig** i klient |
| `ANTHROPIC_API_KEY` | AI-anrop (Claude Haiku 4.5) från Edge för `ai-assistant`, `generate-icebreakers`, `generate-followups` |
| `RESEND_API_KEY` | `send-email`, ev. spårning |
| `AI_GLOBAL_DAILY_MAX_CALLS` | Globalt tak AI-anrop (0 = av) |
| `AI_RATE_USER_PER_MINUTE` / `AI_RATE_USER_PER_DAY` / `AI_RATE_IP_PER_MINUTE` / `AI_RATE_IP_PER_HOUR` | Rate limits (valfritt) |
| `ALLOW_MATCH_DAILY_SERVICE_ROLE` | `true` endast om service-role-path till `match-daily` ska vara aktiv |
| Övriga | Twilio, webhook-secrets enligt respektive funktion |

**Klienten** använder enbart anon/public key + URL (se [`packages/core/src/supabaseEnv.ts`](../packages/core/src/supabaseEnv.ts)).

## Verifiering mot fjärrprojekt (Supabase MCP)

Använd **Cursor Supabase MCP** (eller CLI med länkat projekt) vid release:

- `list_migrations` — jämför versionsnamn med filer i `supabase/migrations/`.
- `list_edge_functions` — jämför med kataloger under `supabase/functions/*/`.
- `get_advisors` (security / performance) — åtgärda eller dokumentera kvarvarande WARN.

### Senaste MCP-ögonblicksbild (uppdatera vid behov)

Se avsnitt **MCP snapshot** längst ned i denna fil efter manuell eller agent-körning.

## Incident / rotation (kort)

- **Läckt service role:** rotera i Supabase Dashboard → API → service_role; uppdatera Edge secrets och alla interna skript.
- **Läckt Resend/Anthropic:** rotera nyckel hos leverantör + Edge secrets.
- **Status:** [Supabase Status](https://status.supabase.com/), [Resend Status](https://resend.com/status) (vid behov).

## Löpande checklista (prod, audit, advisors)

Se **[SECURITY_MAINTENANCE.md](./SECURITY_MAINTENANCE.md)** — merge → production-deploy, npm audit-nivåer, Dependabot, MCP advisors (inkl. phone-only vs lösenordsvarningar) och vad som *inte* ingår (formell säkerhetsrevision). **Före större release:** [SECURITY_RELEASE_GATE.md](./SECURITY_RELEASE_GATE.md).

---

## MCP snapshot

_Senast uppdaterad via Supabase MCP (`list_migrations`, `list_edge_functions`, `get_advisors`). Uppdatera detta avsnitt när projekt-ref eller fjärrläge ändras._

**Projekt-ref:** `jappgthiyedycwhttpcu` (MÄÄK produktion — byt om ni använder annat projekt).

### Migreringar (git ↔ fjärr)

- Fjärr (`list_migrations`) och git-filer under `supabase/migrations/` ska ha **samma versionsprefix** (t.ex. `20260328161835_vibe_security_linter_fixes.sql` i git motsvarar version `20260328161835` / namn `vibe_security_linter_fixes` i historiken).
- **Gör inte** DDL enbart via MCP/Dashboard utan att lägga samma SQL som ny migreringsfil — annars divergerar `db push` och reproducerbarhet.

### Edge functions (fjärr)

**`reset-demo-password`:** valfritt sätt **`DEMO_USER_ID`** (Supabase secrets) till demo-användarens **auth.users.id** för direkt `getUserById`; annars pagineras `listUsers` tills e-post hittas.

15 aktiva funktioner; slug ska matcha kataloger i `supabase/functions/`:

`ai-assistant`, `generate-followups`, `generate-icebreakers`, `generate-match-pools`, `id-verification-webhook`, `match-daily`, `match-status`, `reset-demo-password`, `send-bulk-email`, `send-email`, `send-notification`, `super-responder`, `track-email`, `twilio-send-otp`, `twilio-verify-otp`.

**JWT:** `match-daily` och `match-status` har `verify_jwt = false` i [`supabase/config.toml`](../supabase/config.toml) (undviker gateway-401 med vissa JWT-format); **auth sker i funktionen** via `verifySupabaseJWT` (och `Bearer <service_role>` där det är tillåtet för intern test/dashboard). Efter ändring av `config.toml`: kör **`supabase functions deploy`** (eller production-workflow) så fjärr uppdateras.

### Security advisors (`get_advisors`, security)

- **Kvarvarande (accepterad för phone-only):** `auth_leaked_password_protection` (lösenordsläckage-skydd) — irrelevant om ni endast använder telefon/OTP; annars slå på i Dashboard.
- Övriga tidigare linter-fall (t.ex. `app_logs`, `ai_*`-tabeller, `search_path`) är åtgärdade i migreringar; kör MCP igen efter större DDL-ändringar.

### GitHub MCP (valfritt)

- `list_commits` på `main` för att koppla deploy till commit.
- `run_secret_scanning` på diff/innehåll för känsliga PR:ar (råtext — inga riktiga nycklar i prompten).
