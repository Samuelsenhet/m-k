# E2E-tester med Maestro och EAS Workflows

Projektet är konfigurerat för att köra end-to-end-tester med [Maestro](https://maestro.dev/) på EAS Workflows.

## Setup

- **`.maestro/`** – Maestro-flöden (YAML). T.ex. `home.yml` startar appen och verifierar att "Welcome!" visas.
- **`eas.json`** – Build-profilen **`e2e-test`** bygger iOS för simulator (`simulator: true`) och Android som APK, utan credentials (`withoutCredentials: true`).
- **`.eas/workflows/e2e-test-ios.yml`** – Workflow som bygger iOS med `e2e-test` och kör Maestro-flödena.

## Anpassa flödena

Flödena i `.maestro/` måste matcha den app som faktiskt byggs. Denna kodbas har:

- **Vite + React Router** som standard (Capacitor-iOS-builden). Första skärmen är då t.ex. landningssidan.
- **Expo Router** (`src/app/`) med "Welcome!" på startsidan om du bygger med Expo Router som entry.

Om din iOS-build använder Vite-appen, uppdatera `.maestro/home.yml` så att `assertVisible` matchar text på din riktiga första skärm (t.ex. "Kom igång" eller annan landningssida-text). Se [Maestro docs](https://docs.maestro.dev/) för fler kommandon.

## Köra E2E lokalt (valfritt)

1. Installera [Maestro CLI](https://docs.maestro.dev/getting-started/installing-maestro).
2. Bygg och installera appen på simulator (t.ex. `npm run ios:build` och öppna i Xcode simulator, eller använd en befintlig build).
3. Från projektroten:

```sh
maestro test .maestro/home.yml
```

## Köra E2E-workflow

**Manuellt (EAS CLI):**

```sh
npx eas-cli@latest workflow:run .eas/workflows/e2e-test-ios.yml
```

**Automatiskt:** Workflow körs vid varje pull request (trigger `pull_request`, branches `['*']`). Status och resultat visas i EAS-dashboarden.

## Android

Projektet är primärt konfigurerat för iOS. Profilen `e2e-test` innehåller `android.buildType: "apk"` om du senare lägger till Android. Skapa då t.ex. `.eas/workflows/e2e-test-android.yml` och flöden som använder Android `applicationId` (t.ex. `com.samuelsenhet.vite_react_shadcn_ts` från `app.json`) i `.maestro`-filernas `appId` där det gäller.

## Referens

- [Run E2E tests on EAS Workflows and Maestro](https://docs.expo.dev/eas/workflows/e2e-tests/) (Expo)
- [EAS Workflows syntax](https://docs.expo.dev/eas/workflows/syntax/)
- [Maestro documentation](https://docs.maestro.dev/)
