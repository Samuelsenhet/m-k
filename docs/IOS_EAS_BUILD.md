# iOS build process (EAS)

This page describes how the iOS app is built on EAS Build in this project. Use it when you need to run or debug EAS iOS builds.

**Default iOS builds** (`development` / `preview` / `production` in root [eas.json](../eas.json)) use **standard Expo prebuild** (samma som `expo-*`-profiler). **Capacitor** (Vite → `cap sync` → Fastlane) använder profilerna **`capacitor-development`**, **`capacitor-preview`**, **`capacitor-production`** och [.eas/build/capacitor-ios.yml](../.eas/build/capacitor-ios.yml). För Expo-byggprocessen, se [EAS Build – iOS build process](https://docs.expo.dev/build-reference/ios-builds/).

---

## Local steps (EAS CLI)

These run on your machine before the build is sent to EAS:

1. **Commit check** – If `cli.requireCommit` is set to `true` in **eas.json**, EAS CLI checks that the git index is clean. Currently this project does not set `requireCommit`, so this step is optional.

2. **Credentials** – EAS prepares the credentials needed for the build (distribution certificate, provisioning profile). Depending on the build profile’s `credentialsSource` (or default), they come from your local **credentials.json** or from EAS servers. This project does not override `credentialsSource` in **eas.json**.

3. **Project type** – **Expo:** EAS kör `expo prebuild` (ingen incheckad `ios/` krävs). **Capacitor:** använd profil `capacitor-production` m.fl.; då finns pipelinen i **capacitor-ios.yml** och Xcode-projektet är **ios/App/App.xcodeproj**, scheme **App** (genereras av `npm run ios:build`).

4. **Tarball and upload** – EAS creates a tarball of the repo (according to your VCS workflow), uploads it to a private S3 bucket, and sends the build request to EAS Build.

---

## Remote steps (Capacitor only)

När du bygger med **`capacitor-*`**-profiler körs [.eas/build/capacitor-ios.yml](.eas/build/capacitor-ios.yml). I ordning:

1. **Checkout** – Clone the repository.
2. **NPM token** – Create **.npmrc** if `NPM_TOKEN` is set (for private packages).
3. **Install node modules** – `npm install` in the project root.
4. **Remove Expo/React Native (first pass)** – So the iOS app links only to Capacitor; then `npm prune`.
5. **Resolve build config** – EAS resolves the build configuration.
6. **Remove Expo/RN (second pass)** – Again before cap sync.
7. **Build web and sync to iOS** – Runs `npm run ios:build` (Vite build + `npx cap sync ios`).
8. **Remove Expo/RN (third pass)** – Again before pod install.
9. **Pod install** – In **ios/App**: optionally prepend `use_modular_headers!` to the Podfile if missing (for Capacitor static library), then `pod install`.
10. **Configure iOS credentials** – Create keychain, import distribution certificate, write provisioning profile to **~/Library/MobileDevice/Provisioning Profiles**.
11. **Configure iOS version** – Set version/build as needed (e.g. auto-increment for production).
12. **Generate Gymfile** – EAS creates a Gymfile from the template in the config (project **ios/App/App.xcodeproj**, scheme **App**). There is no static **ios/Gymfile** in the repo.
13. **Run Fastlane** – `fastlane gym` in the **ios** directory (or as configured by EAS).
14. **Find and upload build artifacts** – Upload the built app (e.g. .ipa) to EAS.

---

## How to run a build

**Expo (MÄÄK):** från rot:

```bash
npm run mobile:eas:build:production:ios:submit
```

eller `cd apps/mobile` och `eas build --platform ios --profile expo-production`.

**Expo preview:** `npm run ios:eas-build` (workspace).

**Capacitor (Vite → iOS):** `eas build --platform ios --profile capacitor-production` (kräver att `ios/App` finns efter `npm run ios:build` lokalt / att pipelinen skapar den).

| Profile                 | Stack        | Notes                                      |
|-------------------------|-------------|--------------------------------------------|
| development / preview / production | Expo        | Standard EAS iOS (prebuild)                |
| capacitor-development / capacitor-preview / capacitor-production | Capacitor   | **capacitor-ios.yml**, Podfile i **ios/App** |

---

## Config reference

- **[eas.json](../eas.json)** – Expo: `build.development` / `preview` / `production` ärver `expo-*`. Capacitor: `build.capacitor-*` sätter `ios.config` till **capacitor-ios.yml**.
- **[.eas/build/capacitor-ios.yml](../.eas/build/capacitor-ios.yml)** – Capacitor-pipeline (checkout, install, remove Expo/RN, ios:build, pod install, Fastlane, artefakter).

The artifact path (e.g. default **ios/build/App.ipa**) can be overridden in **eas.json** with `build.<profile>.ios.applicationArchivePath` if needed; this project does not set it.

---

## Capacitor vs standard Expo iOS

- **Expo (default)** – `expo prebuild`, vanlig EAS iOS; rot [app.config.cjs](../app.config.cjs) speglar `apps/mobile`-konfiguration för monorepo-byggen från rot.
- **Capacitor** – Ingen `expo prebuild` i den pipelinen; **ios/App** + **capacitor-ios.yml**; Gymfile genereras från mall i yml; **pod install** i **ios/App**.
