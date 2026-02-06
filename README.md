# MÄÄK – Personality-based dating app

A Swedish personality-based dating platform with phone auth, daily matches (similar & complementary), real-time chat, video calls (Kemi-Check), and a design system built around the **Eucalyptus Grove** palette (forest green, sage, off-white). PRP-compliant with user journey phases and GDPR onboarding.

## Tech stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion, Playfair Display + DM Sans
- **Backend**: Supabase (PostgreSQL, Realtime, Edge Functions)
- **Auth**: Phone (SMS OTP via Twilio)
- **i18n**: react-i18next (Swedish + English)
- **PWA**: Service worker, install prompt

## Setup

1. Clone the repo.
2. Copy `.env.example` to `.env` and add your Supabase and Twilio credentials (see [Supabase Dashboard](https://supabase.com/dashboard)).
3. Install dependencies: `npm install`
4. **Supabase one-time setup**
   - Option A: `npx supabase db push`
   - Option B: In Supabase → SQL Editor, run `supabase/ONE_TIME_SETUP.sql`
   - If you hit “Could not find the 'alcohol' column” or profile save errors after onboarding, run `supabase/ADD_PROFILE_COLUMNS.sql` once.
5. Start dev server: `npm run dev` (default port 8080)

## Scripts

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start dev server (Vite)        |
| `npm run build`   | Production build               |
| `npm run preview` | Preview production build      |
| `npm run lint`    | ESLint + spellcheck            |

**Preview in VS Code / Cursor:** Use the Vite dev server (Tasks: Run Task → “Start dev server (Vite)”) or run `npm run dev` and open http://localhost:8080. The Live Server extension will not work for this app.

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
- **Profile**: View/edit profile, matching settings (age, distance), language, achievements, AI assistant, terms, reporting, delete account
- **Design**: Eucalyptus Grove (primary green, sage, off-white), serif titles (Playfair), soft shadows and card layout
- **Other**: Achievements, AI assistant panel, PWA, i18n (sv/en), GDPR consent onboarding

## Deployment

The app is built for deployment on **Vercel** with a Supabase backend. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (and optional `VITE_SUPABASE_PROJECT_ID`) in your Vercel project. Use `npm run vercel:env` to add env vars from the CLI if needed.

## Editing the code

- **Local IDE**: Clone the repo, run `npm i` and `npm run dev`. Node.js 22+ recommended (see `.nvmrc`).
- **Lovable**: If this project is connected to Lovable, you can edit there; changes can be committed back to this repo.
- **GitHub**: Edit files in the GitHub UI and commit.

## Design reference

- **Colors**: `--primary` (forest), `--secondary` (sage), `--background` (off-white). See `src/index.css` for full tokens.
- **Notifications**: Määk version uses primary green, card list, “Today” section, and Accept/Reject actions (no “like” wording).
