# MÄÄK — Launch Plan

> Skriven: 2026-04-18. Ersätter/kompletterar `LAUNCH_NEXT_STEPS.md` från 2026-04-12.
> Status (2026-04-23): **build 80 submittad för review** kl 07:24 — submission ID `c9ba1007-4644-48ae-ae68-d27eb5e8475b`, status `Waiting for Review`. Build-linje: 75 (rejected) → 77 (RLS/personality-test/onboarding fixes) → 79 (response till Apple) → **80** (final submit efter matches-tab + tap-zone + phone-auth fixes). Review notes från `docs/APPLE_RESPONSE_2026-04-21.md` inklistrade i Resolution Center. Privacy-labels satta till "Data Not Used to Track You", "Manually release"-flagga satt. Nästa: bevaka ASC + mail för Apple-svar (~24–48h). Vid approval → Fas 2 (release) → Fas 3 (waitlist). Vid rejection → `hotfix/reviewer-feedback`-worktree.
>
> Status (2026-04-25): build 80 fortfarande `Waiting for Review` ~48h efter submit, ingen rörelse i ASC eller mailbox. Övre kanten av Apples typiska 24-48h-fönster — review kan dröja ytterligare 1-3 dagar utan att indikera problem. Post-submit har `9e3a4e0` (emoji-fallback iOS) landat i main men **ej i build 80** — flyttas till nästa rebuild. Landing-redesignen `2c93727` är **deployad till Loopia** och live på maakapp.se.
>
> Status (2026-04-26): emoji-fixen `9e3a4e0` (System-font) + ocommittat tillägg i `apps/mobile/src/components/Emoji.tsx` (VS16-strip via `replace(/️/g, "")`) **verifierat otillräcklig**. Buggen reproducerar fortfarande på fysisk **iOS 17**-enhet och i iOS 26.3-simulator — affekterade emojis inkluderar både VS16-glyfer (🏗️ 🛡️ 🕊️ ⚔️ 🏛️ i profil-modalen) och icke-VS16 (💬 🙅 i landing-skärmens preview-kort). Root cause är **inte** parent-fontFamily-inheritance som ursprungligen antaget — fontFamily-System-fixen påverkar inte rendering där `<Emoji>` redan ligger i `<View>`-föräldrar. Beslut: emoji-buggen **inte launch-blocker**, listas som känd kosmetisk regression. Plan B (bundled SVG-ikoner för 16 arketyper + 4 kategorier i `packages/core/src/personality.ts`) deferred till post-launch — se 4.2.4 nedan.

## TL;DR — kritisk väg

1. ✅ EAS rebuild → build 80 vald i ASC → iPad-tabben borta
2. ✅ TestFlight-sanity på riktig iPhone (verifierad före submit)
3. ✅ Submit wizard → Submit for Review (2026-04-23 07:24, `Waiting for Review`)
4. **Vänta på Apple-svar** — typiskt 24-48h, men kan ta 3-5 dagar utan att signalera problem. Vid rejection → `hotfix/reviewer-feedback`-worktree. Vid stillestånd >5 dagar → använd `Contact Us` i ASC (kolla också spam för "missing metadata"-mail)
5. Vid approval: stäng av demo-reset, dry-run waitlist, release
6. Skarpt waitlist-mail
7. Vecka 1: övervaka PostHog + RevenueCat + Supabase logs

Allt annat är deferred.

---

## Worktree-map — vem gör vad parallellt

Sedan 2026-04-19 finns fyra worktrees utcheckade (`git worktree list`):

| Worktree | Path | Branch | Ansvar |
|---|---|---|---|
| **main** | `../m-k` | `main` | Launch-kritiska steg — Fas 0 (pre-submit), Fas 1 (submit), Fas 2 (approval), Fas 3 (waitlist). Inga andra ändringar tills `Ready for Sale`. |
| **v1.0.1** | `../m-k-v1.0.1` | `post-launch/v1.0.1-polish` | ~~Fas 4.2 polish-bundle~~ **redan landad i main före submit** (`9e6af45` + `f76db0d` + `e80b504`, i build 80). Worktree tom — kan avvecklas eller återanvändas för nästa våg fixes. |
| **hotfix** | `../m-k-hotfix` | `hotfix/reviewer-feedback` | Reserverad för reviewer-förfrågningar eller krasch upptäckt post-submit. Tom tills behov uppstår. Branchar från `main` så hotfix kan pushas snabbt utan att dra in v1.0.1-jobbet. |
| **develop** | `../m-k-develop` | `develop` | Staging per `CONTRIBUTING.md`. Fas 5-backlog (push-notiser, inbox-badge, Träffar-editing, Värdmiddag, coming-soon-screen etc.) börjar här och PR:as till `main` via `develop`. |

### Detaljerad uppdragsfördelning

| Fas / uppdrag | Worktree | Notis |
|---|---|---|
| 0.1 Git-workspace ✅ | main | klart |
| 0.2 EAS rebuild ✅ | main | build-linje 77→79→80 |
| 0.3 Välj nya bygget i ASC ✅ | main | build 80 vald 2026-04-23 |
| 0.4 TestFlight-sanity ✅ | main | verifierad på iPhone före submit |
| 0.5 `npm run launch:check` ✅ | main | PASS 2026-04-19 |
| 0.6 Externa system verify ✅ | main | submit hade failat annars |
| 0.7 Manually-release-flaggan ✅ | main | ASC-toggle satt |
| 1.1–1.3 Submit wizard ✅ | main | 2026-04-23 07:24, `Waiting for Review` |
| 2.1–2.3 Approval / release | main | launch-dagen |
| 3.1–3.5 Waitlist-mail | main | timmar efter release |
| 4.1 Daglig övervakning | main | monitoring, ingen kod |
| 4.2.1 Revenue analytics (`$revenue`/`$currency`) ✅ | main | landade i build 80 (`9e6af45`) |
| 4.2.2 Profile-edit expansion (16+ fält) ✅ | main | landade i build 80 (`f76db0d`) |
| 4.2.3 `resolveProfilesAuthKey` → hårdkoda `"id"` ✅ | main | landade i build 80 (`e80b504`) |
| 4.3 Värd-eligibility cron + första Värd-godkänt | **v1.0.1** eller develop | vänta tills ~50 aktiva användare |
| 4.4 Onfido-integration + flip `VERIFICATION_LAUNCH_AUTO_APPROVE=false` | **develop** | feature-branch post-launch |
| 5. Push-notiser för intros/RSVPs | **develop** | Fas 5 backlog |
| 5. Inbox-badge på profile-tab | **develop** | Fas 5 backlog |
| 5. Date/time-picker i `traffar/create.tsx` | **develop** | Fas 5 backlog |
| 5. Värd editerar Träff | **develop** | Fas 5 backlog |
| 5. Värdmiddag + Värdbrev | **develop** | Fas 5 backlog |
| 5. Component extraction (ProfileViewRN, OnboardingWizardRN) | **develop** | teknisk skuld |
| 5. TypeScript `strict: true` | **develop** | teknisk skuld |
| 5. Landing /vardar/, responsive WebP, Sentry | **develop** | landing-backlog |
| 5. GDPR data-export/radering-UI | **develop** | legal/compliance |
| Reviewer bug / krasch post-submit | **hotfix** | reserverad |
| Coming-soon / "Nästa feature"-screen (ProfileSettingsSheet-row + `/coming-soon` route) | **develop** | ny feature från 2026-04-19-diskussion |

### Branchrouting

```
develop (staging) ──► main (prod)
  │
  └─ v1.0.1 polish merge:   post-launch/v1.0.1-polish ──► develop ──► main
  └─ Fas 5 features:         feature/* ──► develop ──► main
  └─ reviewer hotfix:        hotfix/reviewer-feedback ──► main (direct) + cherry-pick till develop
```

Håll worktrees rena (`git status` tom) innan du byter fokus — annars kan `git worktree remove` vägra.

---

## Fas 0 — Innan submit (blockers)

### 0.1 Städa git-workspacen ✅ (klar)

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

### 0.2 EAS rebuild för iPad-fix ✅ (klar — build 80)

Build 83 har **inte** `supportsTablet: false` eller `telephony`-capability i Info.plist. Rebuild krävs för att flaggorna ska nå binär.

```bash
cd apps/mobile
eas build --platform ios --profile expo-production
```

- 20-30 min remote
- Slutbygge: build 80 (efter linjen 77→79→80)
- Inkluderar dagens fixes: expo-video safety i Expo Go, profile hero polish (commit `85a46d4`)

### 0.3 Välj nya bygget i ASC ✅ (klar 2026-04-19)

1. App Store Connect → My Apps → MÄÄK → Version 1.0
2. Build-sektionen → 83 ersatt med 80
3. **Spara** → iPad-screenshots-tabben ska försvinna

### 0.4 TestFlight-sanity på riktig iPhone ✅ (klar)

Verifierad på iPhone före submit av build 80. Happy path nedan kördes igenom:

- [ ] Phone OTP med riktigt nummer
- [ ] Onboarding: personality test + foto-upload (video också om möjligt)
- [ ] Matchning: vänta in daily match → chat
- [ ] Paywall: öppna från profile → inga krascher
- [ ] Sub-köp via sandbox: `subscriptions`-rad dyker upp i Supabase
- [ ] Chat: skicka text, skicka media
- [ ] Profile edit: spara ändringar → syns efter reload
- [ ] ID-verifiering: selfie-flöde (auto-approve i dev)
- [ ] Sign out → sign in igen

### 0.5 Preflight-check ✅ (klar 2026-04-19)

```bash
npm run launch:check
```

PASS 2026-04-19.

### 0.6 Externa system — verifiera ✅ (klar 2026-04-23)

- [x] **Resend**: domänen `maakapp.se` = **Verified** på https://resend.com/domains (Ireland eu-west-1, 11 dagar). Dry-run av `waitlist-notify` körde också utan 503 → `RESEND_API_KEY` läsbar från edge fn.
- [x] **RevenueCat edge function**: `revenuecat-webhook` ACTIVE (version 36 per `supabase functions list` 2026-04-23). ⚠️ **Ingen real paid purchase har någonsin processats** (alla 3 rader i `subscriptions` är `plan_type: "free"`). Paid-flow blir först bekräftad via sandbox-köp i Fas 2.3.
- [x] **RevenueCat ASC-side**: webhook "Supabase Subscription Sync" konfigurerad, URL = `https://jappgthiyedycwhttpcu.supabase.co/functions/v1/revenuecat-webhook`, environment = Both Production and Sandbox, auth-header satt. iOS subscriptions `maak_basic_weekly` + `maak_premium_monthly` båda i **In Review** (följer app-review). Localization "MÄÄK Membership" (Swedish) står som `Prepare for Submission`, men dess "Submit for Review"-knapp är disabled — bundle med subscription+app-review, inget separat steg krävs.
- [x] **Supabase edge functions deployed** (verifierad 2026-04-23): `match-daily` v92, `ai-assistant` v52, `generate-icebreakers` v52, `send-notification` v50, `revenuecat-webhook` v36, `waitlist-notify` v28, `storage-proxy` v5, `id-verification-webhook` v49, `moderate-verification` v8 — alla ACTIVE.
- [x] **Landing**: https://maakapp.se/ laddar. OG-tags verifierade 2026-04-23 — title, description, `sv_SE`, `summary_large_image`, og:image 1200x630 PNG (156KB, cache-busted). `/opengraph-image` returnerar HTTP 200 + `content-type: image/png` (Loopia ForceType-fixen håller).

### 0.7 Verifiera "Manuellt released"-flagga ✅ (klar)

ASC → Version 1.0 → Version Release → **Manually release this version**. Annars släpps appen direkt vid approval (innan vi hunnit förbereda waitlist).

---

## Fas 1 — Submit (dag 0) ✅ (klar 2026-04-23)

> Build 80 submittad kl 07:24 — submission ID `c9ba1007-4644-48ae-ae68-d27eb5e8475b`. Status: **Waiting for Review**. Review notes från `docs/APPLE_RESPONSE_2026-04-21.md` inklistrade i Resolution Center.

### 1.1 Add for Review wizard ✅

Svar som angavs:

| Fråga | Svar |
|---|---|
| Export Compliance — contains encryption? | **Yes** |
| Export Compliance — qualifies for exemption? | **Yes** (standard HTTPS/TLS) |
| Export Compliance — result | **Exempt** |
| Content Rights — third-party content? | **No** |
| IDFA — advertising identifier? | **No** |

### 1.2 Submit for Review ✅

Klickat 2026-04-23 07:24. Status: `Waiting for Review` → `In Review` (24-48h).

### 1.3 Håll koll — **pågår**

- Aktivera ASC-appens push-notiser på telefon
- Bevaka email `connection.dts@gmail.com` för Apple-meddelanden
- Om reviewer ber om login-info: credentials redan i Notes (`+46701234567` / `123456`)

---

## Post-submit-arbete i main (mellan 2026-04-23 och 2026-04-25)

Commits som landat **efter** build 80 submittades — finns i `main` men **inte i binären Apple reviewar**. Vid approval flyttas mobile-relevanta items till nästa rebuild (1.0.1); vid rejection paketeras de med hotfixen.

| Commit | Vad | Status | Vart |
|---|---|---|---|
| `9e3a4e0` | Emoji-fallback iOS i `apps/mobile/src/components/Emoji.tsx` | I main, **ej i build 80**, **verifierat otillräcklig 2026-04-26** | Behåll i koden (skadar inte) men lös root cause separat — se 4.2.4 |
| `2c93727` | Landing-redesign (nya porträtt + "Matchas → Chatta → Träffas") | **Deployad till Loopia** | Live på maakapp.se |
| `cda1c64` | Pruning av stale pre-launch-checklists | Docs only | — |
| `cda99e2` | tsconfig.json-doc-fix i CLAUDE.md | Docs only | — |
| `9b89ce1` | `const poolError`-lint-fix i match-daily | Edge-fn, redan deployad | match-daily v92 |
| `470d0fc` | Supabase types regen (ai_usage) | Type-only | — |
| `838ca3a` | Tog bort `create-video-session` edge fn (oanvänd) | Edge-fn-cleanup | Verifiera att den inte finns deployad i prod |
| `a3f9ae2`, `0bd6f5b`, `5fb463d` | Shadcn / orphan-snapshot / m-k-backup-städning | Cleanup | — |

**Notera:** `9e3a4e0` är den enda mobile-koden som behöver ny binär. Övriga rader är antingen docs, edge-fn (redan i prod) eller landing (redan på Loopia).

---

## Ytterligare landed scope i build 80 (utöver original-planen)

Arbete som tillkom mellan 2026-04-18 och submit och som **inte** nämns i Fas 0-sektionerna ovan, men är i build 80:

| Commit | Vad |
|---|---|
| `49eda2d` | Hårt `+46`-gate i `twilio-send-otp` edge fn (Swedish-only vid launch) |
| `e72cbf7` | Account `delete` ersatt med `deactivate` + 90-day auto-purge (GDPR-vänligt) |
| `9e0824f` | `expo-updates` auto-check av → förhindrar `ErrorRecovery`-krasch vid app-start |
| `99866b2` | `expo-notifications` Expo Go-skip + dep-bump + matches-conflict fix |
| `12a824a` | Admin-selfie-reviewer + `moderate-verification` edge fn |
| `2c77ec8` | Reviewer-bypass bakom `APP_REVIEW_BYPASS_ENABLED` (stänger pool-gap) |
| `c44232c` | On-demand pool-gen + "Preparing"-UX (fallback när daily matches saknas) |
| `b0217cb` | Tap-zone overlap på profile screens + phone-auth race |
| `8694da6` | UI-polish över onboarding, verification, support |

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

- [ ] PostHog EU — skapa "Launch day"-annotation på project 113869 timeline (gör **när du trycker Release**, inte i förväg, annars blir tidsstämpeln fel). Content: `Launch day — MÄÄK 1.0 (80) Ready for Sale`. Scope: Organization.
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

### 3.2 Dry-run ✅ körd 2026-04-23 — pipelinen fungerar

```bash
curl -X POST https://jappgthiyedycwhttpcu.supabase.co/functions/v1/waitlist-notify \
  -H "Authorization: Bearer $WAITLIST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

**Resultat 2026-04-23**: `{ total: 1, recipients: ["samueel.pierre@hotmail.com"], subject: "MÄÄK finns nu i App Store 🎉" }`. Test-raden raderad direkt efter — tabellen är nu tom. Secret roterad.

⚠️ **0 riktiga signups i waitlist**: skarpt skick (Fas 3.3) på launch-dagen kommer inte nå någon om inte signup-drive sker under väntan. Se Riskregister R8.

På launch-dagen, kör dry-run igen (samma curl) och verifiera:
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

### 4.2 Snabba polish-fixes — ✅ redan landade i build 80

| # | Task | Commit | Status |
|---|---|---|---|
| 4.2.1 | **Revenue analytics** — `$revenue` + `$currency` på paywall-eventen | `9e6af45` | ✅ i build 80 |
| 4.2.2 | **Profile-edit expansion** — alla 16+ fält (pronouns, gender, height, sexuality, looking_for, hometown, work, education, religion, politics, alcohol, smoking, visibility toggles) | `f76db0d` | ✅ i build 80 |
| 4.2.3 | **resolveProfilesAuthKey fix** — byt ut mot hårdkodat `"id"` | `e80b504` | ✅ i build 80 |

**Status 2026-04-23**: alla tre ursprungliga v1.0.1-polish-items landade i main före submit — inte deferred. Inga v1.0.1-items kvarstår. `post-launch/v1.0.1-polish`-worktreen kan avvecklas eller återanvändas.

**Status 2026-04-25**: en ny v1.0.1-kandidat har landat i main efter submit:

| # | Task | Commit | Status |
|---|---|---|---|
| 4.2.4 | **Emoji-rendering iOS** — bundled SVG/PNG-ikoner ersätter native emojis i `packages/core/src/personality.ts` (16 arketyper + 4 kategorier) | TBD | ❌ **deferred till post-launch v1.1** — `9e3a4e0` (System-font) + VS16-strip i `Emoji.tsx` verifierat otillräckligt 2026-04-26 på iOS 17-enhet |

**Bakgrund 4.2.4** (2026-04-26): `9e3a4e0` antog att root cause var `<Text>` som ärver fontFamily (Playfair/DM Sans) från förälder och därmed tappar Apple Color Emoji-fallbacken. Test på fysisk iOS 17 + iOS 26.3-sim visade att fixen **inte räcker** — buggen reproducerar även där `<Emoji>` ligger direkt under `<View>` (ingen Text-inheritance). Affekterade emojis inkluderar icke-VS16 (💬 U+1F4AC, 🙅 U+1F645 i landing-skärmens preview-cirklar), så VS16-strippningen löser inte heller hela ytan. Slutsats: native emoji-rendering via `<Text>` är inte pålitlig på vår RN/iOS-kombination, lösningen är att äga glyferna själv.

**Plan v1.1**:
1. Ersätt `emoji: string` i `ARCHETYPE_INFO` och `CATEGORY_INFO` (`packages/core/src/personality.ts`) med ikon-asset-referenser
2. Skapa 20 SVG-ikoner (16 arketyper + 4 kategorier) i brand-stil — kan startas parallellt med Apple-review
3. Byt ut `<Emoji>{info.emoji}</Emoji>` → `<Image source={info.icon}>` i konsumenter (`ProfileDetailsModal`, `ProfileViewRN`, `MatchProfileScreen`, `PersonalityGuideRN`, `OnboardingWizardRN/PersonalityResultRN`, `WelcomeScreenRN`)
4. UI-emojis i `landing.tsx` (💬 🙅) kan stanna native — dekorativa preview-element, drabbar inte produktionsanvändare på utgivna iOS-versioner
5. `<Emoji>`-wrappern och `9e3a4e0`/VS16-stripen kan tas bort när alla data-emojis migrerats — eller behållas för framtida edge-cases

**Beslut 2026-04-26**: emoji-buggen är **inte launch-blocker** (kosmetisk, ingen funktionell påverkan, drabbar bara personlighetssektionen och landing-preview). Behåll `9e3a4e0` + VS16-strip i koden så att eventuella iOS-versioner där fixen *gör* nytta täcks; jaga inte vidare innan launch.

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
| ~~R1~~ | ~~Resend-domän inte verified → hela waitlist-mail failar~~ | — | — | ✅ **Stängd 2026-04-23**: `maakapp.se` = Verified på Resend, dry-run verified. |
| R2 | RevenueCat webhook paid-flow otestad → första köp kan failsync | Medium | Hög | Edge fn deployed men alla existerande rader är `plan_type: "free"`. Sandbox-köp i Fas 2.3 är första realtestet — om det failar måste launch-dagen pausa tills webhook-loggen är ren. |
| R3 | Reviewer kräver extra info → delay | Medium | Medium | Credentials redan i Notes, supportsTablet fixat |
| R4 | Phone OTP rate-limit hos Supabase vid trafikspik | Låg | Hög | Övervaka första 100 användare, be Supabase höja cap om nödvändigt |
| R5 | Demo-reset kvar aktiv i prod → säkerhetshål | Medium (glömbart) | Hög | Checklista-punkt Fas 2.1 |
| R6 | Crash i profile-tab från expo-video-diff → dålig recensions-risk | Låg (nu skyddad) | Medium | ErrorBoundary + LogBox-filter committat (85a46d4) |
| R7 | Supabase point-in-time recovery inte på → dataloss-risk | **Bekräftad 2026-04-26** | Hög | **Verifierat 2026-04-26 22:50 via Management API** (`GET /v1/projects/jappgthiyedycwhttpcu/database/backups`): `pitr_enabled: false`, `walg_enabled: true`, `region: eu-west-1`, 8 dagliga physical backups (senaste `2026-04-26 09:42 UTC`). Org `Samuelsenhet's Org` är på `pro`-plan, så PITR-add-on är direkt aktiverbar. **Action innan Apple approverar Build 80**: Dashboard → Project Settings → Add-ons → *Point in Time Recovery* → 7-day retention (~$100/mån). Re-verify samma curl efter ~5–15 min → `pitr_enabled: true` innan Release-knappen i ASC. |
| R8 | Waitlist tom på launch-dagen → mailet når 0 personer | **Hög (bekräftad 2026-04-23)** | Medium | **Beslut 2026-04-23**: avvaktar signup-drive tills Apple approverar. När notisen kommer: bestäm om drive körs i fönstret mellan approval och `Ready for Sale` (2-4h), eller accepteras som 0 recipients. Pipeline är klar att köra när beslut tas. |
| R9 | Apple-review tar >5 dagar utan rörelse → osäkerhet om något fastnat | Låg | Medium | Vid 2026-04-25 har vi ~48h utan rörelse (normalt). Om >5 dagar: (a) `Contact Us`-flow i ASC, (b) kolla spam för "missing metadata"-mail, (c) verifiera att `APP_REVIEW_BYPASS_ENABLED` + reviewer-credentials fortfarande funkar. |

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
