# Expo / React Native – miljövariabler (jämfört med Vite)

Kanonisk plan för porten: `~/.cursor/plans/expo_rn_port_kickoff_f588fd01.plan.md`.  
Brownfield / inbäddning av RN i befintlig native-app (jämfört med vår fristående `apps/mobile`): [EXPO_BROWNFIELD_MAAK.md](./EXPO_BROWNFIELD_MAAK.md).

**Delad kod webb + mobil:** `packages/core` (`@maak/core`) innehåller bl.a. design tokens, Supabase-env/klient, `resolveProfilesAuthKey`, **personlighetstyper** (`personality.ts`), och **`isSupabaseInvokeUnauthorized`** för Edge Functions. Webben importerar samma paket (rot-`package.json` har `"@maak/core": "*"`). Kör `npm run core:build` efter ändringar i `packages/core`.

Expo läser publika variabler med prefix **`EXPO_PUBLIC_`** (byggs in i klienten). Sätt dem i `apps/mobile/.env` eller repo-rot `.env` (gitignored) eller i EAS Environment variables för byggen.

**Monorepo:** Roten har `"type": "module"`, därför ligger dynamisk config i **`app.config.cjs`** (rot) och **`apps/mobile/app.config.cjs`** (proxy). Där läses `.env` från rot och `apps/mobile`, och **webbens `VITE_SUPABASE_*`** mappas till samma Supabase-URL/nyckel som `EXPO_PUBLIC_*` via `extra` (så mobilen fungerar om du bara fyllt rot-`.env`).

| Vite (webb)                       | Expo (mobil)                    | Anmärkning                                      |
| --------------------------------- | ------------------------------- | ----------------------------------------------- |
| `VITE_SUPABASE_URL`               | `EXPO_PUBLIC_SUPABASE_URL`      | Obligatorisk                                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Obligatorisk (samma värde som anon/public key)  |
| `VITE_ENABLE_DEMO`                | `EXPO_PUBLIC_ENABLE_DEMO`       | Valfri; spegla webbens demo-flagga              |
| `VITE_APP_URL`                    | `EXPO_PUBLIC_APP_URL`           | Valfri; deep links / delning                    |
| `VITE_INGEST_URL`                 | `EXPO_PUBLIC_INGEST_URL`        | Valfri; endast om mobil ska skicka telemetri    |

**Telefon / SMS-inloggning (Supabase + Twilio):** Efter att `EXPO_PUBLIC_SUPABASE_*` är satta måste Phone provider och ev. Twilio konfigureras i Supabase Dashboard. Se [SUPABASE_PHONE_TWILIO_CHECKLIST.md](./SUPABASE_PHONE_TWILIO_CHECKLIST.md).

**Ska inte finnas i klienten:** `SUPABASE_SERVICE_ROLE_KEY`, `LOOPIA_*`, lösenord – samma som webb.

Se även [.env.example](../.env.example) för webbens namn.

## EAS / Expo-konto (bygg & dev)

Projektet är kopplat till **EAS** via `apps/mobile/app.json`:

- `expo.owner` — måste vara samma användarnamn som på [expo.dev](https://expo.dev) (nu: `samuelsenhet`).
- `expo.extra.eas.projectId` — länkar repot till projektet `@owner/slug` på Expo.

**Var du kör kommandon:** Både **monoreporoten** och **`apps/mobile`** fungerar för CLI som `eas login` — i roten finns npm-skripten `eas:login`, `eas:whoami`, `eas:project:info` (de kör samma sak som i workspace `maak-mobile`).

**Om CLI säger att du inte är inloggad eller projektet inte finns:**

1. Logga in: `npm run eas:login` (repo rot eller `apps/mobile`) eller `npx eas-cli login`.
2. Kontrollera: `npm run eas:whoami` — ska matcha `expo.owner` i `app.json` (nu `samuelsenhet`).
3. Verifiera projekt: `npm run eas:project:info` — ska visa samma `projectId` som i `app.json`.

**Meddelandet “You are already logged in as …” vid `eas login`:** Svara **No** om du bara ville “kolla” — då behålls sessionen och inget nytt lösenord krävs. Svarar du **Yes** tvingar CLI en **ny** inloggning; då måste e-post/lösenord stämma med ett Expo-konto, annars: *account:login command failed*.

**Kontrollera utan att logga in om:** `npm run eas:session` (rot) eller `npm run eas:whoami` — ska matcha `expo.owner` i `app.json`.

**Byta konto:** `npm run eas:logout`, sedan `npm run eas:login`. Fel på Hotmail/Gmail osv. betyder oftast fel lösenord, eller att den adressen inte är kopplad till Expo — kontrollera inloggning på [expo.dev](https://expo.dev) och ev. återställ lösenord där.

**Byter du Expo-användare eller org:** `eas logout`, logga in, uppdatera `expo.owner` och kör `eas init` i `apps/mobile` om projektet ska länkas om (eller överför projektet på expo.dev).

**Bygg (`eas build`):** kör från `apps/mobile` med profil **`expo-production`** (App Store) eller **`expo-preview`** (intern), eller från rot: `npm run mobile:eas:build:production:ios:submit` / `npm run ios:eas-build`.

**Viktigt:** `eas build --platform ios` **från monoreporoten** utan `--profile` använder rot-`eas.json`-profilen **`production`**, som är **Capacitor** (kräver `ios/App` + Podfile). Det ger felet *No Podfile found*. Expo MÄÄK ska alltid använda **`expo-production`** via skripten ovan eller `cd apps/mobile && eas build --platform ios --profile expo-production`.
