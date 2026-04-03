# Expo (native) – EAS iOS vs befintlig Capacitor-pipeline

**Kanonisk plan:** `~/.cursor/plans/expo_rn_port_kickoff_f588fd01.plan.md`

**Steg-för-steg (dev client, Android/iOS):** [CREATE_DEVELOPMENT_BUILD_EAS.md](./CREATE_DEVELOPMENT_BUILD_EAS.md)

## Två separata vägar i samma repo

| Bygge                              | Katalog / config                                                                                   | Teknik                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Capacitor (webb → native iOS)** | Repo root [eas.json](../eas.json) profiler **`capacitor-development`**, **`capacitor-preview`**, **`capacitor-production`** + [.eas/build/capacitor-ios.yml](../.eas/build/capacitor-ios.yml) | Vite `dist` → `npx cap sync ios` → Fastlane |
| **Expo native (MÄÄK-appen)**       | [apps/mobile/app.json](../apps/mobile/app.json), rot [app.config.js](../app.config.js) (re-export + sökvägar), [apps/mobile/eas.json](../apps/mobile/eas.json) | Expo prebuild / Metro → EAS Build          |

I rot- [eas.json](../eas.json) är **`development`**, **`preview`** och **`production`** Expo-byggen (de **ärver** `expo-*`). Capacitor använder uttryckligen **`capacitor-*`**-profiler så att `eas build --platform ios` utan specialprofil inte kör `pod install` i `ios/App` (vilket gav *No Podfile*). Rot-`package.json` har **`sharp`** som `optionalDependency` så att `npm ci` i molnet inte faller om native `sharp` inte kan byggas.

Rekommenderat: kör Expo-build från **`apps/mobile`** (eller npm-skript som använder workspace). EAS från monoreporoten läser [app.config.js](../app.config.js) så att samma `expo`-plugins som i `apps/mobile` används:

```bash
cd apps/mobile
eas login
eas build:configure   # första gången; skapar/uppdaterar eas.json om behövs
eas build --platform ios --profile expo-development
```

För **fysisk enhet** (development client): följ [Expo: iOS device development build](https://docs.expo.dev/develop/development-builds/create-a-build/#create-a-build-for-the-device) — Apple Developer Program, `eas device:create`, Developer Mode på enheten.

## EAS Workflows (CI)

YAML-filer ligger i [apps/mobile/.eas/workflows/](../apps/mobile/.eas/workflows/) (samma nivå som [apps/mobile/eas.json](../apps/mobile/eas.json)).

| Fil | Syfte |
| --- | --- |
| `ios-development-build.yml` | **Development client** (iOS Simulator), profil `expo-development`; kör manuellt. |
| `create-production-builds.yml` | **Production**-build (iOS); kör manuellt. |
| `preview-builds.yml` | **Preview**-build (iOS, internal distribution). |
| `production-on-push-main.yml` | Production (iOS) vid **push till `main`**, endast om `apps/mobile/**` eller `packages/core/**` ändrats. Kräver att GitHub är kopplat till Expo-projektet. |

Kör manuellt från `apps/mobile`:

```bash
cd apps/mobile
npx eas-cli@latest workflow:run .eas/workflows/ios-development-build.yml
npx eas-cli@latest workflow:run .eas/workflows/create-production-builds.yml
```

Översikt: [Get started with EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/).

## Miljövariabler på EAS

Lägg `EXPO_PUBLIC_SUPABASE_URL` och `EXPO_PUBLIC_SUPABASE_ANON_KEY` som secrets för Expo-projektet (EAS Dashboard eller `eas secret:create`). Se [EXPO_ENV.md](./EXPO_ENV.md).

## Projekt-ID

[apps/mobile/app.json](../apps/mobile/app.json) och rot [app.config.js](../app.config.js) delar samma `extra.eas.projectId` (Expo-projektet). Vid konflikt med Capacitor, skapa **nytt** Expo-projekt för `maak-mobile` och uppdatera `projectId` på båda ställena.

## Lokal utveckling utan EAS

```bash
npm run mobile
# eller
cd apps/mobile && npx expo start
```

iOS-simulator: `npm run mobile:ios` (från repo root).
