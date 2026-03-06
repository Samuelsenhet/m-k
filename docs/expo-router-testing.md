# Expo Router testing (`expo-router/testing-library`)

`expo-router/testing-library` is a testing submodule from the **expo-router** package. It builds on **@testing-library/react-native** and lets you run integration tests for Expo Router apps (in-memory router, mock filesystem, deep-link simulation).

Official docs: [Testing configuration for Expo Router](https://docs.expo.dev/router/reference/testing/).

## Requirements

- **jest-expo** (Jest preset for Expo)
- **@testing-library/react-native**
- Tests must **not** live inside **src/app** (that folder is only for routes/layouts). Use e.g. **tests/** or **__tests__/**.

This project currently uses **Vitest** and **@testing-library/react** for the main Vite app. To test Expo Router routes (when running with Metro/Expo), use Jest + `expo-router/testing-library` in a separate test setup.

## Main API: `renderRouter`

Import from `expo-router/testing-library`:

```ts
import { renderRouter, screen } from 'expo-router/testing-library';
```

`renderRouter` extends React Native Testing Library’s `render` and adds an **initialUrl** option for deep-linking. It accepts:

| Input | Description |
|-------|--------------|
| **Object** (mock filesystem) | Keys = route paths (no leading `./` or `/`, no extension). Values = mock components. |
| **String[]** | List of route paths; components are `null`. Good for navigation/URL tests. |
| **String** (path) | Path to a fixture directory (relative to the test file). |
| **{ appDir, overrides }** | Fixture path + inline overrides for specific routes. |

Example (inline mock + initialUrl):

```tsx
import { renderRouter, screen } from 'expo-router/testing-library';
import { View } from 'react-native';

it('navigates to route', async () => {
  const Mock = () => <View />;
  renderRouter(
    { index: Mock, 'directory/a': Mock },
    { initialUrl: '/directory/a' }
  );
  expect(screen).toHavePathname('/directory/a');
});
```

## Jest matchers

Available on `expect(screen)` when using `expo-router/testing-library`:

- **toHavePathname(pathname)** – current pathname
- **toHavePathnameWithParams(pathnameWithQuery)** – pathname + query string
- **toHaveSegments(segments)** – current segments (e.g. `['[id]']`)
- **useLocalSearchParams(params)** – local search params
- **useGlobalSearchParams(params)** – global search params
- **toHaveRouterState(state)** – full router state

## Running Expo Router tests in this project

- **Script:** `npm run test:expo` (Jest with jest-expo; only runs files in **__tests__/** matching `*-test.ts(x)`).
- **Example:** `__tests__/home-screen-test.tsx` – uses `render` from `@testing-library/react-native` and asserts on the HomeScreen from `@/app/index`.

## Optional: add dependencies and script

If you want to run Expo Router tests with Jest:

1. Install (if not already):  
   `@testing-library/react-native`  
   (jest-expo is already in the project.)
2. Configure Jest to use **jest-expo** and the Expo Router testing-library matchers (see [Expo unit testing](https://docs.expo.dev/develop/unit-testing)).
3. Put tests in **tests/** (or similar), not in **src/app**.
4. In tests: `import { renderRouter, screen } from 'expo-router/testing-library';`
