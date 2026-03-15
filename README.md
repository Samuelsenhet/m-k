# MÄÄK – Personality-based dating app

**MĀĀK is a mobile-only app** (iOS and Android); web is not supported or maintained.

**Määk är en mobilapp.** En svensk personlighetsbaserad dejtingplattform med telefoninloggning, dagliga matcher (liknande & komplementära), realtidschatt, videoanrop (Kemi-Check) och designsystem kring paletten **Eucalyptus Grove** (skogsgrön, salvia, off-white). PRP-anpassad med användarresa och GDPR-onboarding.

## Tech stack

- **Frontend**: React 18, TypeScript, Expo SDK 55, Expo Router, React Native
- **UI**: Native components, Eucalyptus Grove design (primary green, sage, off-white)
- **Backend**: Supabase (PostgreSQL, Realtime, Edge Functions)
- **Auth**: Phone (SMS OTP via Twilio)
- **i18n**: react-i18next (Swedish + English)
- **Plattform**: iOS & Android (Expo; native tabs, prebuild, EAS)

## Setup

**Config:** See `src/config/supabase.ts` for `isSupabaseConfigured` and `isDemoEnabled`. **Important:** Open **this folder** in Cursor (File → Open Folder → select the `m-k` project root). Run `npm run start` from here so the app finds your `.env` file. If you open a different copy of the repo (e.g. a worktree), `.env` won’t be there and login won’t work.

1. Clone the repo.
2. **Node.js:** Använd Node 22 (projektet kräver `>=22.0.0`). Med nvm: `nvm install 22 && nvm use` (`.nvmrc` finns). För EAS kräver Expo Node **≥20.19.4** – uppgradera om du ser `EBADENGINE` eller `ConfigError`.
3. Copy `.env.example` to `.env` and add your Supabase and Twilio credentials (see [Supabase Dashboard](https://supabase.com/dashboard)).
4. Install dependencies: `npm install` (or `bun install`).
5. **Supabase one-time setup**
   - Option A: `npx supabase db push`
   - Option B: In Supabase → SQL Editor, run `supabase/ONE_TIME_SETUP.sql`
   - If you hit “Could not find the 'alcohol' column” or profile save errors after onboarding, run `supabase/ADD_PROFILE_COLUMNS.sql` once.
6. Start the app: `npm run start` (or `npx expo start`).

**Återskapa native-mappar (iOS/Android):** Om `ios/` eller `android/` saknas, kör `npx expo prebuild`. Kör sedan iOS med `npx expo run:ios` (eller använd scriptet `npm run ios:prebuild` som gör prebuild + run:ios i ett steg).

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run start` | Start Expo dev server (Metro) |
| `npm run start:clear` | Start Expo with cache cleared |
| `npm run ios` | Run iOS app (`expo run:ios`); kräver att native-mappar finns (kör `npx expo prebuild` om de saknas). |
| `npm run ios:prebuild` | Återskapa native-mappar och kör iOS (`expo prebuild && expo run:ios`). |
| `npm run ios:clean` | Run iOS without build cache (`npx expo run:ios --no-build-cache`) |
| `npm run android` | Run Android app (`expo run:android`) |
| `npm run prebuild` | Generate `ios/` and `android/` from Expo config |
| `npm run lint` | ESLint + spellcheck |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run Jest tests |

**Expo Go:** Du kan köra appen i Expo Go med `npx expo start`, skanna QR-koden och öppna i Expo Go-appen. Sätt i `.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_SUPABASE_PROJECT_ID`. På telefon: använd samma nätverk som datorn eller kör `npx expo start --tunnel`. **iOS:** Projektet använder SDK 55; Expo Go i App Store är fortfarande SDK 54. Installera Expo Go för SDK 55 via TestFlight: [testflight.apple.com/join/GZJxxfUU](https://testflight.apple.com/join/GZJxxfUU).

**EAS Build:** För molnbyggen (t.ex. TestFlight), använd EAS. Se [docs/EAS_FIRST_IOS_BUILD.md](docs/EAS_FIRST_IOS_BUILD.md) eller [docs/IOS_EAS_BUILD.md](docs/IOS_EAS_BUILD.md) om de finns. Committa och pusha först – projektet använder `requireCommit: true` i eas.json. Registrera enheter med `eas device:create` (kräver `npm i -g eas-cli`).

**Brownfield:** For embedding the Expo/React Native app in another native project, see [docs/BROWNFIELD.md](docs/BROWNFIELD.md).

**Mascot scripts** (`mascot:sprite`, `mascot:clean`, `mascot:fix`, etc.) require the **sharp** devDependency. See [docs/mascot-system.md](docs/mascot-system.md) §12 if sharp builds from source.

## Deployment

Backend deploy: Supabase (migrations, Edge Functions). See [docs/DEPLOY.md](docs/DEPLOY.md) for the full checklist. Domain (e.g. **maakapp.se**): [docs/DOMAIN_SETUP.md](docs/DOMAIN_SETUP.md).

**App (iOS/Android):** Bygg i molnet med EAS (t.ex. `eas build --platform ios`). Se EAS-dokumentationen i `docs/`.

## Phase 2 (post-launch)

Post-launch tasks live in **PRD.md** under "Phase 2 – Post-launch" (US-030 and onwards). To work on them:

1. Open **PRD.md** and find the first unchecked story (first `- [ ]` in Phase 2).
2. Implement that story, then run `npm run typecheck` and `npm run test`.
3. Mark the story's acceptance criteria `[x]` in PRD.md when done.

**Ralph:** The scripts `ralph.sh` / `ralph.ps1` use **docs/PRE_DEV_CHECKLIST.md** by default. To have Ralph work on Phase 2 stories, point the script at **PRD.md**. See **progress.txt** for task source details.

## Project structure

```text
src/
├── app/             # Expo Router routes (tabs: index, matches, chat, notifications, profile)
├── components/      # UI and feature components (chat, profile, matches, settings, etc.)
├── contexts/        # Auth, Consent, Achievements
├── hooks/           # useMatches, useAuth, usePushNotifications, etc.
├── i18n/            # Locales (en.json, sv.json)
├── integrations/    # Supabase client and types
└── lib/             # Utils, profiles, matching helpers
```

## Main routes (Expo Router)

| Route / Tab | Description |
| ----------- | ----------- |
| (tabs) index | Hem |
| (tabs) matches | Matchningar |
| (tabs) chat | Chatt |
| (tabs) notifications | Notiser |
| (tabs) profile | Profil |
| phone-auth, onboarding | Inloggning och onboarding |
| match/:userId | View match profile |
| terms, privacy, about | Juridik och info |
| reporting, report, appeal | Reporting and appeals |

## Features

- **Auth**: Phone-based sign-in (SMS OTP)
- **Personality**: 30-question test, 16 archetypes, 4 categories (Diplomat, Strateg, Byggare, Upptäckare)
- **Matching**: Daily match pool; filters for similar vs complementary; match score and AI-style explanation; “Se profil” and Chatta from cards
- **Chat**: Real-time messages, icebreakers (incl. AI-generated), read receipts, search; per-conversation Block / Delete / Report and Kemi-Check (video) when 10+ messages
- **Notifications**: Feed with “viewed you” and “interested in you” items; Accept/Reject on interest (Määk styling: primary green, cards)
- **Samlingar**: Gruppchatt – skapa grupper från mutual matches, chatta i grupp, lämna grupp. Se [docs/SAMLINGAR.md](docs/SAMLINGAR.md).
- **Profile**: View/edit profile, matching settings (age, distance), language, achievements, AI assistant, terms, reporting, delete account
- **Design**: Eucalyptus Grove (primary green, sage, off-white), Native Tabs (Expo), soft shadows and card layout
- **Other**: Achievements, AI assistant panel, i18n (sv/en), GDPR consent onboarding

## Editing the code

- **Local:** Clone the repo, run `npm i` and `npm run start`. Node.js 22+ recommended (see `.nvmrc`).
- **Lovable:** If this project is connected to Lovable, you can edit there; changes can be committed back to this repo.
- **GitHub:** Edit files in the GitHub UI and commit.

## Design reference

- **Colors**: Primary (forest green), secondary (sage), background (off-white). See `src/constants` and theme for tokens.
- **Notifications**: Primary green, card list, “Today” section, Accept/Reject actions (no “like” wording).
