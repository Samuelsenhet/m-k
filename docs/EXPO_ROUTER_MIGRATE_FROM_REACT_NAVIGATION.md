# Expo Router – migrering från React Navigation (referens)

**Officiell guide (källtext uppdateras av Expo):** [Migrate from React Navigation](https://docs.expo.dev/router/migrate/from-react-navigation/)

Den här filen är **inte** en kopia av Expos sida – bara en intern landningspunkt och checklista för MĀĀK.

## Nuvarande läge i repot

- **`apps/mobile`** använder **Expo Router** (`main`: `expo-router/entry`, plugin `expo-router` i `app.json`, routes under **`src/app/`**).
- **`ThemeProvider`** från `@react-navigation/native` används i root-layout (rekommenderat när `NavigationContainer` hanteras av Expo Router).
- Guiden ovan är mest relevant när ni **refaktorerar kvarvarande React Navigation-tänk** (t.ex. `navigation`-props, `Link`-API, `resetRoot`, custom linking) eller **lägger till nya flöden**.

## Före / under migrering (från Expo)

- Dela upp skärmar i **egna filer**; döp gärna routes **kebab-case / lowercase**; **startskärm** som **`index`** motsvarar `/`.
- **Params:** bara serialiserbara värden (string, number, boolean); undvik funktioner/objekt i query – använd `useRouter` / context där det behövs.
- Undvik **`return null`** i root medan navigation förväntas; tänk på webbens **static rendering** om ni bygger web.
- Byt **`resetRoot`** mot tydlig navigation (t.ex. `router.replace('/')`).
- **Path aliases:** `apps/mobile/tsconfig.json` har `@/assets/*` → `./assets/*` (före `@/*` → `./src/*` så Metro/TS inte skickar `@/assets/…` till `src/assets/`). Samma ordning finns i `babel.config.js` (`babel-plugin-module-resolver`).

## API: React Navigation → Expo Router (kort)

| Tidigare / RN-vana | Expo Router |
| ------------------ | ----------- |
| `navigation.push(...)` m.m. | `useRouter()` |
| `route.params` | `useLocalSearchParams()` (global: `useGlobalSearchParams`) |
| `<Link to="…">` | `<Link href="/…">`; `asChild` för egen primitiv |
| `<NavigationContainer />` | Hanteras av Expo Router – använd hooks (`usePathname`, `useSegments`, …) och docs för ref/state/theme |
| `NavigationContainer` ref / `getRootState` | `useRootNavigationState()` m.fl. – se guiden |
| Analytik / splash | [Screen tracking](https://docs.expo.dev/router/reference/screen-tracking/), [Splash screen](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) |
| `SplashScreen` import | Överväg `SplashScreen` från **`expo-router`** enligt Expo |

## Paketnotis

- Expo Router lägger till bl.a. **safe area**-stöd.
- **`react-native-gesture-handler`** ingår inte automatiskt (t.ex. drawer) – installera vid behov; undvik onödig webb-bundle.

## Se även

- [EXPO_ROUTER_RESERVED_PATHS.md](./EXPO_ROUTER_RESERVED_PATHS.md)
- Route-matris: [EXPO_PORT_ROUTE_MATRIX.md](./EXPO_PORT_ROUTE_MATRIX.md)
