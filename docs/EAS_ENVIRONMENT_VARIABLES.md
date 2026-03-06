# EAS-miljövariabler

Kort guide för hur du konfigurerar och använder EAS Environment variables i detta projekt (EAS Build, Capacitor iOS).

## Varför EAS-miljövariabler

Byggen kör på EAS-servrar; din lokala **.env** committas inte och finns inte på build-servern. EAS Environment variables löser det: du sätter variabler per miljö (development, preview, production) på expo.dev eller via EAS CLI, med val av visibility (plain text, sensitive, secret). Samma uppsättning kan användas för byggen, updates och lokalt via `eas env:pull`.

## Hantera variabler

**Skapa (CLI):**

```sh
eas env:create --name VARIABLE_NAME --value "värde" --environment production --visibility plaintext
```

Använd `--visibility sensitive` eller `--visibility secret` när det passar. Se [Visibility](#visibility) nedan.

**Lista och redigera:** Gå till [Environment variables](https://expo.dev/accounts/[account]/projects/[project]/environment-variables) i projektets inställningar på expo.dev (ersätt `[account]` och `[project]` med ditt konto och projekt).

**Ladda ner lokalt:** För att matcha EAS production lokalt:

```sh
eas env:pull --environment production
```

Det skriver variabler till **.env** (enligt visibility; secrets kan inte läsas ut).

## Användning i byggen

EAS Build laddar variabler för den miljö som build-profilen använder. Om en profil i [eas.json](../eas.json) har `"environment": "production"` används production-variablerna; om inget anges kan EAS ändå lösa miljö utifrån profilnamn (t.ex. production för production-profil).

I detta projekt körs **npm run ios:build** på EAS (Vite build + cap sync). Alla variabler som behövs vid `vite build` (t.ex. **VITE_SUPABASE_URL**, **VITE_SUPABASE_PUBLISHABLE_KEY**, **VITE_SUPABASE_PROJECT_ID**) måste finnas i EAS för den miljö bygget använder, annars får bygget inte rätt konfiguration.

**Client-side:** Endast variabler med prefix **VITE_** (eller **EXPO_PUBLIC_** om de används) blir inbäddade i klienten. Sådana variabler ska sättas som plain text eller sensitive i EAS. Använd inte secret för värden som hamnar i klientkoden – de är publikt läsbara i appen.

## Visibility

| Visibility   | Beskrivning |
|-------------|-------------|
| **Plain text** | Synlig på webben, i EAS CLI och i byggloggar. |
| **Sensitive**  | Döljs i EAS Build/Workflows-loggar. Kan visas med toggle på webben. Läsbar i EAS CLI. |
| **Secret**     | Läsbar endast på EAS-servrar; inte synlig på webben eller i EAS CLI. Döljs i loggar. |

Allt som når klienten (t.ex. via `import.meta.env.VITE_*`) är publikt. **Secret** ska användas för värden som bara behövs under bygget (t.ex. NPM_TOKEN, API-nycklar för server-side steg), inte för värden som byggs in i appen.

## Länkar

- [EAS Environment variables (Expo)](https://docs.expo.dev/eas/environment-variables/)
- [Create and manage](https://docs.expo.dev/eas/environment-variables/manage)
- [Usage in builds, updates, hosting](https://docs.expo.dev/eas/environment-variables/usage)
