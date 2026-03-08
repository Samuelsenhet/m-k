# Expo Brownfield (isolated approach)

Projektet är konfigurerat enligt [Expo brownfield – isolated approach](https://docs.expo.dev/brownfield/isolated-approach/): du kan bygga Expo/React Native-delen som en inbäddad artefakt (XCFramework på iOS, AAR på Android) och integrera den i en befintlig native-app.

## Prerequisites

- **Projektväg utan mellanslag (rekommenderas):** `pod install` (CocoaPods/Nanaimo) kräver att sökvägen till projektet **inte innehåller mellanslag**. Om du får fel som `ParseError - Dictionary missing ';' after key-value pair for "path", found "-"`, ligger repot troligen i en mapp med mellanslag (t.ex. `GitHub - APP`). **Lösning:** flytta eller klona repot till en sökväg utan mellanslag (t.ex. `~/Developer/m-k` eller `~/Downloads/GitHub-APP/m-k`) eller byt namn på överordnad mapp till t.ex. `GitHub-APP`.
- Om du måste ha projektet i en sökväg med mellanslag quotar skriptet `brownfield-build-ios.mjs` automatiskt path-värden i `project.pbxproj` efter prebuild så att `pod install` fungerar (se [CocoaPods/Nanaimo#13](https://github.com/CocoaPods/Nanaimo/issues/13)).

## Where to run

Kör **alla** brownfield- och Expo-kommandon från **projektroten** (m-k). Skripten `brownfield:build:ios`, `brownfield:build:android` och `expo:start` finns i [package.json](package.json); `expo-brownfield` och plugin-konfigurationen ligger i [app.json](app.json).

```bash
cd /path/to/m-k
npm run brownfield:build:ios
```

## När används brownfield?

- **Nuvarande iOS-app**: Byggs med **Capacitor** (Vite → `dist/` → `ios/App`) och EAS custom workflow (`.eas/build/capacitor-ios.yml`). Det är den huvudsakliga leveransen.
- **Brownfield**: Om du vill **bädda in** Expo/RN som en del av en annan native-app (t.ex. visa vissa skärmar i React Native i en befintlig Swift/Kotlin-app), bygg artefakterna med kommandona nedan och följ [Expo-dokumentationen](https://docs.expo.dev/brownfield/isolated-approach/) för att lägga in dem i host-appen.

## Konfiguration

- **app.json**: Plugin `expo-brownfield` med:
  - **iOS**: `targetName: MaakBrownfield`, `bundleIdentifier: com.samuelsenhet.maak.brownfield`
  - **Android**: `libraryName: maakbrownfield`, `group: com.samuelsenhet`, `package: com.samuelsenhet.maak.brownfield`
- **package.json**: `"main": "expo-router/entry"` så att Metro och brownfield-build använder Expo Router (**src/app/**).

## Kommandon

| Kommando | Beskrivning |
|----------|-------------|
| `npm run brownfield:build:ios` | Bygger Expo-appen som XCFramework. Använder [scripts/brownfield-build-ios.mjs](scripts/brownfield-build-ios.mjs): sparar Capacitor **ios/** tillfälligt, kör `expo prebuild` + `expo-brownfield build:ios`, återställer **ios/**. Output: **artifacts/** (t.ex. `hermesvm.xcframework`, `MaakBrownfield.xcframework`). |
| `npm run brownfield:build:android` | Bygger och publicerar AAR till lokal Maven (~/.m2). |
| `npm run brownfield:prebuild` | Genererar native-projekt (ios/, android/) med brownfield-targets för felsökning. |
| `npm run expo:start` | Startar Metro; använd när du testar host-appen i debug och den laddar JS från Metro. |

## Integrera i din native-app

### iOS

1. Kör `npm run brownfield:build:ios`.
2. Dra de genererade `.xcframework` från `artifacts/` in i ditt Xcode-projekt.
3. Initiera och visa den inbäddade React Native-vyn från din Swift/ObjC-kod (se [Expo brownfield – isolated approach](https://docs.expo.dev/brownfield/isolated-approach/) och `BrownfieldMessaging` för kommunikation).

### Android

1. Kör `npm run brownfield:build:android`.
2. Lägg till `mavenLocal()` i repositories och lägg till dependency enligt plugin-config (group/package/version).
3. Använd `BrownfieldActivity` eller `showReactNativeFragment()` i den aktivitet som ska visa Expo-skärmen (med AppCompat-tema).

## Felsökning

- **ParseError för "path" / "found \"-\"" vid pod install** – Se **Prerequisites** ovan: projektvägen får inte innehålla mellanslag; flytta repot eller använd en sökväg utan mellanslag. Skriptet quotar path i pbxproj som workaround om du kör från en sökväg med mellanslag.
- **"Could not find brownfield iOS scheme"** – `expo-brownfield build:ios` letar efter en katalog under **ios/** som innehåller `ReactNativeHostManager.swift` (skapas bara av `expo prebuild` med brownfield-plugin). I det här projektet är **ios/** från Capacitor och har inte det targetet. Använd därför `npm run brownfield:build:ios` (kör scriptet som byter tillfälligt ut ios/, kör prebuild + build, återställer ios/).

## Begränsningar

- Endast **en** inbäddad Expo-app per native-app (en runtime per app).
- `expo-updates` antar en Expo-projekt-URL per app.
- Se [Expo brownfield – limitations](https://docs.expo.dev/blog/expo-brownfield-how-to-add-expo-to-your-existing-native-app-without-a-rewrite/#limitations-and-trade-offs).

## Web- och Capacitor-build (oförändrat)

- **Webb**: `npm run dev` / `npm run build` (Vite, använder inte package.json `main`).
- **iOS (Capacitor + EAS)**: `npm run ios:build`, `npm run ios:eas-build` – använder fortfarande custom workflow och Capacitor, inte brownfield-artefakter.
