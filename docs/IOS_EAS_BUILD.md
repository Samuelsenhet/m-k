# iOS build process (EAS)

This page describes how the iOS app is built on EAS Build in this project. Use it when you need to run or debug EAS iOS builds.

This project uses a **custom** EAS build config (Capacitor + Vite, no Expo prebuild). The steps below reflect that setup. For the standard Expo iOS flow, see [EAS Build – iOS build process](https://docs.expo.dev/build-reference/ios-builds/) in the Expo docs.

## Standard EAS iOS process (reference)

In the default EAS iOS flow (when no custom build config is used):

- **Local:** Commit check (if `requireCommit`), prepare credentials (local **credentials.json** or EAS), bare-project check if applicable, create tarball, upload to S3 and send build request.
- **Remote:** New macOS VM; download and unpack tarball; create **.npmrc** if `NPM_TOKEN` set; run `eas-build-pre-install` if defined; run **`npm install`** (or `yarn install`); run `npx expo-doctor`; restore credentials (keychain, distribution certificate, provisioning profile); for **managed** projects run `npx expo prebuild`; restore cache; run **`pod install`** in **ios/**; `eas-build-post-install`; update Xcode with profile ID; create **Gymfile** if missing (default); run `fastlane gym`; cache; upload artifacts; optional `eas-build-on-success` / `eas-build-on-error` / `eas-build-on-complete`.

Full details: [EAS Build – iOS build process](https://docs.expo.dev/build-reference/ios-builds/).

## How this project differs

- **Custom config:** All iOS profiles use [.eas/build/capacitor-ios.yml](.eas/build/capacitor-ios.yml); the standard default steps are replaced by this file.
- **Install:** `npm ci --omit=dev` (not `npm install`); no devDependencies (avoids sharp on EAS).
- **No Expo prebuild:** We use an existing Capacitor **ios/** (or generate with `cap add ios` on the worker); no `npx expo prebuild`.
- **Node:** Explicit Node 22 via nvm on the worker (Capacitor CLI requirement).
- **Gymfile:** Generated from the custom config template (project **ios/App/App.xcodeproj**, scheme **App**); we do not commit **ios/Gymfile**.
- **Pod install:** Runs only if **ios/App/Podfile** exists (Capacitor 8 SPM may omit it); optional `use_modular_headers!` fix before `pod install`.

---

## Local steps (EAS CLI)

These run on your machine before the build is sent to EAS:

1. **Commit check** – If `cli.requireCommit` is set to `true` in **eas.json**, EAS CLI checks that the git index is clean. Currently this project does not set `requireCommit`, so this step is optional.

2. **Credentials** – EAS prepares the credentials needed for the build (distribution certificate, provisioning profile). Depending on the build profile’s `credentialsSource` (or default), they come from your local **credentials.json** or from EAS servers. This project does not override `credentialsSource` in **eas.json**.

3. **Project type** – We use a pre-existing **ios/** directory (Capacitor). There is no Expo prebuild step. The Xcode project is **ios/App/App.xcodeproj**, scheme **App**.

4. **Tarball and upload** – EAS creates a tarball of the repo (according to your VCS workflow), uploads it to a private S3 bucket, and sends the build request to EAS Build.

---

## Remote steps (this project)

On the EAS build worker, the pipeline is defined in [.eas/build/capacitor-ios.yml](.eas/build/capacitor-ios.yml). In order:

1. **Checkout** – Clone the repository.
2. **NPM token** – Create **.npmrc** if `NPM_TOKEN` is set (for private packages).
3. **Install node modules** – `npm ci --omit=dev` (production deps only; no devDependencies like sharp).
4. **Remove Expo/React Native (first pass)** – So the iOS app links only to Capacitor; then `npm prune`.
5. **Resolve build config** – EAS resolves the build configuration.
6. **Remove Expo/RN (second pass)** – Again before cap sync.
7. **Build web and sync to iOS** – Runs `npm run build`, then if **ios/App/Podfile** is missing runs `npx cap add ios`, then `npx cap sync ios`. So the iOS project can be generated on the worker if not committed.
8. **Remove Expo/RN (third pass)** – Again before pod install.
9. **Pod install** – In **ios/App**: optionally prepend `use_modular_headers!` to the Podfile if missing (for Capacitor static library), then `pod install`.
10. **Configure iOS credentials** – Create keychain, import distribution certificate, write provisioning profile to **~/Library/MobileDevice/Provisioning Profiles**.
11. **Configure iOS version** – Set version/build as needed (e.g. auto-increment for production).
12. **Generate Gymfile** – EAS creates a Gymfile from the template in the config (project **ios/App/App.xcodeproj**, scheme **App**). There is no static **ios/Gymfile** in the repo.
13. **Run Fastlane** – `fastlane gym` in the **ios** directory (or as configured by EAS).
14. **Find and upload build artifacts** – Upload the built app (e.g. .ipa) to EAS.

---

## How to run a build

From the project root:

```bash
npm run ios:eas-build
```

or:

```bash
eas build --platform ios
```

When prompted, choose a profile:

| Profile                | Use case                          | Notes                                      |
|------------------------|------------------------------------|--------------------------------------------|
| development            | Internal (device)                  | `distribution: internal`, no dev client |
| development-simulator  | iOS Simulator only                 | `simulator: true`, no device signing        |
| preview                | Internal testing                  | `distribution: internal`                   |
| production             | App Store / TestFlight            | `autoIncrement: true`, production signing  |

All profiles use the same iOS config: **capacitor-ios.yml** in `.eas/build/` (see [eas.json](../eas.json)). If you omit the `--profile` flag, EAS CLI defaults to the profile named **production** (if it exists). To be explicit, use e.g. `eas build --platform ios --profile production`.

### Development builds via EAS Workflows

To create development builds for all platforms (Android, iOS device, iOS simulator) in one go, run the workflow:

```sh
eas workflow:run .eas/workflows/create-development-builds.yml
```

This runs three build jobs in parallel: Android (`development`), iOS device (`development`), and iOS simulator (`development-simulator`). See [Create development builds with EAS Workflows](https://docs.expo.dev/build-reference/eas-workflows/#create-development-builds).

---

## Troubleshooting

### Why can Android succeed but iOS fail?

Android and iOS use **different build pipelines** in this project:

- **Android:** Uses the **default** EAS build (no `config` override in **eas.json**). Steps: checkout → `npm install` (or similar) → optional `expo-doctor` → Gradle build. No custom YAML.
- **iOS:** Uses the **custom** config [.eas/build/capacitor-ios.yml](.eas/build/capacitor-ios.yml). Steps: checkout → Node 22 → `npm ci --omit=dev` → remove Expo/RN → build web + `cap sync ios` → scheme creation → pod install → credentials → Fastlane. **expo-doctor is not run** in this pipeline.

So a successful Android build and a failed iOS build usually mean the failure is **iOS-specific**, for example:

- **Missing ios/App/Podfile** – The custom config runs `npx cap add ios` only if the Podfile is missing; ensure **ios/** is committed or that the worker can create it (Node 22, `cap sync`).
- **Scheme "App" does not exist** – The shared scheme must reference the **App target** (PBXNativeTarget), not the App group; the YAML uses `awk` to extract the correct BlueprintIdentifier.
- **Credentials** – iOS needs distribution certificate and provisioning profile; Android uses a different signing path.
- **Local only:** "Volume out of space" or "Failed to resolve package dependencies" in Xcode – free disk space on your Mac or fix CocoaPods/SPM in **ios/App**.

The **"Request timed out"** from `npx expo-doctor` is a **network timeout** during the Expo config schema check. It does **not** run in the iOS EAS pipeline, so it is not the cause of EAS iOS failures. If you run expo-doctor, run it from the **project root** (m-k); for EAS iOS, check the **build logs** on expo.dev for the actual error.

### "npm ci --include=dev exited with non-zero code: 1"

This means EAS ran the **default** install step (with devDependencies) instead of the custom config. Fix:

1. **Use an explicit profile** so the custom config is used:  
   `eas build --platform ios --profile production` (or `preview` / `development`). Do not rely on the default when prompted.
2. **Check eas.json** – Each profile must have `"ios": { "config": "capacitor-ios.yml" }`. The custom config runs `npm ci --omit=dev` (no sharp/devDependencies).
3. **If you still see the error** – Ensure **package-lock.json** is committed and in sync (`npm install` locally, then commit). Use Node 22 (see `.nvmrc`).

---

## Config reference

For the full **eas.json** schema and options, see [Configuration with eas.json](https://docs.expo.dev/build/eas-json/) in the Expo docs.

- **[eas.json](../eas.json)** – `build.<profile>.ios.config` is set to `"capacitor-ios.yml"` for development, preview, and production (file in `.eas/build/`). Each profile also sets `environment` (development / preview / production) for EAS env handling.
- **[.eas/build/capacitor-ios.yml](../.eas/build/capacitor-ios.yml)** – Full custom pipeline (checkout, install, remove Expo/RN, ios:build, pod install, credentials, Gymfile template, Fastlane, artifact upload).

The artifact path (e.g. default **ios/build/App.ipa**) can be overridden in **eas.json** with `build.<profile>.ios.applicationArchivePath` if needed; this project does not set it.

---

## EAS Workflows

Workflows live in **.eas/workflows/** and automate builds (and optionally submit). This project uses an iOS-only production workflow.

- **Run the production workflow from the CLI:**  
  `npx eas-cli@latest workflow:run .eas/workflows/create-production-builds.yml`  
  (The workflow file path is required.) This starts a production iOS + Android build (same outcome as running the build profile for each platform).

- **GitHub trigger:** The production workflow is configured with `on: push: branches: ['main']`. To run it automatically on push to `main`, link your GitHub repo in your project’s [EAS GitHub settings](https://expo.dev/accounts/[account]/projects/[projectName]/github) (install the Expo GitHub app, then select the repo). After that, pushes to `main` will trigger the workflow; you can see runs on the project’s [workflows page](https://expo.dev/accounts/[account]/projects/[projectName]/workflows).

- **Preview builds:** A separate workflow **create-preview-builds.yml** runs iOS + Android builds with `profile: preview` (internal distribution), optionally on push to another branch (e.g. `develop`). Run it with `npx eas-cli@latest workflow:run .eas/workflows/create-preview-builds.yml`.

For how EAS Workflows and GitHub Actions fit together (who runs what, Expo GitHub App, optional GHA-triggered workflow), see [EAS_WORKFLOWS_AND_GITHUB_ACTIONS.md](EAS_WORKFLOWS_AND_GITHUB_ACTIONS.md). For workflow syntax and more triggers, see [EAS Workflows](https://docs.expo.dev/eas/workflows/introduction/) and [Workflow syntax](https://docs.expo.dev/eas/workflows/syntax/) in the Expo docs.

---

## Differences from standard EAS iOS

- **Capacitor app** – No `expo prebuild`; we use an existing **ios/App** with Capacitor.
- **Custom build config** – The remote steps are defined in **.eas/build/capacitor-ios.yml**, not the default Expo iOS workflow.
- **Gymfile** – Generated from a template in the yml (project **ios/App/App.xcodeproj**, scheme **App**), not a checked-in **ios/Gymfile**.
- **Pod install** – Runs in **ios/App** with an optional Podfile `use_modular_headers!` fix for Capacitor.
