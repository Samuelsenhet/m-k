# Expo (native) – EAS iOS vs befintlig Capacitor-pipeline

**Kanonisk plan:** `~/.cursor/plans/expo_rn_port_kickoff_f588fd01.plan.md`

## Två separata vägar i samma repo

| Bygge                              | Katalog / config                                                                                   | Teknik                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Capacitor (nuvarande webb-iOS)** | Repo root [eas.json](../eas.json), [.eas/build/capacitor-ios.yml](../.eas/build/capacitor-ios.yml) | Vite `dist` → `npx cap sync ios` → Xcode   |
| **Expo native (denna port)**       | [apps/mobile/eas.json](../apps/mobile/eas.json), [apps/mobile/app.json](../apps/mobile/app.json)   | Expo prebuild / Metro → EAS Build          |

Byt **inte** ut root `eas.json` mot Expo utan att medvetet stänga av Capacitor-flödet. Kör Expo-build **från** `apps/mobile`:

```bash
cd apps/mobile
eas login
eas build:configure   # första gången; skapar/uppdaterar eas.json om behövs
eas build --platform ios --profile development
```

För **fysisk enhet** (development client): följ [Expo: iOS device development build](https://docs.expo.dev/develop/development-builds/create-a-build/#create-a-build-for-the-device) — Apple Developer Program, `eas device:create`, Developer Mode på enheten.

## Miljövariabler på EAS

Lägg `EXPO_PUBLIC_SUPABASE_URL` och `EXPO_PUBLIC_SUPABASE_ANON_KEY` som secrets för Expo-projektet (EAS Dashboard eller `eas secret:create`). Se [EXPO_ENV.md](./EXPO_ENV.md).

## Projekt-ID

[apps/mobile/app.json](../apps/mobile/app.json) använder samma `extra.eas.projectId` som root [app.json](../app.json) om ni vill dela Expo-konto/projekt; vid konflikt med Capacitor, skapa **nytt** Expo-projekt för `maak-mobile` och uppdatera `projectId`.

## Lokal utveckling utan EAS

```bash
npm run mobile
# eller
cd apps/mobile && npx expo start
```

iOS-simulator: `npm run mobile:ios` (från repo root).
