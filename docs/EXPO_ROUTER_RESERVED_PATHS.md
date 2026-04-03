# Expo Router – reserverade URL-sökvägar

Kort intern referens: vissa URL-paths hanteras av **Metro**, **Expo Router** eller RN och ska **inte** användas som egna routes eller statiska filer under webb. Annars kan du få 404, tyst fel, eller att dev-servern svarar med något annat än din sida.

Officiell dokumentation: [Reserved paths](https://docs.expo.dev/router/reference/reserved-paths/).

## Undvik som routes (`app/…`)

| Path / namn | Problem |
| ----------- | ------- |
| `assets` (t.ex. `app/assets.tsx`) | Metro serverar bundlade tillgångar under `/assets/*`. |
| `manifest` | Dev-servern serverar native manifest på `/manifest`. |
| `public` (om projektet har mapp `public/`) | Kan krocka med statisk serving. |
| `_sitemap` | Överskriver Expo Routers inbyggda sitemap om du menar den. |

## Undvik som statiska webbfiler

| Placering | Problem |
| --------- | ------- |
| `public/assets/…` | Samma `/assets/*`-konflikt som ovan. |

Använd t.ex. `public/images/…` eller ett annat mappnamn om du lägger till `public/`.

## Andra reserverade prefix (inga egna routes/filer där)

- `/_expo/*`
- `/_flight/*`
- `/inspector` och underpaths (RN-debugger)
- `/expo-dev-plugins/*`

`/favicon.ico` går att **ersätta** med fil i `public/` eller API-route (se länken ovan).

## MĀĀK `apps/mobile` – `assets/` i paketroten

Mappen **`apps/mobile/assets/`** (bilder för `app.json`, `require()`, m.m.) är **normal** och är **inte** samma sak som `public/assets/` på webben. Fortsätt undvika **Expo Router-rutter** som heter `assets`, `manifest` eller `public` enligt tabellen ovan.

## Se även

- [EXPO_ROUTER_MIGRATE_FROM_REACT_NAVIGATION.md](./EXPO_ROUTER_MIGRATE_FROM_REACT_NAVIGATION.md) – React Navigation → Expo Router (referens)
