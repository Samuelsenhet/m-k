# iOS build process (EAS)

This page describes how the iOS app is built on EAS Build in this project. Use it when you need to run or debug EAS iOS builds.

This project uses a **custom** EAS build config (Capacitor + Vite, no Expo prebuild). The steps below reflect that setup. For the standard Expo iOS flow, see [EAS Build – iOS build process](https://docs.expo.dev/build-reference/ios-builds/) in the Expo docs.

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
| development            | Internal dev client (device)       | `distribution: internal`, dev client     |
| development-simulator  | iOS Simulator only                 | `simulator: true`, no device signing        |
| preview                | Internal testing                  | `distribution: internal`                   |
| production             | App Store / TestFlight            | `autoIncrement: true`, production signing  |

All profiles use the same iOS config: **capacitor-ios.yml** in `.eas/build/` (see [eas.json](../eas.json)). **Always pass a profile** when building (e.g. `eas build --platform ios --profile production`) so EAS uses this custom config instead of the default install step.

### Development builds via EAS Workflows

To create development builds for all platforms (Android, iOS device, iOS simulator) in one go, run the workflow:

```sh
eas workflow:run .eas/workflows/create-development-builds.yml
```

This runs three build jobs in parallel: Android (`development`), iOS device (`development`), and iOS simulator (`development-simulator`). See [Create development builds with EAS Workflows](https://docs.expo.dev/build-reference/eas-workflows/#create-development-builds).

---

## Troubleshooting

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
  `npx eas-cli@latest workflow:run create-production-builds.yml`  
  This starts a production iOS build (same outcome as `eas build --platform ios --profile production`).

- **GitHub trigger:** The production workflow is configured with `on: push: branches: ['main']`. To run it automatically on push to `main`, link your GitHub repo in your project’s [EAS GitHub settings](https://expo.dev/accounts/[account]/projects/[projectName]/github) (install the Expo GitHub app, then select the repo). After that, pushes to `main` will trigger the workflow; you can see runs on the project’s [workflows page](https://expo.dev/accounts/[account]/projects/[projectName]/workflows).

- **Preview builds:** A separate workflow **create-preview-builds.yml** runs iOS builds with `profile: preview` (internal distribution), optionally on push to another branch (e.g. `develop`). Run it with `npx eas-cli@latest workflow:run create-preview-builds.yml`.

For workflow syntax and more triggers, see [EAS Workflows](https://docs.expo.dev/eas/workflows/introduction/) and [Workflow syntax](https://docs.expo.dev/eas/workflows/syntax/) in the Expo docs.

---

## Differences from standard EAS iOS

- **Capacitor app** – No `expo prebuild`; we use an existing **ios/App** with Capacitor.
- **Custom build config** – The remote steps are defined in **.eas/build/capacitor-ios.yml**, not the default Expo iOS workflow.
- **Gymfile** – Generated from a template in the yml (project **ios/App/App.xcodeproj**, scheme **App**), not a checked-in **ios/Gymfile**.
- **Pod install** – Runs in **ios/App** with an optional Podfile `use_modular_headers!` fix for Capacitor.
