# MÄÄK — App Store launch checklist

> Last updated: 2026-04-11 · Target: first submission to App Store Connect

This is the complete pre-ship list. Work through it top-to-bottom the week
before submission. Check each box as you go.

Automated pre-flight:

```bash
npm run launch:check
```

This script validates env vars, RevenueCat key prefix, PostHog config,
git state, required migrations, and runs the web build. It's the last
thing to run before `eas build`.

---

## 0 · Accounts and credentials (do once, keep current)

- [ ] Apple Developer Program membership is active (expires annually)
- [ ] App Store Connect account has the MÄÄK app created with the bundle
      id `com.samuelsenhet.maak`
- [ ] Expo / EAS account is logged in (`eas whoami`)
- [ ] EAS project id `4d900a70-4327-4740-83cc-4ac6745ef8eb` is linked
      (see `app.config.cjs`)
- [ ] Supabase project id is captured in env — the app runs against
      `jappgthiyedycwhttpcu.supabase.co`
- [ ] RevenueCat account has a **live** iOS public SDK key
      (`appl_...` — NOT `sk_`, NOT `test_`)
- [ ] PostHog EU project exists with at least one iOS-flagged event

---

## 1 · Secrets and env vars

### 1.1 Rotate out server-secret leaks

🔴 **Before anything else:** check if `apps/mobile/.env` has
`EXPO_PUBLIC_REVENUECAT_IOS_KEY="sk_..."`. A secret (`sk_`) key in the
mobile app is a full-access REST credential that ships with every ipa.

- [ ] Rotate the `sk_` RevenueCat iOS key in the RevenueCat dashboard
- [ ] Rotate the `sk_` RevenueCat Android key (same thing, just Android)
- [ ] Get the public iOS SDK key (`appl_...`) from:
      Dashboard → Project Settings → API keys → iOS → Public app-specific
      API keys → Create new → copy
- [ ] Replace `EXPO_PUBLIC_REVENUECAT_IOS_KEY` in `apps/mobile/.env` with
      the new `appl_` key
- [ ] `app.config.cjs` has a hard guard: it throws on any `sk_` value in
      any build, so you cannot ship by accident once rotated

### 1.2 Production env vars via EAS

Production builds run on EAS remote infrastructure. Local `.env` is only
read during prebuild — for the actual `eas build --profile expo-production`
the variables need to be in the EAS environment.

- [ ] Verify what's currently set:
      ```
      eas env:list --environment production
      ```
- [ ] If missing, create them:
      ```
      eas env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY \
        --value "appl_YOUR_LIVE_KEY" --environment production --scope project

      eas env:create --name POSTHOG_PROJECT_TOKEN \
        --value "phc_..." --environment production --scope project

      eas env:create --name POSTHOG_HOST \
        --value "https://eu.i.posthog.com" --environment production --scope project
      ```
- [ ] Double-check no sensitive key is set as `--visibility plaintext` if
      it should be `sensitive` or `secret`

### 1.3 Supabase edge function secrets

Secrets used by edge functions live in a separate bucket. Set them once:

- [ ] `supabase secrets list --project-ref jappgthiyedycwhttpcu`
- [ ] Required secrets (add any that are missing):
      - `REVENUECAT_WEBHOOK_AUTH` — shared secret for the RC webhook
      - `VERIFICATION_LAUNCH_AUTO_APPROVE=true` — until Onfido is wired up,
        this keeps selfie verification working in launch mode
      - `ALLOW_DEMO_RESET` — **leave UNSET** unless you're actively in an
        App Store review window

---

## 2 · Database

### 2.1 Migrations to apply

Two new migrations were added in this session. They are **not yet**
applied to production — check before pushing:

- [ ] `supabase/migrations/20260411180000_vardar_foundations.sql`
      Creates empty host_profiles / träffar / träff_rsvps / introductions
      tables. Pure additive, zero risk.
- [ ] `supabase/migrations/20260411190000_age_gate_enforcement.sql`
      Adds `CHECK (age ≥ 20)` to profiles.date_of_birth. Will fail loudly
      if any existing row is underage — that failure is the audit.

### 2.2 Pre-push safety check (age gate)

Run this before `supabase db push` to confirm no existing rows are
underage:

```bash
psql "$SUPABASE_DB_URL" -c "
  select count(*) as underage_rows
  from profiles
  where date_of_birth is not null
    and date_of_birth > (current_date - interval '20 years' + interval '1 day')::date;
"
```

Expected: `underage_rows = 0`. If not zero, fix those rows in the admin
UI first — do not skip the constraint.

### 2.3 Apply migrations

- [ ] `npx supabase db push`
- [ ] `npx supabase gen types typescript --project-id "$VITE_SUPABASE_PROJECT_ID" > src/integrations/supabase/types.ts`
- [ ] Run `git diff src/integrations/supabase/types.ts` and spot-check
      that the new table types appeared
- [ ] Commit the regenerated types

### 2.4 Edge functions deployed

- [ ] `supabase functions deploy revenuecat-webhook --no-verify-jwt`
- [ ] `supabase functions deploy match-daily`
- [ ] Confirm the rest of `supabase/functions/` is deployed via the
      existing script (`npm run edge:align-and-deploy`)

---

## 3 · Mobile binary

### 3.1 Version numbers

- [ ] `apps/mobile/app.json` and `app.config.cjs` agree on version
      (currently `1.0.0`)
- [ ] Build number in EAS is one higher than the last submitted build
      (`eas build:version:get --platform ios`)

### 3.2 Run the launch checker

- [ ] `npm run launch:check` → must exit with green PASS

### 3.3 Verify native permissions

Skim `app.config.cjs` `infoPlist` — every `NS*UsageDescription` the app
actually needs must have Swedish copy:

- [ ] `NSCameraUsageDescription` (Kemi-Check video + profile photo capture)
- [ ] `NSMicrophoneUsageDescription` (Kemi-Check audio)
- [ ] `NSPhotoLibraryUsageDescription` (profile photo picking)
- [ ] `NSPhotoLibraryAddUsageDescription` (save images from app)
- [ ] `ITSAppUsesNonExemptEncryption = false`

### 3.4 Privacy manifest

Apple iOS 17+ requires `PrivacyInfo.xcprivacy`. We configure it via
`app.config.cjs` → `ios.privacyManifests` so prebuild regenerates it.

- [ ] `NSPrivacyTracking: false` (we do not track cross-app)
- [ ] `NSPrivacyTrackingDomains: []` (same)
- [ ] `NSPrivacyAccessedAPITypes` covers File timestamp, UserDefaults,
      SystemBootTime, DiskSpace (all Expo/React Native defaults)
- [ ] `NSPrivacyCollectedDataTypes` includes Name, PhoneNumber, UserID,
      PhotosorVideos, OtherUserContent, SensitiveInfo (personality test),
      ProductInteraction (PostHog), OtherUsageData, CrashData

### 3.5 Build

- [ ] `cd apps/mobile && eas build --platform ios --profile expo-production`
      (or run from repo root without `cd` via `npm run mobile:eas:*`)
- [ ] Wait for the build to finish (EAS remote)
- [ ] Download the .ipa from the EAS dashboard to verify it opens in
      Xcode's archive inspector

---

## 4 · App Store Connect metadata

### 4.1 Screenshots

Generated via `npm run assets:app-store`. Outputs under
`docs/app-store-screenshots/`:

- [ ] `icon-1024x1024.png` — marketing icon (RGB, no alpha)
- [ ] `iphone-65/01-intro-1242x2688.png`
      `iphone-65/02-matching-1242x2688.png`
      `iphone-65/03-personlighet-1242x2688.png`
      (iPhone 6.5" display: 11/12/13/14/15 Plus and similar)
- [ ] `iphone-69/01-intro-1320x2868.png`
      `iphone-69/02-matching-1320x2868.png`
      `iphone-69/03-personlighet-1320x2868.png`
      (iPhone 6.9" display: 15/16 Pro Max)
- [ ] Upload all of the above to App Store Connect → App → iOS App → Screenshots

### 4.2 Copy fields

- [ ] App name: **MÄÄK**
- [ ] Subtitle: *(one short value prop, Swedish preferred)*
- [ ] Description: see `docs/app-store-screenshots/README.md` for the
      copy stub; expand with real Swedish copy
- [ ] Keywords (Swedish): *personlighet, dejting, lugn, MBTI, iOS*
- [ ] Promotional text: one-sentence hook for the App Store card
- [ ] Support URL: `https://maakapp.se/about/`
- [ ] Marketing URL: `https://maakapp.se/`
- [ ] Privacy URL: `https://maakapp.se/privacy/`
- [ ] Age rating: **17+** (dating app, mature content possible in chat)

### 4.3 Privacy nutrition label

This is separate from the PrivacyInfo.xcprivacy manifest. Same data
categories but declared in the web form:

- [ ] Data types collected: Name, Phone, User ID, Photos, Messages
      (as "Other User Content"), Usage data, Crash data
- [ ] For each: **"Linked to user"**, **"Not used for tracking"**
- [ ] Purposes: App functionality + Analytics (for product interaction
      and usage data only)

### 4.4 IAP products

- [ ] "Basic (1 week) 69 kr" exists in App Store Connect and is
      approved (not in draft state)
- [ ] "Premium (1 month) 199 kr" exists and is approved
- [ ] Both products are linked in RevenueCat as offerings with matching
      identifiers

### 4.5 Demo account for Apple review

Apple always wants a test account they can sign into during review:

- [ ] Create a demo account (phone number Apple can use — one of
      RevenueCat's sandbox testers works)
- [ ] Verify the account has completed onboarding + personality test
- [ ] Set the demo phone + password in App Store Connect review notes
- [ ] Set `ALLOW_DEMO_RESET=true` in Supabase secrets for the review
      window — **and remember to unset it after approval**

---

## 5 · Submit

### 5.1 Submit the build

- [ ] `eas submit --platform ios --profile expo-production --latest`
      (or via App Store Connect UI after downloading the .ipa)

### 5.2 Review notes

- [ ] Include demo account credentials
- [ ] Include 2-line explanation of what MÄÄK does (personality-based
      matching, video Kemi-Check, Samlingar group chats)
- [ ] Explain ID verification mode: currently auto-approve in launch
      mode while Onfido integration is pending

### 5.3 Wait for review

Typical turnaround: 24–48h for first submission, longer if rejected.

---

## 6 · Post-approval

### 6.1 Immediate (day 1)

- [ ] Verify the app installs from App Store on a clean device
- [ ] Verify phone OTP works end-to-end with a real number
- [ ] Verify personality test onboarding completes
- [ ] Verify at least one daily match appears the next day
- [ ] Verify IAP (Basic + Premium) purchase flows work with TestFlight
      account + sandbox; then with a real purchase
- [ ] Verify RevenueCat webhook fires and the subscription row appears
      in Supabase

### 6.2 Rotate the flags Apple review needed

- [ ] `ALLOW_DEMO_RESET` → unset (`supabase secrets unset ALLOW_DEMO_RESET`)
- [ ] Post-launch: consider flipping
      `VERIFICATION_LAUNCH_AUTO_APPROVE=false` once an ID provider is
      integrated

### 6.3 Open the PostHog dashboard

- [ ] Verify events are flowing: `otp_requested`, `profile_created`,
      `onboarding_completed`, `paywall_viewed`, etc.
- [ ] Pre-built dashboard: https://eu.posthog.com/project/113869/dashboard/615814
- [ ] Add a "Launch day" annotation on the timeline

### 6.4 Landing page

- [ ] `https://maakapp.se/` still up and correct
- [ ] Update the Värdar section's "Kommer snart" copy if you want to
      hint at real availability
- [ ] Consider adding a launch announcement blog post or new Träffar
      route once user data starts flowing

---

## 7 · Post-launch (week 1)

- [ ] Monitor Supabase logs for unexpected errors
      (`supabase functions logs match-daily --tail`)
- [ ] Monitor RevenueCat dashboard for failed purchases
- [ ] Monitor PostHog dashboard for funnel drop-offs
- [ ] Check App Store ratings + reviews daily for the first week
- [ ] Triage any crash reports from App Store Connect Organizer

---

## 8 · Deferred (post-launch sprint)

Things we consciously did not ship in v1 but committed to build next:

- [ ] Real ID verification provider (Onfido / Jumio / Persona) — remove
      `VERIFICATION_LAUNCH_AUTO_APPROVE` mode
- [ ] Värdar Fas 3 → 6 (edge functions + event wiring) — see docs/VARDAR.md
- [ ] Waitlist page (user-facing pre-launch signup on landing)
- [ ] Sentry / error tracking integration (currently only PostHog captures)

---

## References

- `docs/SUPABASE_DEPLOY.md` — database migration mechanics
- `docs/EXPO_EAS_IOS.md` — EAS build workflow
- `docs/VARDAR.md` — Värdar feature spec
- `CLAUDE.md` — project conventions and monorepo layout
- `scripts/launch-check.mjs` — automated pre-flight checker
