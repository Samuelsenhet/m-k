# Expo (native) – EAS iOS vs befintlig Capacitor-pipeline

**Kanonisk plan:** `~/.cursor/plans/expo_rn_port_kickoff_f588fd01.plan.md`

**Steg-för-steg (dev client, Android/iOS):** [CREATE_DEVELOPMENT_BUILD_EAS.md](./CREATE_DEVELOPMENT_BUILD_EAS.md)

## Två separata vägar i samma repo

| Bygge                              | Katalog / config                                                                                   | Teknik                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Capacitor (webb → native iOS)** | Repo root [eas.json](../eas.json) profiler **`capacitor-development`**, **`capacitor-preview`**, **`capacitor-production`** + [.eas/build/capacitor-ios.yml](../.eas/build/capacitor-ios.yml) | Vite `dist` → `npx cap sync ios` → Fastlane |
| **Expo native (MÄÄK-appen)**       | [apps/mobile/app.json](../apps/mobile/app.json), rot [app.config.cjs](../app.config.cjs) (+ [apps/mobile/app.config.cjs](../apps/mobile/app.config.cjs) som proxy), [apps/mobile/eas.json](../apps/mobile/eas.json) | Expo prebuild / Metro → EAS Build          |

I rot- [eas.json](../eas.json) är **`development`**, **`preview`** och **`production`** Expo-byggen (de **ärver** `expo-*`). Capacitor använder uttryckligen **`capacitor-*`**-profiler så att `eas build --platform ios` utan specialprofil inte kör `pod install` i `ios/App` (vilket gav *No Podfile*). Rot-`package.json` har **`sharp`** som `optionalDependency` så att `npm ci` i molnet inte faller om native `sharp` inte kan byggas.

Rekommenderat: kör Expo-build från **`apps/mobile`** (eller npm-skript som använder workspace). EAS från monoreporoten läser [app.config.cjs](../app.config.cjs) så att samma `expo`-plugins som i `apps/mobile` används:

```bash
cd apps/mobile
eas login
eas build:configure   # första gången; skapar/uppdaterar eas.json om behövs
eas build --platform ios --profile expo-development
```

För **fysisk enhet** (development client): följ [Expo: iOS device development build](https://docs.expo.dev/develop/development-builds/create-a-build/#create-a-build-for-the-device) — Apple Developer Program, `eas device:create`, Developer Mode på enheten.

## EAS Workflows (CI)

Auto-triggade YAML-filer ligger i [.eas/workflows/](../.eas/workflows/) (repo-rot). Manuella App Store-/TestFlight-flöden ligger i [apps/mobile/.eas/workflows/](../apps/mobile/.eas/workflows/).

| Fil | Syfte |
| --- | --- |
| `.eas/workflows/deploy-to-production.yml` | Push till `main` (paths: `apps/mobile/**`, `packages/core/**`) → fingerprint, bygg om native ändrats, annars OTA, sedan submit. |
| `.eas/workflows/publish-preview-update.yml` | Push till valfri branch (paths: `apps/mobile/**`, `packages/core/**`) → OTA preview-update. |
| `.eas/workflows/e2e-test-ios.yml` | PR → simulator-build + Maestro-flöden. |
| `.eas/workflows/create-development-builds.yml` | Development client (enhet + simulator); kör manuellt. |
| `.eas/workflows/create-production-builds.yml` | Production-build (iOS); kör manuellt. |
| `apps/mobile/.eas/workflows/ios-testflight.yml` | Production-build → TestFlight; körs via `npm run mobile:eas:workflow:testflight`. |
| `apps/mobile/.eas/workflows/ios-app-store-submit.yml` | Production-build → App Store Submit; körs via `npm run mobile:eas:workflow:app-store`. |

Kör manuellt från repo-rot:

```bash
npx eas-cli@latest workflow:run .eas/workflows/create-development-builds.yml
npx eas-cli@latest workflow:run .eas/workflows/create-production-builds.yml
```

Översikt: [Get started with EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/).

## Miljövariabler på EAS

Lägg `EXPO_PUBLIC_SUPABASE_URL` och `EXPO_PUBLIC_SUPABASE_ANON_KEY` som secrets för Expo-projektet (EAS Dashboard eller `eas secret:create`). Se [EXPO_ENV.md](./EXPO_ENV.md).

## EAS Submit / TestFlight — `failed to resolve submission config` eller `prepare_asc_api_key`

Det här uppstår nästan alltid när **iOS-submitprofilen i `eas.json` är ofullständig** eller när **App Store Connect API Key** saknas för projektet.

1. **Numeriskt Apple ID (`ascAppId`)**  
   Värdet får **bara innehålla siffror** (inga bokstäver eller platshållartext — då felar `eas build --auto-submit`). Hämta det från App Store Connect → din app → **App Store** → **App Information** → **Apple ID** (inte bundle ID). Lägg in i [apps/mobile/eas.json](../apps/mobile/eas.json) under `submit.production.ios`, t.ex. `"ascAppId": "1234567891"`. Se [expo.fyi/asc-app-id](https://expo.fyi/asc-app-id).  
   **CI / EAS Workflows** kräver nästan alltid `ascAppId` i `eas.json`. Lokalt kan du ibland köra submit interaktivt utan nyckeln; med **`--auto-submit`** behöver du oftast sätta det **innan** bygget eller låta EAS fråga i ett separat submit-steg.

2. **App Store Connect API Key (CI / icke-interaktivt)**  
   Lokalt: `cd apps/mobile && eas credentials --platform ios` → välj lämplig build-profil → **App Store Connect: API Key** → konfigurera så att **EAS Submit** kan använda nyckeln. Alternativ: egna `.p8`-fält i `eas.json` (`ascApiKeyPath`, `ascApiKeyIssuerId`, `ascApiKeyId`) enligt [Submit to the App Store](https://docs.expo.dev/submit/ios/).

3. **Samma EAS-miljö som bygget**  
   Workflows sätter `environment: production` på submit/testflight-jobb och `expo-production`-profilen har `environment: "production"` så att variabler/credentials från **production**-miljön på Expo används konsekvent.

4. **Felsökning i loggen**  
   Submit-/TestFlight-jobb sätter `EXPO_DEBUG=1` så EAS/Expo skriver mer detaljer om konfigurationsupplösning misslyckas.

5. **Store-build**  
   `expo-production` har `distribution: "store"` så IPA:n är avsedd för App Store Connect (TestFlight / review), inte enbart intern delning.

## Projekt-ID

[apps/mobile/app.json](../apps/mobile/app.json) och rot [app.config.cjs](../app.config.cjs) delar samma `extra.eas.projectId` (Expo-projektet). Vid konflikt med Capacitor, skapa **nytt** Expo-projekt för `maak-mobile` och uppdatera `projectId` på båda ställena.

## Lokal utveckling utan EAS

```bash
npm run mobile
# eller
cd apps/mobile && npx expo start
```

iOS-simulator: `npm run mobile:ios` (från repo root).
