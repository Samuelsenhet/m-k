# EAS Workflows and GitHub Actions

This doc describes how **EAS Workflows** and **GitHub Actions** are used together in this repo, and how to integrate them further.

## Who does what

- **Mobile builds and E2E** are handled by **EAS Workflows** (`.eas/workflows/`). They are triggered by GitHub events via the [Expo GitHub App](https://expo.dev/accounts/[account]/projects/[project]/github) (install the app and link the repo), or run manually with `eas workflow:run .eas/workflows/<name>.yml` (the path is required; e.g. `.eas/workflows/create-production-builds.yml`).
- **Supabase (migrations, edge functions, type check)** are handled by **GitHub Actions** (`.github/workflows/`): CI on PR, production deploy on push to `main`, staging deploy on push to `develop`.

## Which workflow runs when

| Event | GitHub Actions | EAS Workflows |
|-------|----------------|---------------|
| Push to `main` | Production: Supabase link, migrations, edge functions; Mobile: lint, test, then EAS production workflow | Create Production Builds (iOS + Android) |
| Push to `develop` | Staging: Supabase link, migrations, edge functions | Create Preview Builds (iOS + Android) |
| Pull request | CI: Supabase local DB, type gen, verify types | E2E: iOS build + Maestro |

You can also run **lint and tests in GHA, then trigger an EAS Workflow** from the same run so the GitHub Actions tab shows one pipeline (see [.github/workflows/mobile-build.yaml](../.github/workflows/mobile-build.yaml)). That workflow requires the **EXPO_TOKEN** secret in GitHub (Settings → Secrets and variables → Actions). If the Expo GitHub App is also connected, both GHA and the Expo App may trigger EAS on push to `main`; to avoid duplicate production builds, either disable the Expo workflow trigger for `main` in the Expo dashboard or remove the `run_eas_workflow` job from `mobile-build.yaml`.

## Expo GitHub App (required for automatic EAS triggers)

For EAS Workflows to run on `push` / `pull_request`, the repo must be connected in the [Expo project GitHub settings](https://expo.dev/accounts/[account]/projects/[project]/github). If it is not connected, workflows only run when triggered manually with `eas workflow:run ...`.

## Android

Preview and production EAS workflows build both **iOS** (custom Capacitor config) and **Android** (default EAS build). Android uses the same `preview` / `production` profiles as in [eas.json](../eas.json).

## Fingerprint, build-or-update, and repack

Expo’s article [How to integrate EAS Workflows with GitHub Actions](https://expo.dev/blog/how-to-integrate-eas-workflows-with-github-actions) describes:

- **Fingerprint + build or update** – Only run a full native build when native code changed; otherwise publish an EAS Update (JS bundle). Saves time when most commits are JS-only.
- **Repack for E2E** – Reuse an existing build with the same native fingerprint, re-bundle JS, re-sign, then run Maestro instead of doing a full build every PR.

This project uses a **custom Capacitor iOS config** ([.eas/build/capacitor-ios.yml](.eas/build/capacitor-ios.yml)), not the default Expo prebuild. EAS fingerprint and repack are designed for standard Expo/React Native. Before adding fingerprint + update or repack:

- Confirm whether **EAS Update** is enabled and compatible with your Capacitor setup.
- Confirm in Expo docs or support whether **repack** is supported for custom build configs.

## References

- [Get started with EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/) – first workflow, run locally, GitHub triggers.
- [EAS Workflows introduction](https://docs.expo.dev/eas/workflows/introduction/)
- [EAS Workflows syntax](https://docs.expo.dev/eas/workflows/syntax/)
- [IOS_EAS_BUILD.md](IOS_EAS_BUILD.md) – iOS build process and workflow CLI usage
- Expo article: [How to integrate EAS Workflows with GitHub Actions](https://expo.dev/blog/how-to-integrate-eas-workflows-with-github-actions) – triggering workflows from GHA, fingerprint, build-or-update, repack.
