# Create your first iOS build (EAS)

This guide walks you through creating your first iOS build with EAS Build for this project. The **MÄÄK** app uses **Expo** by default; **Capacitor** (Vite → iOS) is optional and uses separate `capacitor-*` build profiles.

## Prerequisites

- **Expo account** – EAS Build works with a free Expo account. Sign up at [expo.dev/signup](https://expo.dev/signup).
- **Apple Developer Program** – Required if you want to build for the App Store or TestFlight (release builds). Membership is $99 USD/year at [developer.apple.com/programs](https://developer.apple.com/programs). For internal distribution only (preview/development profiles), you may not need it; EAS will prompt when credentials are needed.

This project is already configured: root **eas.json**, **app.config.js** (monorepo → `apps/mobile`), and **apps/mobile/app.json**. Capacitor cloud builds use **.eas/build/capacitor-ios.yml** with `--profile capacitor-*`. You do not need to run `eas build:configure` unless you want to change the setup.

## Install EAS CLI

Install the CLI globally (or use `npx eas-cli@latest` instead of `eas` in the commands below):

```sh
npm install -g eas-cli
```

To check for updates, run the same command again.

## Log in to your Expo account

If you are not already signed in:

```sh
eas login
```

Check that you are logged in:

```sh
eas whoami
```

## Run an iOS build

From the project root (Expo preview):

```sh
npm run ios:eas-build
```

Production + submit:

```sh
npm run mobile:eas:build:production:ios:submit
```

Or from `apps/mobile`: `eas build --platform ios --profile expo-production`.

Capacitor only: `eas build --platform ios --profile capacitor-production` (requires the Capacitor iOS pipeline).

You can attach a message to the build (visible on the build dashboard):

```sh
eas build --platform ios --message "First internal build"
```

When prompted, choose a profile:

| Profile      | Use case                    | Notes                                      |
|-------------|-----------------------------|--------------------------------------------|
| development | Internal dev client         | Internal distribution, dev client         |
| preview     | Internal testing            | Internal distribution                      |
| production  | App Store / TestFlight      | Auto-increment build number, store signing |

**iOS credentials:** If you have not set up a distribution certificate and provisioning profile yet, EAS will offer to generate them. Sign in with your Apple Developer account when prompted. For existing credentials, you can use the ones stored on EAS or provide local credentials.

For a detailed description of what runs locally and on the EAS build server, see [IOS_EAS_BUILD.md](IOS_EAS_BUILD.md).

## Wait for the build to complete

By default, `eas build` waits for the build to finish. You can cancel with Ctrl+C and still monitor the build via the link printed in the terminal.

- **Build dashboard:** [expo.dev/builds](https://expo.dev/builds) (or your account’s build page).
- List recent builds:

  ```sh
  eas build:list
  ```

If the build fails, check the logs on the build details page and refer to [IOS_EAS_BUILD.md](IOS_EAS_BUILD.md) and the [EAS troubleshooting guide](https://docs.expo.dev/build-reference/troubleshooting/).

## Install and run the app

- **Internal distribution (development / preview):** Open the build details page on the EAS dashboard and use the **Install** button to install on a registered device. Register devices with `eas device:create` (requires `eas-cli`).
- **Production (TestFlight / App Store):** Submit the build with [EAS Submit](https://docs.expo.dev/submit/introduction/), then install via TestFlight or the App Store.

## Next steps

- [IOS_EAS_BUILD.md](IOS_EAS_BUILD.md) – Local and remote build steps, config reference, differences from standard EAS iOS.
- [Configuration with eas.json](https://docs.expo.dev/build/eas-json/) – Build profiles and options.
- [EAS Submit](https://docs.expo.dev/submit/introduction/) – Submit builds to the App Store.
