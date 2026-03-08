# Vad som laddas upp till EAS Build

När du kör `eas build` paketerar EAS CLI projektfiler och laddar upp dem till en byggarbetare. Denna guide beskriver vad som inkluderas, hur känsliga filer hanteras och när du ska använda "exakt som Git".

## Vad inkluderas i uppladdningen?

- **Standard:** Alla filer från projektroten som **inte** matchar `.gitignore` (och inte `.git` eller `node_modules`). EAS använder i praktiken något som liknar `git clone --depth 1` plus ditt arbetskatalogstillstånd – **om** du inte har satt `requireCommit: true` (se nedan).
- **I detta projekt** ignoreras bland annat:
  - `node_modules/`, `dist/`, `.env`, `.env.*`, `*.pem`, `secrets.json`, `ios/Pods/`, `ios/App/build/`, `.expo/`, `ios.backup/`, `ios.capacitor.backup/` (enligt [.gitignore](../.gitignore)).

Du kan inspektera exakt vad som paketeras:

```sh
eas build:inspect --platform ios --stage archive --output ~/eas-archive --profile production
```

Öppna mappen `~/eas-archive` och kontrollera innehållet.

## Exakt som Git (`requireCommit: true`)

I [eas.json](../eas.json) är **`"requireCommit": true`** satt under `cli`. Det betyder:

- EAS skapar uppladdningen med **`git clone --depth 1`** av ditt repo.
- Bygget motsvarar alltid **den senaste committade versionen** (ingen "dirty" working tree).
- Bra för reproducerbara byggen, CI och verktyg som läser commit-hash (t.ex. Sentry).
- **OBS:** Med `requireCommit: true` används **inte** [.easignore](#easignore) – bara Git och `.gitignore` styr innehållet.

**Krav:** Alla ändringar du vill ha med i bygget måste vara **committade och (vid fjärrbygge) pushade** innan du kör `eas build`. Annars avvisas bygget eller bygger fel version.

## Känsliga filer och hemligheter

### Variabler (rekommenderat)

- **Lägg inte** `.env` eller API-nycklar i repot.
- Sätt **miljövariabler** i EAS: [expo.dev](https://expo.dev) → Project → **Environment variables** (eller `eas env:create`). Använd **production** (och eventuellt preview/development) för respektive build-profil.
- Se [EAS_ENVIRONMENT_VARIABLES.md](EAS_ENVIRONMENT_VARIABLES.md) för hur vi använder `EXPO_PUBLIC_*`, `SUPABASE_*` m.fl. i detta projekt.

### Filer som inte får committas men behövs i bygget

Om bygget **behöver en fil** som du inte vill ha i Git (t.ex. en nyckel-fil):

1. **Base64 + EAS Secret:** Koda filens innehåll till base64, spara som EAS Secret, och skapa filen i ett **build-steg** i [.eas/build/capacitor-ios.yml](../.eas/build/capacitor-ios.yml) (t.ex. `echo $MY_FILE_SECRET | base64 -d > path/to/file`).
2. **Alternativ:** Om du inte använder `requireCommit`, kan du använda **.easignore** istället för .gitignore och *exkludera* mindre – men då laddas allt som inte matchar .easignore upp, inklusive känsliga filer om de finns i arbetskatalogen. Vi rekommenderar **Secrets + build-hook** för känsliga filer.

I detta projekt används **endast EAS Environment variables** för Supabase och API-URL; inga extra känsliga filer behövs i bygget om variablerna är satta.

## .easignore

- **Plats:** Projektets rot (samma katalog som `eas.json`).
- **Syntax:** Samma som [.gitignore](https://git-scm.com/docs/gitignore).
- **När den används:** Endast om EAS **inte** använder Git för paketering (t.ex. om du sätter miljövariabeln `EAS_NO_VCS=1`). Med **`requireCommit: true`** (som vi använder) används **inte** .easignore – då styr bara Git och .gitignore vad som laddas upp.

Om du byter till `EAS_NO_VCS=1` (ingen Git) och vill utesluta fler filer än .gitignore, skapa `.easignore` i projektroten.

## Sammanfattning

| Ämne | I detta projekt |
|------|------------------|
| Vad laddas upp | Allt som inte är ignorerat av .gitignore; med `requireCommit: true` = exakt det som finns i din senaste commit (pushad till remote vid fjärrbygge). |
| Känsliga värden | EAS Environment variables (production/preview); se [EAS_ENVIRONMENT_VARIABLES.md](EAS_ENVIRONMENT_VARIABLES.md). |
| Känsliga filer som behövs i bygget | Base64 i EAS Secret + skapa fil i build-steg i capacitor-ios.yml. |
| .easignore | Används inte när `requireCommit: true` är satt. |

## Länkar

- [How projects are uploaded to EAS Build](https://docs.expo.dev/build-reference/how-eas-build-works/#how-projects-are-uploaded-to-eas-build)
- [EAS Environment variables](https://docs.expo.dev/eas/environment-variables/)
- [How to use Git submodules](https://docs.expo.dev/build-reference/how-tos/#how-to-use-git-submodules) (exempel på base64 + secret + hook)
