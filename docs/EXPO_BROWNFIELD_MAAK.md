# Expo brownfield (integrated) – MÄÄK-projektspecifik guide

**Syfte:** Koppla [Expos “integrated approach”](https://docs.expo.dev/brownfield/integrated-approach/) till den här monorepon så vi vet *när* guiden gäller och *var* kod lever.

**Officiell referens (Expo):** *How to add Expo to a native app using the integrated approach* — RN/Expo bäddas in i en **befintlig** iOS/Android-app (Gradle, CocoaPods, `ReactActivity` / motsvarande).

---

## 1. Nuvarande arkitektur i detta repo (baseline)

| Del | Sökväg / verktyg | Roll |
| --- | ---------------- | ---- |
| Webb | `src/`, Vite, `config/vite.config.ts` | Huvudprodukt i webbläsare |
| Delad logik & design | `packages/core` (`@maak/core`) | Tokens, Supabase-hjälpare, personlighetstyper, Edge Function-fel m.m. |
| Mobil (primär native) | `apps/mobile/` (Expo SDK ~55, Expo Router) | **Fristående** Expo-app — *inte* inbäddad i annan native-kod |
| iOS (webb-wrapper) | Capacitor (`capacitor.config.ts`, skript `ios:*` i rot-`package.json`) | Webbläsarvy av **byggd webb**, inte samma som Expo-RN |

**Slutsats:** Standardvägen för MÄÄK-mobil är **egen Expo-app + EAS-build**, inte “RN som bibliotek i gammal Kotlin/Swift-app”. Det motsvarar **inte** Expos integrated brownfield-flöde i drift idag — och det är okej.

---

## 2. Tre sätt att tänka (för att undvika begreppsförvirring)

| Begrepp | Vad det betyder för MÄÄK |
| ------- | ------------------------ |
| **Integrated brownfield (Expo-dokumentet)** | Befintlig **native**-app öppnar en **React Native**-vy; Metro vid dev; Gradle/Pods konfigureras mot Expo-projektets rot. |
| **Isolerad Expo-modul (“black box”)** | Annan app länkar in ett färdigt RN-paket; se Expos *isolated approach*. |
| **Vår nuvarande Expo-app** | Hela konsumentappen **är** Expo; entry = `apps/mobile`, build = `eas build`. Ingen separat “värd-app” som äger native shell. |

---

## 3. När ska teamet öppna Expos integrated-guide?

**Ja, läs och följ den officiella guiden om:**

- Ni har (eller ska ha) en **befintlig** App Store/Play-app skriven i **Swift/Kotlin** (eller liknande) och ska bara lägga in **en eller flera RN-skärmar** där.
- Ni **inte** tänker ersätta den appen med en ren `apps/mobile`-build.

**Nej, behövs normalt inte om:**

- All mobilutveckling sker i **`apps/mobile`** och släpps via **EAS** (som idag).
- Ni bara vill förbättra web-i-webview (Capacitor) — det är **inte** samma integration som Expo brownfield.

---

## 4. Projektspecifik checklista *om* integrated brownfield blir aktuell

Använd denna som intern gate — detaljer finns i Expo’s guide och i [bare minimum-mallar](https://github.com/expo/expo/tree/main/templates/expo-template-bare-minimum).

### Förberedelse (repo & monorepo)

- [ ] Beslut: **Expo-projektets rot** ska vara `apps/mobile` (rekommenderat i detta repo) eller ett nytt underkatalogsnamn — dokumentera i denna fil.
- [ ] Säkerställ att **native-byggen** kan se `node_modules` (npm workspaces löser ofta det; vid avvikande struktur sätt `projectRoot` enligt Expo för custom layout).
- [ ] Kör `npm install` från **monoreporoten**; vid ändringar i delad kod: `npm run core:build`.

### Android (översikt — följ Expo’s steg exakt)

- [ ] `settings.gradle` / `build.gradle` / `app/build.gradle` / `gradle.properties` enligt **bare minimum** + Expo autolinking.
- [ ] `AndroidManifest.xml` (inkl. debug för cleartext mot Metro).
- [ ] `Application` + `ReactActivity` (t.ex. `MyReactActivity`) med `mainComponentName` som matchar JS entry.
- [ ] Vid **custom sökväg** till JS-projekt: justera `projectRoot` i Gradle som Expo beskriver.

### iOS (när det tas in)

- [ ] CocoaPods enligt Expo RN/Expo-modules; jämför med bare minimum-mallen.
- [ ] Samma princip: peka mot rätt **JS-projektrot** om strukturen inte är standard `android/` + `ios/` bredvid varandra på samma sätt som mallen.

### Utveckling & bygg

- [ ] Metro: `npm run mobile` eller `cd apps/mobile && npx expo start` — se [EXPO_ENV.md](./EXPO_ENV.md) för `EXPO_PUBLIC_*`.
- [ ] För **fristående** Expo-app (nuvarande läge): `eas build` körs från `apps/mobile` eller via rot-skript — se [EXPO_ENV.md](./EXPO_ENV.md) (EAS).
- [ ] Brownfield **inbäddning** använder ofta samma Metro i dev; release-byggen följer er native pipeline + ev. bundling — aligna med Expo’s aktuella docs.

### Delad affärslogik

- [ ] Behåll **Supabase** och domänlogik i **`@maak/core`** där det är möjligt så webb / Expo / ev. framtida inbäddning inte divergerar.
- [ ] Undvik att duplicera `resolveProfilesAuthKey`, personlighetstyper eller Edge Function-felhantering — använd `@maak/core`.

---

## 5. Capacitor vs Expo brownfield (kort)

| | Capacitor (detta repo) | Integrated Expo brownfield |
| --- | --- | --- |
| Innehåll | Byggd **webb** (HTML/JS från Vite) | **React Native**-träd |
| Native kod | WebView-shell | Full RN-runtime i processen |
| Samma som Expo integrated-guide? | **Nej** | **Ja** |

---

## 6. Beslutslogg (fyll i vid behov)

| Datum | Beslut                                                              |
| ----- | ------------------------------------------------------------------- |
|       | Primär mobil = `apps/mobile` + EAS (ingen brownfield-inbäddning).   |
|       | *(Lägg till rad om ni senare bäddar in RN i annan app.)*            |

---

## 7. Relaterade dokument

- [EXPO_ENV.md](./EXPO_ENV.md) — miljövariabler, EAS, `npm run core:build`
- [EXPO_PORT_ROUTE_MATRIX.md](./EXPO_PORT_ROUTE_MATRIX.md) — webb ↔ Expo routes
- [EXPO_WEB_TO_RN_LAYOUT.md](./EXPO_WEB_TO_RN_LAYOUT.md) — layout-lexikon (om det finns)
