# MÄÄK — Launch Plan

> Skriven: 2026-04-18. Ersätter/kompletterar `LAUNCH_NEXT_STEPS.md` från 2026-04-12.
> Status: build 83 uppladdad, ASC ifyllt, iPad-blocker löst genom `supportsTablet: false` + `UIRequiredDeviceCapabilities: ["armv7","telephony"]`. Rebuild krävs för att flaggorna ska hamna i binär.

## TL;DR — kritisk väg

1. EAS rebuild → build 84+ väljs i ASC → iPad-tabben försvinner
2. TestFlight-sanity på riktig iPhone
3. Submit wizard → Submit for Review
4. Vid approval: stäng av demo-reset, dry-run waitlist, release
5. Skarpt waitlist-mail
6. Vecka 1: övervaka PostHog + RevenueCat + Supabase logs

Allt annat är deferred.

---

## Fas 0 — Innan submit (blockers)

### 0.1 Städa git-workspacen

Många modifierade filer + 9 untracked migrations ligger lokalt. Migrations är **redan applicerade till prod**, men bör committas så team-historiken stämmer och reviewer-branchen är ren.

```bash
# Kontrollera migrationsstatus (ska matcha lokalt/remote)
npx supabase migration list --linked

# Committa untracked migrations
git add supabase/migrations/20260416202834_fix_subscription_trigger_conflict.sql \
        supabase/migrations/20260418090000_fix_profile_photos_upload_policy_v2.sql \
        supabase/migrations/20260418100000_fix_profile_photos_upload_policy_v3.sql \
        supabase/migrations/20260418110000_fix_profile_photos_upload_policy_v4.sql \
        supabase/migrations/20260418120000_fix_profile_photos_upload_policy_v5.sql \
        supabase/migrations/20260418130000_test_private_profile_photos.sql \
        supabase/migrations/20260418140000_nuke_and_recreate_profile_photos.sql \
        supabase/migrations/20260418150000_profile_photos_unique_slot.sql \
        supabase/migrations/20260418160000_profile_photos_public_restore.sql \
        supabase/migrations/20260418170000_compute_engagement_scores_cron.sql \
        supabase/functions/storage-proxy/
git commit -m "chore(supabase): commit applied migrations + storage-proxy fn"
```

Övriga modifierade appfiler: gå igenom `git status` och commit det som hör till launch, släpp resten.

### 0.2 EAS rebuild för iPad-fix

Build 83 har **inte** `supportsTablet: false` eller `telephony`-capability i Info.plist. Rebuild krävs för att flaggorna ska nå binär.

```bash
cd apps/mobile
eas build --platform ios --profile expo-production
```

- 20-30 min remote
- Nytt build number (84+)
- Inkluderar dagens fixes: expo-video safety i Expo Go, profile hero polish (commit `85a46d4`)

### 0.3 Välj nya bygget i ASC

1. App Store Connect → My Apps → MÄÄK → Version 1.0
2. Build-sektionen → ta bort 83 → lägg till 84+
3. **Spara** → iPad-screenshots-tabben ska försvinna

### 0.4 TestFlight-sanity på riktig iPhone

Installera TestFlight-bygget och kör igenom:

- [ ] Phone OTP med riktigt nummer
- [ ] Onboarding: personality test + foto-upload (video också om möjligt)
- [ ] Matchning: vänta in daily match → chat
- [ ] Paywall: öppna från profile → inga krascher
- [ ] Sub-köp via sandbox: `subscriptions`-rad dyker upp i Supabase
- [ ] Chat: skicka text, skicka media
- [ ] Profile edit: spara ändringar → syns efter reload
- [ ] ID-verifiering: selfie-flöde (auto-approve i dev)
- [ ] Sign out → sign in igen

### 0.5 Preflight-check

```bash
npm run launch:check
```

Ska vara grönt. Om något fails — fixa innan submit.

### 0.6 Externa system — verifiera

- [ ] **Resend**: domänen `maakapp.se` är verified (SPF/DKIM via DNS). Utan detta failar hela waitlist-mailet. Resend dashboard → Domains → status = **Verified**.
- [ ] **RevenueCat**: iOS offerings `maak_basic_weekly` + `maak_premium_monthly` live, webhook URL pekar på Supabase edge function.
- [ ] **Supabase edge functions deployed**: `match-daily`, `ai-assistant`, `generate-icebreakers`, `send-notification`, `revenuecat-webhook`, `waitlist-notify`, `storage-proxy`, `id-verification-webhook`.
- [ ] **Landing**: https://maakapp.se/ laddar, OG-bild syns i Messages/Slack preview.

### 0.7 Verifiera "Manuellt released"-flagga

ASC → Version 1.0 → Version Release → **Manually release this version**. Annars släpps appen direkt vid approval (innan vi hunnit förbereda waitlist).

---

## Fas 1 — Submit (dag 0)

### 1.1 Add for Review wizard

Spara Version 1.0-sidan → klicka **Add for Review**.

Svara:

| Fråga | Svar |
|---|---|
| Export Compliance — contains encryption? | **Yes** |
| Export Compliance — qualifies for exemption? | **Yes** (standard HTTPS/TLS) |
| Export Compliance — result | **Exempt** |
| Content Rights — third-party content? | **No** |
| IDFA — advertising identifier? | **No** |

### 1.2 Submit for Review

Tryck **Submit for Review**. Status: `Waiting for Review` → `In Review` (24-48h).

### 1.3 Håll koll

- Aktivera ASC-appens push-notiser på telefon
- Bevaka email `connection.dts@gmail.com` för Apple-meddelanden
- Om reviewer ber om login-info: credentials redan i Notes (`+46701234567` / `123456`)

---

## Fas 2 — Approval-dagen

### 2.1 Innan release-knappen trycks

```bash
# Stäng av demo-reset (reviewers behöver den inte längre)
supabase secrets unset ALLOW_DEMO_RESET --project-ref jappgthiyedycwhttpcu

# Bekräfta Supabase tables är rena
# - `subscriptions`: inga kvar-liggande test-rader
# - `profiles`: reviewer-kontot kan ligga kvar
```

- [ ] PostHog EU — skapa "Launch day"-annotation på project 113869 timeline
- [ ] Kör waitlist dry-run (Fas 3.1 nedan) — kontrollera recipient-listan
- [ ] Verifiera Resend-domänen en sista gång
- [ ] Släck "Manually release" är fortfarande satt

### 2.2 Tryck release

ASC → Version 1.0 → **Release This Version**. Status flyttas till `Processing for App Store` → `Ready for Sale` (2-4h).

### 2.3 Första riktiga verifieringen

När `Ready for Sale`:

- [ ] Öppna App Store på din telefon → sök **MÄÄK** → installera från prod
- [ ] Phone OTP med riktigt nummer
- [ ] Komplett onboarding
- [ ] Köp Basic med riktigt Apple-ID (~69 kr — annullera via App Store efter verifiering)
- [ ] `subscriptions`-raden dyker upp i Supabase inom 30 sek (RevenueCat → webhook)
- [ ] Öppna PostHog dashboard — ska se installs + onboarding events strömma

---

## Fas 3 — Waitlist-mailet (timmar efter release)

**Kritiskt: ingen ångra-knapp.** Resend är transaktionellt.

### 3.1 Hämta secret

Supabase Dashboard → Edge Functions → Secrets → `WAITLIST_ADMIN_SECRET`:
https://supabase.com/dashboard/project/jappgthiyedycwhttpcu/functions/secrets

```bash
export WAITLIST_SECRET="<paste värde>"
```

### 3.2 Dry-run (säkerhetsövning — inget skickas)

```bash
curl -X POST https://jappgthiyedycwhttpcu.supabase.co/functions/v1/waitlist-notify \
  -H "Authorization: Bearer $WAITLIST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

Verifiera JSON-svaret:
- `total` — matchar förväntad lista
- `recipients` — inga test-adresser, inga dubbletter
- `subject` — copy ser bra ut

**Om något ser fel ut: stopp. Fixa listan i Supabase innan du går vidare.**

### 3.3 Skarpt skick

```bash
curl -X POST https://jappgthiyedycwhttpcu.supabase.co/functions/v1/waitlist-notify \
  -H "Authorization: Bearer $WAITLIST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

- Rate-limit: 7.7 mail/sek (håller sig under Resend free tier)
- 1000 personer ≈ 130 sek
- `sent` + `failed` + `skipped` ska summera till `total`

### 3.4 Felhantering

- Failures retry-as vid nästa körning (notified_at sätts bara vid success)
- Skippade = redan notified_at-satta (kör-igen-säker)
- Om många fails: kolla att Resend-domänen fortfarande är verified

### 3.5 Valfritt — egen subject/HTML

```bash
curl -X POST https://jappgthiyedycwhttpcu.supabase.co/functions/v1/waitlist-notify \
  -H "Authorization: Bearer $WAITLIST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "MÄÄK är nu live i App Store",
    "html": "<div style=\"...\">Egen HTML</div>"
  }'
```

---

## Fas 4 — Vecka 1 post-launch

### 4.1 Daglig övervakning (10 min/dag)

| System | Var | Vad att kolla |
|---|---|---|
| PostHog | https://eu.posthog.com/project/113869 | Installs, onboarding-funnel, paywall hits, errors |
| Supabase logs | Dashboard → Logs | Edge function failures, RLS denials, slow queries |
| RevenueCat | Dashboard | Subscription conversions, cancellations, webhook health |
| ASC | App Analytics | Impressions, product page views, conversion rate |
| Resend | Dashboard | Bounces, complaints |

### 4.2 Snabba polish-fixes (kan OTA:as eller in i nästa build)

| # | Task | Fil | Notes |
|---|---|---|---|
| 4.2.1 | **Revenue analytics** — lägg `$revenue` + `$currency` på paywall-eventen | PostHog-capture där `subscription_purchased` fires | 5 min, en fil. Krävs för riktig revenue-analytics i PostHog. Bundle med 4.2.2 eller OTA via expo-updates om konfigurerat. |
| 4.2.2 | **Profile-edit expansion** — utöka `profile.tsx` edit-läge med alla 16+ fält (pronouns, gender, height, sexuality, looking_for, hometown, work, education, religion, politics, alcohol, smoking, visibility toggles) | `apps/mobile/src/app/(tabs)/profile.tsx` | Återanvänd `SelectField` + `onboardingOptions.ts`. Grupperade sektioner: Grundläggande / Socialt / Bakgrund / Integritet. Räkna om `profile_completion` med samma logik som `OnboardingWizardRN.calculateCompletion()`. |
| 4.2.3 | **resolveProfilesAuthKey fix** — byt ut mot hårdkodat `"id"` (samma som onboarding-filerna) | `apps/mobile/src/app/(tabs)/profile.tsx` | Del av 4.2.2 |

Beslut: bundle 4.2.1 + 4.2.2 + 4.2.3 i en build v1.0.1 ca 1 vecka efter launch när vi har real-user-feedback.

### 4.3 Värdar (Host-programmet)

- [ ] Aktivera `host-eligibility-check` cron när ~50+ aktiva användare finns (behöver data att mäta mot)
- [ ] Första Värd-godkänt manuellt i Supabase Studio (`host_profiles` → approved)
- [ ] Manuell Värdbrev-process första månaderna — automatisera via Resend senare

### 4.4 ID-verifiering — skifte från auto-approve

- Just nu: `VERIFICATION_LAUNCH_AUTO_APPROVE=true` — selfies auto-approveras
- Integrera Onfido (eller alternativ) → flippa secret till `false`
- Webhook-handlern redan klar i `supabase/functions/id-verification-webhook/`

---

## Fas 5 — Backlog (efter vecka 1-2)

### Feature work
- Push-notiser för nya introduktioner + Träff-RSVPs
- Inbox-badge på profile-tab
- Real date/time-picker i `träffar/create.tsx`
- Värd kan editera befintlig Träff
- Värdmiddag + Värdbrev (manuell → automatiserad)

### Teknisk skuld
- Component extraction: `ProfileViewRN.tsx` (~840 rader), `OnboardingWizardRN.tsx` (~700 rader)
- Fas 6 Värdar-marketing (månatligt Värdbrev)
- TypeScript `strict: true` (för närvarande off i `tsconfig.app.json`)

### Landing
- /vardar/-undersida med full spec
- Responsive WebP-varianter (just nu en storlek)
- Sentry / error tracking (bara PostHog idag)
- Riktig OG-bild per sida

### Legal / compliance
- GDPR data-export-flöde testat (backend finns, UI saknas)
- GDPR data-radering-flöde testat
- Användarvillkor + integritetspolicy-versionering (log accept-datum)

---

## Riskregister

| # | Risk | Sannolikhet | Impact | Mitigering |
|---|---|---|---|---|
| R1 | Resend-domän inte verified → hela waitlist-mail failar | Låg (redan setup) | Hög | Dry-run + testa från dashboard dag 0 |
| R2 | RevenueCat webhook når inte Supabase → subscriptions inte syncade | Låg | Hög | Verifiera med första riktiga köpet |
| R3 | Reviewer kräver extra info → delay | Medium | Medium | Credentials redan i Notes, supportsTablet fixat |
| R4 | Phone OTP rate-limit hos Supabase vid trafikspik | Låg | Hög | Övervaka första 100 användare, be Supabase höja cap om nödvändigt |
| R5 | Demo-reset kvar aktiv i prod → säkerhetshål | Medium (glömbart) | Hög | Checklista-punkt Fas 2.1 |
| R6 | Crash i profile-tab från expo-video-diff → dålig recensions-risk | Låg (nu skyddad) | Medium | ErrorBoundary + LogBox-filter committat (85a46d4) |
| R7 | Supabase point-in-time recovery inte på → dataloss-risk | Okänt | Hög | **Verifiera innan launch** i Dashboard → Database → Backups |

---

## Snabb-kommandon

```bash
# Preflight
npm run launch:check

# Rebuild
cd apps/mobile && eas build --platform ios --profile expo-production

# Migrations-status
npx supabase migration list --linked

# Deploy en edge function
supabase functions deploy waitlist-notify

# Batch-deploy
for fn in match-daily waitlist-notify revenuecat-webhook storage-proxy; do
  supabase functions deploy $fn
done

# Post-approval städ
supabase secrets unset ALLOW_DEMO_RESET --project-ref jappgthiyedycwhttpcu

# Waitlist (se Fas 3)
export WAITLIST_SECRET="<hämta från Dashboard>"
curl -X POST https://jappgthiyedycwhttpcu.supabase.co/functions/v1/waitlist-notify \
  -H "Authorization: Bearer $WAITLIST_SECRET" -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

---

## Externa system — snabbreferens

| System | URL / ID | Anteckning |
|---|---|---|
| Supabase | `jappgthiyedycwhttpcu` (West EU / Ireland) | [Dashboard](https://supabase.com/dashboard/project/jappgthiyedycwhttpcu) |
| PostHog | project `113869` (EU) | [Dashboard](https://eu.posthog.com/project/113869) |
| RevenueCat | iOS bundle `com.samuelsenhet.maak` | Public key i `EXPO_PUBLIC_REVENUECAT_IOS_KEY` |
| Landing | https://maakapp.se | Loopia webhotell, FTP `ftpcluster.loopia.se` → `/maakapp.se/public_html/` |
| ASC | MÄÄK app | Apple ID `connection.dts@gmail.com` |
| EAS | `apps/mobile/` projektet | `eas build --profile expo-production` |

---

## Definition of "launched"

Appen är "launched" när **alla dessa** är sanna:

- [ ] ASC status = `Ready for Sale`
- [ ] App sökbar i App Store på svensk region
- [ ] Första riktiga köp har genererat `subscriptions`-rad via RevenueCat webhook
- [ ] PostHog tar emot events från prod-installationer
- [ ] Waitlist-mail skickat (dry-run + skarpt)
- [ ] `ALLOW_DEMO_RESET` secret är unsetad
- [ ] Inga error-spikes senaste timmen i Supabase edge function logs
