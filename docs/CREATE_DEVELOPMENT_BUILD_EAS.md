---
modificationDate: March 30, 2026
title: Create a development build on EAS
description: Development builds for MÄÄK (Expo) via EAS — aligned with Expo docs, paths for this monorepo.
---

# Create a development build on EAS (MÄÄK / `apps/mobile`)

This document follows [Expo: Create a development build](https://docs.expo.dev/develop/development-builds/create-a-build/) and is tailored to **this repository**: the Expo app lives under [`apps/mobile`](../apps/mobile/), and EAS profiles are named `expo-development` / `expo-development-device` (not only `development`).

A **development build** is your own **custom dev client** (like a private Expo Go): you can use native modules and native config that Expo Go does not ship with.

**Video:** [How to create a development build](https://www.youtube.com/watch?v=uQCE9zl3dXU)

**Deeper course:** [EAS Tutorial](https://docs.expo.dev/tutorial/eas/introduction) · [playlist](https://www.youtube.com/playlist?list=PLsXDmrmFV_AS14tZCBin6m9NIS_VCUKe2)

## Prerequisites (Expo’s matrix)

Whether you build on EAS or locally depends on OS and target; see the [official prerequisites table](https://docs.expo.dev/develop/development-builds/create-a-build/#prerequisites). In short:

- **EAS cloud:** Android and iOS Simulator builds work from macOS, Windows, or Linux. **Physical iPhone** builds need a paid [Apple Developer](https://developer.apple.com) account for signing.
- **EAS `--local`:** needs local native tooling; iOS Simulator/device builds require **macOS** (Windows/Linux limited for iOS).

This project already has [`apps/mobile/eas.json`](../apps/mobile/eas.json) with `developmentClient: true` on the dev profiles. **`expo-dev-client`** is a dependency of `maak-mobile` — install or upgrade with:

```sh
cd apps/mobile
npx expo install expo-dev-client
```

(Bare / non-CNG React Native apps need [extra steps](https://docs.expo.dev/bare/install-dev-builds-in-bare/).)

## Working directory

Run EAS from **`apps/mobile`**, or from the **repo root** with the same script names (they delegate to the `maak-mobile` workspace):

```sh
cd apps/mobile
# eller från repo root:
# npm run eas:build:dev:ios
```

Monorepo context: see [EXPO_EAS_IOS.md](./EXPO_EAS_IOS.md). Capacitor iOS uses separate `capacitor-*` profiles at the repo root — do not mix those with the Expo app unless you intend to.

## Install EAS CLI and log in

```sh
npm install -g eas-cli && eas login
```

This repo also pins scripts to `npx eas-cli@^18.4.0` — you can use that instead of a global install.

## Build profiles in this repo

| Profile | Use |
|--------|-----|
| **`expo-development`** | Dev client, internal distribution. **iOS:** `simulator: true` (simulator only). **Android:** device/emulator. |
| **`expo-development-device`** | Dev client for **physical iPhone** (no `simulator` flag). |

From the **repository root**, aliases exist in [eas.json](../eas.json): `development` → `expo-development`, `development-device` → `expo-development-device`.

If you only use **`expo-development`** for iOS, builds are **for Simulator only** — they cannot be installed on a real device. Use **`expo-development-device`** for devices (and Apple signing as required).

## Android (EAS)

```sh
cd apps/mobile
eas build --platform android --profile expo-development
```

Or: `npm run eas:build:dev:android` (from `apps/mobile`).

More detail: [Android development build tutorial](https://docs.expo.dev/tutorial/eas/android-development-build/).

## iOS Simulator (EAS)

The `expo-development` profile sets [`ios.simulator: true`](https://docs.expo.dev/eas/json/#simulator) (same idea as Expo’s `development` example).

```sh
cd apps/mobile
eas build --platform ios --profile expo-development
```

Or: `npm run eas:build:dev:ios` (from repo root or `apps/mobile`).

Scripts use **`--non-interactive`** so the command exits successfully after the cloud build finishes and does **not** prompt to auto-install on Simulator (avoids spurious failures if Xcode/Simulator is missing or `xcode-select` is wrong).

**After a successful cloud build**, install on Simulator (Mac + Xcode required):

```sh
cd apps/mobile
npm run eas:build:run:ios:latest
```

Same as `eas build:run -p ios --latest` — see [Expo: simulator installs](https://docs.expo.dev/build-reference/simulators/#running-the-latest-build). From repo root: `npm run eas:build:run:ios:latest`. To pick a build from a list interactively: `npm run eas:build:run:ios`.

Or use [expo.dev](https://expo.dev/) / [Expo Orbit](https://expo.dev/orbit) instead of the CLI.

**`npm run eas:build:dev:ios:interactive`** runs a cloud build and then asks **“Install and run on simulator?”** — if you answer **yes** without a working Simulator setup, you get the same `Can't determine id of Simulator app` error and **npm exits with code 1** even though the build succeeded. Prefer **`eas:build:dev:ios`** + **`eas:build:run:ios:latest`** after fixing Xcode (below).

More detail: [iOS Simulator development build](https://docs.expo.dev/tutorial/eas/ios-development-build-for-simulators/).

### “Can’t determine id of Simulator app” / `xcode-select`

If you chose **yes** on the install prompt and saw this error, the **EAS build still succeeded** — only the local install step failed. Your log ends with a valid install URL; you can open that build on expo.dev and install via Orbit, or fix the Mac toolchain and run `npm run eas:build:run:ios:latest` (no new EAS build needed).

Quick checks on macOS:

```sh
xcode-select -p
# Expect: /Applications/Xcode.app/Contents/Developer (or your Xcode path)

xcrun simctl list devices available | head
open -a Simulator
```

Typical fixes:

1. **Xcode or Simulator not installed** — install Xcode from the Mac App Store, open it once, and install a Simulator runtime (Xcode → Settings → Platforms).
2. **Wrong developer directory** — point the CLI at Xcode:

   ```sh
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

3. **Command Line Tools only** — if `xcode-select -p` points at `/Library/Developer/CommandLineTools`, Simulator.app is not available; switch to full Xcode with the command above.
4. **No Mac** — simulator builds must be installed on a **Mac** with Xcode; on Windows/Linux, use the build artifact URL or Orbit from a Mac.

See [Build for iOS Simulators](https://docs.expo.dev/build-reference/simulators/) and [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/).

## iOS device (EAS)

Requires a paid Apple Developer account for signing.

```sh
cd apps/mobile
eas build --platform ios --profile expo-development-device
```

Or: `npm run eas:build:dev:ios:device` (`--non-interactive` by default). Use `npm run eas:build:dev:ios:device:interactive` for prompts.

More detail: [iOS device development build](https://docs.expo.dev/tutorial/eas/ios-development-build-for-devices/) · [register devices](https://docs.expo.dev/develop/development-builds/create-a-build/#create-a-build-for-the-device).

## CI / EAS Workflows

Simulator + device dev builds can be triggered with [.eas/workflows/create-development-builds.yml](../.eas/workflows/create-development-builds.yml) (profiles `expo-development` + `expo-development-device`). See [EXPO_EAS_IOS.md](./EXPO_EAS_IOS.md).

## Install the app

- **EAS cloud:** the CLI can prompt to install when the build finishes; you can also use [expo.dev](https://expo.dev/) or [Expo Orbit](https://expo.dev/orbit).
- **Local EAS output:** drag the artifact onto Simulator/emulator or use Orbit.

## Start the JavaScript bundler

After the native dev client is installed, you do **not** need to rebuild for every JS change. Start Metro as usual:

```sh
cd apps/mobile
npx expo start
```

With `expo-dev-client` installed, this targets your **development build** instead of Expo Go when appropriate.

From repo root you can use `npm run mobile` if that script exists in the root `package.json`.

## Secrets and env on EAS

Set `EXPO_PUBLIC_*` values for the Expo project on EAS (dashboard or `eas secret:create`). See [EXPO_ENV.md](./EXPO_ENV.md).

## Video walkthroughs

- [EAS Tutorial Series](https://www.youtube.com/playlist?list=PLsXDmrmFV_AS14tZCBin6m9NIS_VCUKe2)
- [Async Office Hours: development build with EAS](https://www.youtube.com/watch?v=LUFHXsBcW6w)
