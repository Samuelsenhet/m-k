# MÄÄK – Personality-based dating app

**Määk är en iOS-app.** En svensk personlighetsbaserad dejtingplattform med telefoninloggning, dagliga matcher (liknande & komplementära), realtidschatt, videoanrop (Kemi-Check) och designsystem kring paletten **Eucalyptus Grove** (skogsgrön, salvia, off-white). PRP-anpassad med användarresa och GDPR-onboarding.

Appen byggs som en Vite/React-webbapp och paketeras för **iOS** med **Capacitor** (en kodbas, en leveransplattform: iOS).

## Tech stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion, Playfair Display + DM Sans
- **Backend**: Supabase (PostgreSQL, Realtime, Edge Functions)
- **Auth**: Phone (SMS OTP via Twilio)
- **i18n**: react-i18next (Swedish + English)
- **Plattform**: Capacitor (iOS); webbbuild används i utveckling och som källa till iOS-appen

## Setup

**Config:** See `src/config/supabase.ts` for `isSupabaseConfigured` and `isDemoEnabled`. **Important:** Open **this folder** in Cursor (File → Open Folder → select the `m-k` project root). Run `npm run dev` from here so the app finds your `.env` file. If you open a different copy of the repo (e.g. a worktree), `.env` won’t be there and login won’t work.

1. Clone the repo.
2. **Node.js:** Använd Node 22 (projektet kräver `>=22.0.0`). Med nvm: `nvm install 22 && nvm use` (`.nvmrc` finns). För EAS (`eas build`, `eas device:create`) kräver Expo/React Native Node **≥20.19.4** – uppgradera om du ser `EBADENGINE` eller `ConfigError`.
3. Copy `.env.example` to `.env` and add your Supabase and Twilio credentials (see [Supabase Dashboard](https://supabase.com/dashboard)).
4. Install dependencies: `npm install`
5. **Supabase one-time setup**
   - Option A: `npx supabase db push`
   - Option B: In Supabase → SQL Editor, run `supabase/ONE_TIME_SETUP.sql`
   - If you hit “Could not find the 'alcohol' column” or profile save errors after onboarding, run `supabase/ADD_PROFILE_COLUMNS.sql` once.
6. Start dev server: `npm run dev` (default port 8080)

## Scripts

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start dev server (Vite)        |
| `npm run build`   | Production build (webb → används av iOS) |
| `npm run preview` | Preview production build       |
| `npm run lint`    | ESLint + spellcheck            |
| **iOS (EAS)**     |                                |
| `npm run ios:build` | Bygg webb + synka till `ios/` (cap sync). **Kör detta efter `npx cap add ios`** om du får "web assets directory (./dist) must contain an index.html". |
| `npm run ios:sync`  | Synka `dist/` till iOS-projekt (kräver att `npm run build` redan körts) |
| `npm run ios:open` | Öppna iOS-projektet i Xcode (öppnar `ios/App/App.xcodeproj`; använd inte `.xcworkspace` – den finns inte i denna setup) |
| `npm run ios:eas-build` | Bygg iOS i molnet (EAS Build) |
| `eas device:create` | Registrera enhet för internal distribution (kör efter `npm i -g eas-cli`) |

**Preview in VS Code / Cursor:** Use the Vite dev server (Tasks: Run Task → “Start dev server (Vite)”) or run `npm run dev` and open http://localhost:8080. The Live Server extension will not work for this app.

**Mascot scripts** (`mascot:sprite`, `mascot:clean`, `mascot:fix`, etc.) require the **sharp** devDependency. If sharp builds from source on your machine, see [docs/mascot-system.md](docs/mascot-system.md) §12 (build-from-source, env vars, cross-compile).

## Deployment

Built for deployment on Vercel with Supabase backend. See [docs/DEPLOY.md](docs/DEPLOY.md) for the full checklist. To use **maakapp.se** (or määkapp.com / määkapp.se), see [docs/DOMAIN_SETUP.md](docs/DOMAIN_SETUP.md).

## Phase 2 (post-launch)

Post-launch tasks live in **PRD.md** under "Phase 2 – Post-launch" (US-030 and onwards). To work on them:

1. Open **PRD.md** and find the first unchecked story (first `- [ ]` in Phase 2).
2. Implement that story, then run `npm run typecheck` and `npm run build`.
3. Mark the story's acceptance criteria `[x]` in PRD.md when done.

**Ralph:** The scripts `ralph.sh` / `ralph.ps1` use **docs/PRE_DEV_CHECKLIST.md** by default. To have Ralph work on Phase 2 stories, point the script at **PRD.md** (first `- [ ]` in the file). See **progress.txt** for how the task source was switched to the Pre-dev checklist; reverse that to use PRD again for Phase 2.

## Project structure

```
src/
├── components/     # UI and feature components (chat, profile, matches, settings, etc.)
├── contexts/       # Auth, Consent, Achievements
├── hooks/          # useMatches, useAuth, usePushNotifications, etc.
├── pages/          # Route-level pages (see Routes below)
├── i18n/           # Locales (en.json, sv.json)
├── integrations/   # Supabase client and types
└── lib/            # Utils, profiles, matching helpers
```

## Main routes

| Path | Description |
|------|-------------|
| `/` | Landing / home |
| `/phone-auth` | Phone number + OTP login |
| `/onboarding` | Profile + personality test |
| `/profile` | Profile view, edit, settings (Inställningar) |
| `/matches` | Daily matches (similar/complementary), mutual list |
| `/chat` | Chat list + conversation (with Kemi-Check video entry) |
| `/match/:userId` | View match profile |
| `/notifications` | Notifications feed (view / interest + Accept/Reject) |
| `/demo-seed` | Demo: matches + chat without backend |
| `/personality-guide` | Personality types and archetypes |
| `/terms`, `/privacy` | Terms and privacy |
| `/about` | About the app |
| `/reporting`, `/report`, `/report-history`, `/appeal` | Reporting and appeals |
| `/admin/reports` | Moderator report queue |

## Features

- **Auth**: Phone-based sign-in (SMS OTP)
- **Personality**: 30-question test, 16 archetypes, 4 categories (Diplomat, Strateg, Byggare, Upptäckare)
- **Matching**: Daily match pool; filters for similar vs complementary; match score and AI-style explanation; “Se profil” and Chatta from cards
- **Chat**: Real-time messages, icebreakers (incl. AI-generated), read receipts, search, “Recent match” strip; per-conversation Block / Delete / Report and Kemi-Check (video) when 10+ messages
- **Notifications**: Feed with “viewed you” and “interested in you” items; Accept/Reject on interest (Määk styling: primary green, cards)
- **Samlingar**: Gruppchatt – skapa grupper från mutual matches, chatta i grupp, lämna grupp. Se [docs/SAMLINGAR.md](docs/SAMLINGAR.md) för Realtime och testflöde.
- **Profile**: View/edit profile, matching settings (age, distance), language, achievements, AI assistant, terms, reporting, delete account
- **Design**: Eucalyptus Grove (primary green, sage, off-white), serif titles (Playfair), soft shadows and card layout
- **Other**: Achievements, AI assistant panel, PWA, i18n (sv/en), GDPR consent onboarding

## Deployment (iOS)

Appen levereras som **iOS-app** via **EAS**. Bygg webb och synka till iOS med `npm run ios:build`. Bygg i molnet med `npm run ios:eas-build` (eller `eas build --platform ios`). Registrera enheter för internal distribution med `eas device:create` (kräver `npm i -g eas-cli`). Xcode lokalt är valfritt: `npm run ios:open`. För valfri webbdeploy (Vercel): konfigurera `VITE_SUPABASE_*` och `npm run vercel:env` vid behov.

## Editing the code

- **Local IDE**: Clone the repo, run `npm i` and `npm run dev`. Node.js 22+ recommended (see `.nvmrc`).
- **Lovable**: If this project is connected to Lovable, you can edit there; changes can be committed back to this repo.
- **GitHub**: Edit files in the GitHub UI and commit.

## Design reference

- **Colors**: `--primary` (forest), `--secondary` (sage), `--background` (off-white). See `src/index.css` for full tokens.
- **Notifications**: Määk version uses primary green, card list, “Today” section, and Accept/Reject actions (no “like” wording).
