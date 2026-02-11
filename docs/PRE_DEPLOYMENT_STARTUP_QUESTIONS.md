# MÄÄK – Startup Questions (besvarade)

**Datum:** 2025-02-11  
**Syfte:** Svar på frågorna i FINAL PRE-DEPLOYMENT CHECKLIST innan Fas 1 påbörjas.

---

## 1. Vilken i18n-lösning används redan?

**Svar:** **react-i18next** (i18next + initReactI18next).

- **Konfiguration:** `src/i18n/index.ts` – laddar `sv.json` och `en.json`, default `lng: localStorage.getItem('language') || 'sv'`, fallback `sv`.
- **Användning:** `useTranslation()` i komponenter, t.ex. `t('settings.title')`, `t('profile.bio')`.
- **Filer:** `src/i18n/locales/sv.json`, `src/i18n/locales/en.json`.

**Konsekvens:** Ingen next-intl. Språkbyte = sätta `localStorage.setItem('language', 'en'|'sv')` och anropa `i18n.changeLanguage()`. Språkväxlare kan läggas i Inställningar (Fas 1/Fas 5).

---

## 2. Var finns nuvarande tema/color definitions?

**Svar:** **CSS-variabler i `src/index.css`** (ingen separat `theme.ts`).

- **:root** – Eucalyptus Grove: `--background`, `--foreground`, `--primary` (forest green), `--secondary` (sage), `--muted`, `--accent`, `--card`, `--surface`, `--destructive`, `--border`, `--ring`, `--radius`, `--duration-*`, gradients (`--gradient-primary`, `--gradient-hero`, `--gradient-card`), personlighet (`--diplomat`, `--strateger`, etc.).
- **Tailwind:** `tailwind.config.ts` refererar färger via `hsl(var(--primary))` etc.; typsnitt: `font-sans: DM Sans`, `font-serif: Playfair Display`.

**Konsekvens:** Fas 2 (rosa/eucalyptus polish) = uppdatera variablerna i `src/index.css` och eventuellt lägga till/ändra utility-klasser. Ingen `src/lib/theme.ts` finns.

---

## 3. Kan du visa aktuell `tailwind.config.js`?

**Svar:** Projektet använder **`tailwind.config.ts`** (TypeScript).

- **Content:** `./src/**/*.{ts,tsx}`, `./pages/**`, `./components/**`, `./app/**`.
- **Theme extend:** container, fontFamily (DM Sans, Playfair Display), fontSize (display, headline, title, body, label, caption), colors (border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card, surface, tertiary, sidebar, personality, dimension), borderRadius, transitionDuration, keyframes (accordion, scale-in, progress-fill), animation.
- **Plugins:** tailwindcss-animate.
- **darkMode:** `["class"]`.

---

## 4. Vilka är de mest kritiska buggarna redan kända?

**Svar:** Enligt Fas 1-checklistan (prioriterad ordning):

1. **Profilinformation visas inte** – Alla ifyllda fält (presentation, intressen, etc.) ska synas på profilsidan.
2. **Land-val default** – Sverige som default, men andra länder ska gå att välja.
3. **Scroll-problem** – Notifikationer och Prestationer ska vara fullt scrollbara.
4. **Prestationer navigation** – Tydlig "gå tillbaka"-knapp.
5. **Match-inställningar** – Alla knappar/onPress handlers ska fungera.
6. **E-post verifiering** – Kontrollera att alla e-postadresser är korrekta (config/länkar).
7. **Inställningar text** – Om "setting." visas någonstans ska det vara "Inställningar" på svenska.
8. **Språkstandard** – Svensk default, plus språkbyte SV ↔ EN.

**Notering:** i18n är redan svensk default. "setting." har inte hittats som literal i koden; `settings.title` är "Inställningar" i sv.json.

---

## 5. Vilken är huvudnavigationens struktur?

**Svar:** **BottomNav** (fixerad nederkant) + React Router.

- **Nav-items:** Matchning (`/matches`), Chatt (`/chat`), [Demo (`/demo-seed`) om `isDemoEnabled`], Profil (`/profile`).
- **Komponent:** `src/components/navigation/BottomNav.tsx` – använder `Link` + `useLocation` för aktiv flik; grid 3 eller 4 kolumner; Framer Motion för indikator.
- **Routes (App.tsx):** `/`, `/phone-auth`, `/onboarding`, `/profile`, `/matches`, `/chat`, `/group-chat`, `/group-chat/create`, `/group-chat/:groupId`, `/match/:userId`, `/view-match`, `/demo-seed`, `/demo-samlingar`, `/notifications`, `/personality-guide`, `/terms`, `/privacy`, `/about`, `/reporting`, `/report`, `/report-history`, `/admin/reports`, `/admin/appeals`, `/appeal`. Catch-all `*` → NotFound.
- **Övrigt:** `OnlineCountBar` renderas i `AppContent` ovanför Routes.

---

## Nästa steg

Påbörja **Fas 1: Kritiska Buggfixes** enligt checklistan. Rapportering enligt Ralph Loop-format efter varje fas/block.
