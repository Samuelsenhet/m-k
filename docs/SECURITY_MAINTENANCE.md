# Säkerhetsunderhåll (process + verifiering)

Detta dokument ersätter inte en **formell säkerhetsrevision eller pentest** — det beskriver hur ni håller MĀĀK i linje med er arkitektur över tid.

Relaterat: [SUPABASE_DEPLOY.md](./SUPABASE_DEPLOY.md), [SECURITY_REMEDIATION_PLAN.md](./SECURITY_REMEDIATION_PLAN.md).

**Inför viktiga släpp:** [SECURITY_RELEASE_GATE.md](./SECURITY_RELEASE_GATE.md) (checklista: prod, advisors, smoke, DoD).

## Efter merge till `main` (prod = git)

1. Kontrollera att **Deploy to Production** i GitHub Actions **lyckades** (migreringar + Edge functions).
2. **Supabase remote migration check** körs automatiskt efter lyckad production-deploy samt veckovis; vid osäkerhet: Actions → **Supabase remote migration check** → **Run workflow**.
3. Om deploy misslyckades: åtgärda innan fler ändringar mergas — annars lever prod inte i paritet med git.

## Beroenden (npm)

- **CI blockerar** endast **critical** (`npm audit --audit-level=critical`) så att kända men svårfixade *high*-problem inte låser varje PR.
- **Samma CI-jobb loggar även `high`** (steg med `continue-on-error`) — läs Action-loggen efter varje körning.
- **Dependabot** (`.github/dependabot.yml`) skapar veckovisa PR:ar — granska och merga dem regelbundet för att minska high/moderate.

## Supabase advisors (Dashboard / MCP)

- Kör **Supabase MCP `get_advisors`** (security, ev. performance) vid större release eller efter nya tabeller/RLS.
- **`auth_leaked_password_protection`** (HaveIBeenPwned för lösenord) är **onödig** om ni **endast** använder **telefon/OTP** — då kan varningen ignoreras eller dokumenteras som accepterad.
- Nya **WARN** efter migrering: åtgärda eller motivera skriftligt i teamet / uppdatera MCP snapshot i `SUPABASE_DEPLOY.md`.

## Omfattning och förväntningar

- **Säkerhet = process + upprepade kontroller**, inte en engångs “grön status”.
- Kodgranskning, staging-test och ev. extern pentest kompletterar CI och RLS.
