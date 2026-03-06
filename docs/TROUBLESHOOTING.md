# Troubleshooting

Fixing common issues in the MÄÄK project (Vite, Capacitor, EAS iOS).

---

## Project-specific (Vite + Capacitor + EAS)

### EAS build: "Would you like us to run 'git init'?"

The build fails on the worker because the project tarball had no git repo (stdin not readable, so the prompt fails).

**Fix:** Ensure **.git** is **not** listed in **.easignore**. EAS expects a real git repo on the worker. See the comment in [.easignore](../.easignore); if you use `.easignore`, do not exclude `.git`.

### EAS build: wrong install step or sharp/devDependencies errors

If you see errors like `npm ci --include=dev exited with non-zero code: 1` or sharp/build failures, EAS is using the default install instead of the custom Capacitor config.

**Fix:** Always pass an explicit profile so the custom config is used:

```sh
eas build --platform ios --profile production
```

(or `preview` / `development`). Each profile in [eas.json](../eas.json) must point to [.eas/build/capacitor-ios.yml](../.eas/build/capacitor-ios.yml). See [IOS_EAS_BUILD.md](IOS_EAS_BUILD.md#troubleshooting).

### "web assets directory (./dist) must contain an index.html"

Capacitor sync runs before the web app is built. Build first, then sync:

```sh
npm run build
npm run ios:sync
```

Or use the single command that does both: `npm run ios:build`.

### Node version (EBADENGINE / ConfigError)

The project expects **Node 22** (see [.nvmrc](../.nvmrc)). EAS custom config uses Node 22 on the worker. Locally:

```sh
nvm install 22 && nvm use
```

### Mascot / sharp (dev scripts, EAS)

Mascot scripts (`mascot:sprite`, `mascot:clean`, etc.) need the **sharp** devDependency. EAS builds use `npm ci --omit=dev`, so sharp is not installed on the build server (and is not required for the iOS app). If sharp fails to build locally, see [mascot-system.md](mascot-system.md) §12 (build-from-source, env vars).

---

## Expo Router (reference)

This project is **Vite + React + Capacitor**; routing is handled by React Router (or similar), not Expo Router. The `expo-router` entry in [app.json](../app.json) is for EAS/metadata. If you work on or integrate an Expo/React Native variant, or see Expo Router errors in tooling, the following notes apply.

*Source: Expo docs – Troubleshooting (Expo Router setup).*

### Missing files or source maps in React Native DevTools

This can happen if Chrome DevTools has exclusions in its ignore list. To fix:

1. Start **React Native DevTools** by pressing **j** from the development server running in the terminal.
2. Open **Settings** (gear icon).
3. Under **Extensions**, click **Restore defaults and reload**.
4. Open **Settings** again → **Ignore List** tab.
5. Uncheck any exclusions for `/node_modules/`.

See [React Native DevTools](https://reactnative.dev/docs/react-native-devtools).

### `EXPO_ROUTER_APP_ROOT` not defined

If `process.env.EXPO_ROUTER_APP_ROOT` is not defined you may see:

```text
Invalid call at line 11: process.env.EXPO_ROUTER_APP_ROOT
First argument of require.context should be a string.
```

This can happen when the Babel plugin `expo-router/babel` is not used in **babel.config.js**. Try clearing the cache:

```sh
npx expo start --clear
```

Alternatively, create an **index.js** in the project root:

```jsx
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
```

Then set the app entry in **package.json**: `"main": "index.js"`. Do not use this to change the root directory (**app**); it won't account for usage in any other places.

### `require.context` not enabled

This can happen when using a custom `@expo/metro-config` that does not enable context modules. Expo Router requires **metro.config.js** to use `expo-router/metro` as the default configuration. Delete **metro.config.js**, or extend `expo/metro-config`. See [Customizing Metro](https://docs.expo.dev/guides/customizing-metro).

### Missing back button (modals / initial route)

If you set up a modal or another screen that is expected to have a back button, add **unstable_settings** to the route's layout so the initial route is configured. Initial routes are somewhat unique to mobile apps and fit awkwardly in the system — improvements pending.

```tsx
export const unstable_settings = {
  initialRouteName: 'index',
};
```

---

## See also

- [IOS_EAS_BUILD.md](IOS_EAS_BUILD.md) – Full EAS iOS pipeline and troubleshooting.
- [EAS_FIRST_IOS_BUILD.md](EAS_FIRST_IOS_BUILD.md) – First-time iOS build steps.
- [mascot-system.md](mascot-system.md) – Mascot assets and sharp/local scripts.
