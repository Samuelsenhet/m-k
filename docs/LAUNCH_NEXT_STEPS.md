# MÄÄK — nästa steg från där vi är nu

> Skriven: 2026-04-12 natten före submit. Använd denna om sessionen behöver startas om.

## Var vi är nu

App Store Connect är i princip helt ifyllt:

- ✅ App Privacy (nutrition label) — publicerad, 11 YES-kategorier
- ✅ App Information — Trader, DAC7, Category, Age 17+, Content Rights
- ✅ Legal Entity + Paid Apps Agreement — processing
- ✅ Bank Account + W-8BEN skattefilled
- ✅ Version 1.0 metadata — Description, Keywords, Support/Marketing URLs, Notes, Manually release
- ✅ Build 83 uploaded
- ✅ IAP: `maak_basic_weekly` + `maak_premium_monthly` listade
- ✅ Sign-in credentials (`+46701234567` / `123456`) + Supabase test OTP konfigurerad till 2026-12-31
- ✅ iPhone 6.9" screenshots (8 st, letterboxade från 6.5" → 1320×2868)
- ✅ English (U.S.) localization raderad — enbart Swedish kvar

## 🔴 Kritisk blocker kvar

### iPad 13-inch screenshots krävs
Build 83 byggdes INNAN vi satte `supportsTablet: false` i `app.config.cjs`, så binären deklarerar fortfarande iPad-stöd. Apple kräver därför iPad-screenshots för 13-tum.

**Två vägar:**

**A. Rebuild mobilen (rekommenderat — rent)**
```bash
cd apps/mobile
eas build --platform ios --profile expo-production
```
- Cirka 20–30 min på EAS remote
- Nytt build number (84 eller högre)
- iPad-tabben försvinner helt efter att det nya bygget är selected i ASC
- Efter bygget: gå till Version 1.0 → Build → välj nya bygget istället för 83

**B. Letterbox-screenshots (snabbt men fult)**
Scripta fram padded 2064×2752-versioner från de 8 iphone-69-v2-filerna med `#F2F0EF` bakgrund. Fillor 398px bars på båda sidor. Legalt men ingen skönhet.

**Min rek: A.** Priset är 30 min och vi slipper iPad-artefakter i reviewers händer.

## Efter iPad-fixet

1. **Save** Version 1.0-sidan
2. **Add for Review** — wizard startar
3. Svara på wizard-frågorna:
   - **Export Compliance:** Yes encryption → Yes exemption (standard HTTPS/TLS, ingen egen kryptoalgoritm) → Exempt
   - **Content Rights:** No third-party content
   - **IDFA:** No (vi kör inga annonser)
4. Klicka **Submit for Review**
5. Status flyttas: `Prepare for Submission` → `Waiting for Review` → `In Review` → `Pending Developer Release`

Review-tid: normalt 24–48h för första submission.

## När appen är godkänd (post-approval)

- [ ] Öppna App Store på din telefon → sök MÄÄK → installera från riktig store
- [ ] Verifiera phone OTP med riktigt nummer
- [ ] Kör en komplett onboarding (personlighetstest → första matchning)
- [ ] Köp Basic via sandbox → bekräfta att `subscriptions`-raden dyker upp i Supabase via RevenueCat webhook
- [ ] **`supabase secrets unset ALLOW_DEMO_RESET`** — stäng av demo-reset nu när reviewer inte behöver det längre
- [ ] Öppna [PostHog EU dashboard](https://eu.posthog.com/project/113869) — verifiera att alla 17 mobile-events strömmar in
- [ ] Lägg till en "Launch day"-annotation på PostHog-timelinen
- [ ] Verifiera landing-sidan en sista gång: https://maakapp.se/
- [ ] Släpp appen manuellt via "Release This Version" i ASC (du valde Manually release)

## Kvarvarande deferred work (post-launch)

### Värdar-programmet
- Fas 5: `host-eligibility-check` cron edge function — vänta tills vi har organisk data att mäta mot
- Manual Värd-approval UI (just nu kör vi direkt i Supabase Studio)
- Riktig date/time-picker i `träffar/create.tsx` istället för text-input
- Värd kan editera befintlig Träff
- Push-notiser för nya introduktioner + Träff-RSVPs
- Inbox-badge på profile-tabben
- Värdmiddag + Värdbrev (manuell process först, automatisera sen)

### ID-verifiering
- Just nu kör vi `VERIFICATION_LAUNCH_AUTO_APPROVE=true` — selfies auto-approveras för att inte blockera onboarding
- Post-launch: integrera riktig provider (Onfido rekommenderat) → flippa secreten till `false`
- Webhook-handlern finns redan i `supabase/functions/id-verification-webhook/`

### Waitlist-sida
- På /maakapp.se/vanta/ eller liknande
- Enkelt email-capture → Supabase-tabell
- Används för pre-launch eller om appen blir tillfälligt unavailable

### Landing-förbättringar
- Branded 404-sida finns redan ✓
- Riktig OG-bild per sida (just nu en för hela sajten)
- Sentry / error tracking (just nu bara PostHog)
- Responsive WebP-varianter (just nu bara 1 storlek)
- /vardar/-undersida med full spec (just nu är Värdar en sektion på /)

### Övriga refactors
- Component extraction av längre mobila skärmar (ProfileViewRN.tsx 790 rader, OnboardingWizardRN.tsx 704 rader)
- Fas 6 Värdar-marketing — månatligt Värdbrev via Resend eller liknande

## Snabb-kommandon

```bash
# Verifiera launch-checken passerar
npm run launch:check

# Rebuild mobile för att fixa iPad-frågan
cd apps/mobile && eas build --platform ios --profile expo-production

# Testa edge functions live
curl -sX POST "https://jappgthiyedycwhttpcu.supabase.co/functions/v1/traff-rsvp" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"träff_id":"<uuid>"}'

# Supabase migration status
npx supabase migration list --linked

# Deploy alla edge functions igen om något krävs
for fn in traff-rsvp introduction-create introduction-respond; do
  supabase functions deploy $fn
done

# Efter launch — stäng av demo reset
supabase secrets unset ALLOW_DEMO_RESET --project-ref jappgthiyedycwhttpcu
```

## Key files att minnas

- `docs/LAUNCH_CHECKLIST.md` — full pre-ship playbook
- `docs/VARDAR.md` — Värdar-feature spec
- `CLAUDE.md` — repo conventions + landing deployment
- `scripts/launch-check.mjs` — automated preflight
- `app.config.cjs` — infoPlist + privacyManifests + RevenueCat guard + supportsTablet: false (för nästa build)
- `supabase/migrations/20260411180000_vardar_foundations.sql` — host_profiles, träffar, etc (applied)
- `supabase/migrations/20260411190000_age_gate_enforcement.sql` — 20+ CHECK constraint (applied)

## Verifierade externa system

- Supabase project: `jappgthiyedycwhttpcu` (MÄÄK, West EU / Ireland)
- PostHog project: `113869` (EU, `eu.i.posthog.com`)
- RevenueCat: appl_* iOS public SDK key rotated denna session, secret keys raderade
- Loopia webhotell: `maakapp.se` — landing aktivt med full SEO + PostHog CDN-snippet + cache headers
- Cyberduck FTP: `ftpcluster.loopia.se` → `/maakapp.se/public_html/`
