# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: MÄÄK

Swedish personality-based dating app. Web (PWA) + iOS. Phone OTP auth, daily matches, real-time chat, group chats ("Samlingar"), video "Kemi-Check", personality test (5 dimensions → 16 archetypes → 4 categories: DIPLOMAT/STRATEGER/BYGGARE/UPPTÄCKARE). Swedish-first, English fallback.

## Monorepo layout

npm workspaces. **Node >= 22** (see `.nvmrc`).

```
/                   # Vite/React web app (root package "vite_react_shadcn_ts")
  src/              # Web app source
  config/           # vite.config.ts, vitest.config.ts
  supabase/         # migrations/, functions/ (Deno edge fns), config.toml
  docs/             # Human docs (deploy, EAS, specs)
apps/
  mobile/           # Expo / EAS iOS app (maak-mobile), expo-router, src/app
  landing/          # maak-landing site
packages/
  core/             # @maak/core - shared TS (personality, supabase helpers, tokens)
ios/                # Capacitor iOS (legacy, still works via npm run ios:build)
```

The root package is the **Vite web app**, NOT a pure orchestrator. Web source lives at root `src/`, mobile at `apps/mobile/src/`.

## Common commands

Run from repo root unless noted.

| Command | What |
|---|---|
| `npm run dev` | Web dev server (Vite, port 8080) |
| `npm run build` | Production web build |
| `npm run lint` | ESLint (**root only** — see below) + cspell |
| `npm run typecheck` | `tsc --noEmit` across repo |
| `npm test` | Vitest (web) |
| `npx vitest run src/path/to/file.test.ts` | Run a single web test |
| `npm run mobile` | Start Expo dev server |
| `npm run mobile:ios` | Expo run iOS |
| `npm run test:mobile` | Jest (mobile workspace) |
| `npx jest --config apps/mobile/jest.config.js -- path/to/file.test.ts` | Run a single mobile test |
| `npm run core:build` | Build `@maak/core` |
| `npx supabase db push` | Apply migrations |
| `supabase gen types typescript --project-id "$VITE_SUPABASE_PROJECT_ID" > src/integrations/supabase/types.ts` | Regenerate Supabase types |

**Never run `eas build --platform ios` from the repo root without a profile** — it selects the Capacitor `production` profile and fails with *No Podfile*. Use the `mobile:eas:*` scripts or `cd apps/mobile` first.

## Tech stack

- **Web**: React 19, TypeScript, Vite 7, shadcn/ui + Radix, Tailwind, Framer Motion, react-router-dom v7, react-i18next, @tanstack/react-query
- **Mobile**: Expo ~55, expo-router ~55, React Native 0.83.4, react-native-purchases (RevenueCat)
- **Backend**: Supabase (Postgres + RLS, Realtime, Edge Functions in Deno)
- **Auth**: Phone OTP via Twilio through Supabase
- **Build**: EAS for iOS; Vercel for web; Capacitor kept as legacy path

## Core data flow

1. **Auth**: Phone OTP → Supabase → `AuthProvider` context
2. **Personality test**: 5-dimension scores (ei/sn/tf/jp/at, 0–100) → categorized into 4 types → 16 archetypes (INFJ, INTJ, etc.)
3. **Matching**: Daily matches via `match-daily` Edge Function — scoring: 40% personality similarity, 30% archetype alignment, 30% interest overlap
4. **Chat**: Real-time messaging via Supabase Realtime channels

## Important conventions

- **Path alias**: `@/` → web `src/`. Use it for all web imports.
- **Supabase client**: web uses `@/integrations/supabase/client`; mobile uses `apps/mobile/src/contexts/SupabaseProvider.tsx` / `@maak/core`. Types are in `src/integrations/supabase/types.ts` (auto-generated).
- **Migrations**: any DDL must go in `supabase/migrations/` as a timestamped file. See `docs/SUPABASE_DEPLOY.md` and `CONTRIBUTING.md`.
- **i18n**: strings in `src/i18n/locales/{en,sv}.json` (web) and mobile equivalents. Keep both locales in sync.
- **Design tokens**: Eucalyptus Grove palette. `--primary` forest green, `--secondary` sage, off-white background. Playfair Display (headers) + DM Sans (body). Personality category colors: Purple (Diplomat), Blue (Strateger), Green (Byggare), Gold (Upptäckare). See `src/index.css`.
- **Personality types**: `DimensionKey = 'ei'|'sn'|'tf'|'jp'|'at'` (0–100). See `src/types/personality.ts`.
- **Edge functions**: Deno runtime. Imports from `https://deno.land/` and `https://esm.sh/`. Key functions: `match-daily`, `ai-assistant`, `generate-icebreakers`, `send-notification`, `revenuecat-webhook`.

## Linting & TypeScript traps

- `eslint.config.js` **ignores `apps/**` and `packages/**`**. `npm run lint` only covers root `src/`. Lint the mobile workspace separately if needed (it currently has no eslint script — rely on typecheck/tests there).
- **TypeScript strict mode is OFF** (`"strict": false` in `tsconfig.app.json`). Unused vars, implicit any, etc. are not flagged.
- Root `tsconfig.json` extends `expo/tsconfig.base` and includes `**/*.ts(x)` project-wide. Separate `tsconfig.app.json` / `tsconfig.node.json` exist for the Vite web build. `apps/mobile/tsconfig.json` and `packages/core/tsconfig.json` are standalone.

## Test setup

- **Web (Vitest)**: config at `config/vitest.config.ts`. jsdom environment, 10s timeout. Excludes `apps/mobile/**`. Aliases `@/*` → `./src/*` and `@maak/core` → `packages/core/src/index.ts`.
- **Mobile (Jest)**: config at `apps/mobile/jest.config.js`. `jest-expo` preset. Pattern: `**/__tests__/**/*.test.[jt]s?(x)`. Watchman disabled to avoid monorepo slowdown.

## Subscription & paywall (mobile)

Three tiers gated by feature access (not match count — algorithm can't guarantee daily quantities):

| Tier | Period | Price | Features gated |
|---|---|---|---|
| Free | — | — | Discovery + profile only. **Chat (kemichat + samlingsgrupp) locked.** |
| Basic | 1 week | 69 kr | Chat, groups, who-liked-you, advanced filters, rewind |
| Premium | 1 month | 199 kr | All Basic + read receipts, unlimited AI icebreakers, priority queue, compatibility insights |

- **SDK**: RevenueCat (`react-native-purchases`). Project `proj42d9a702`. Requires a **dev-client build** (not Expo Go — native module `RNPurchases` is absent there).
- **Webhook**: `supabase/functions/revenuecat-webhook/` receives RC events → upserts `subscriptions` table via service role. Auth: `Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH>`.
- **Hook**: `apps/mobile/src/hooks/useSubscription.ts` reads `subscriptions` (RLS: SELECT own row). Exposes `canAccessChat`, `canAccessGroups`, `hasReadReceipts`, etc.
- **Paywall**: `apps/mobile/src/app/paywall.tsx` (modal). Entry via profile settings. `PaywallGate` component renders lock screen on chat/group routes for free users.
- **DB**: `subscriptions.plan_type` CHECK: `('free', 'basic', 'plus', 'premium', 'vip')`. Legacy `plus→basic`, `vip→premium` in hook.

## Supabase Edge Functions

Deploy with `--no-verify-jwt` for webhook functions (they handle their own auth):
```bash
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy match-daily
```
Set secrets: `supabase secrets set REVENUECAT_WEBHOOK_AUTH=<secret>`

## Mobile: Expo Go vs dev-client

- **Expo Go**: works for most UI development. `react-native-purchases` is a no-op (gracefully skipped via `NativeModules.RNPurchases` check in `PurchasesProvider`).
- **Dev-client build**: required to test IAP. Build with `npm run eas:build:dev:ios` (from `apps/mobile`) or `npm run mobile:eas:build:dev:ios` (from root).

## Env vars

Copy `.env.example` → `.env` at repo root. Required:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (web)
- Mobile also reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `app.config.cjs` merges from root `.env` and `apps/mobile/.env` so you normally only need the VITE_* names.
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` for RevenueCat paywall in mobile.

Never commit real keys. ASC submit keys go through `eas credentials`, never into `eas.json`.

## Git / PRs

- PRs target `develop` (staging) per `CONTRIBUTING.md`.
- Follow `.github/pull_request_template.md`.
- Current branch for dev work: `main` (see recent commits).

## Quality gates

From `.cursor/rules/`: every task should pass a Definition of Done — no console errors, lint clean, builds pass, typecheck OK, no regressions. Fix errors before adding features.

## Where to look next

- `.github/copilot-instructions.md` — component patterns, DB schema overview, import conventions
- `docs/SUPABASE_DEPLOY.md` — migration deployment procedures
- `docs/EXPO_EAS_IOS.md`, `docs/EAS_FIRST_IOS_BUILD.md` — mobile build pipeline
- `docs/SAMLINGAR.md` — group chat spec
- `docs/DEPLOY.md` — full deploy checklist
