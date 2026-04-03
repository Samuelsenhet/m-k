# Expo-port: route-matris (MVP / Senare / Out)

**Kanonisk agentplan:** `~/.cursor/plans/expo_rn_port_kickoff_f588fd01.plan.md`  
**Webb-router:** [src/routes.tsx](../src/routes.tsx)  
**Layout-lexikon webb → RN:** [EXPO_WEB_TO_RN_LAYOUT.md](./EXPO_WEB_TO_RN_LAYOUT.md)  
**Miljövariabler:** [EXPO_ENV.md](./EXPO_ENV.md)  
**Reserverade URL-paths (Expo Router):** [EXPO_ROUTER_RESERVED_PATHS.md](./EXPO_ROUTER_RESERVED_PATHS.md)  
**RN → Expo Router (referens):** [EXPO_ROUTER_MIGRATE_FROM_REACT_NAVIGATION.md](./EXPO_ROUTER_MIGRATE_FROM_REACT_NAVIGATION.md)

## Övergripande (Fas 0)

| Beslut | Värde |
| ------ | ----- |
| Målplattform först | **iOS** (Android kan följa med samma kodbas) |
| Referensbilder | Cursor-projekt-assets: `Screenshot_2026-03-21_at_*` m.fl. (kopiera till `docs/design-screenshots/` vid behov) |
| RN-stack (kickoff) | **Expo SDK** + **Expo Router** + **StyleSheet** (NativeWind/Tamagui kan införas senare) |

## Route-matris

| path | webPage | mvp | status | sharedHooks / data | blockers |
| ---- | ------- | --- | ------ | ------------------ | -------- |
| `/` | [Index.tsx](../src/pages/Index.tsx) | MVP | **Webb:** Done · **Expo:** TODO (landning) | `useAuth`, landning/test → `personality_results` | Mobil: [`app/index.tsx`](../apps/mobile/app/index.tsx) är **auth/onboarding-gate** (Redirect), ingen marknadslandning som webbens `/`. Delat budskap/CTA finns i onboarding (`WelcomeScreenRN`), inte som första skärm. |
| `/phone-auth` | [PhoneAuth.tsx](../src/pages/PhoneAuth.tsx) | MVP | Done (v1) | `usePhoneAuth`, Supabase auth | SMS-provider; se `apps/mobile/app/phone-auth.tsx` |
| `/onboarding` | [Onboarding.tsx](../src/pages/Onboarding.tsx) | MVP | Done (v1) | `profiles`, `personality_results`, `profile_photos` | ID-verifiering = placeholder i mobil; se `apps/mobile/app/onboarding.tsx` |
| `/profile` | [Profile.tsx](../src/pages/Profile.tsx) | MVP | Done (delvis) | `profiles`, `personality_results`, utloggning | Mobil: [`(tabs)/profile.tsx`](../apps/mobile/app/(tabs)/profile.tsx) — namn/bio, foton (`ProfilePhotosSection`), inställnings-sheet (`ProfileSettingsSheet`: språk + länkar). **Saknas vs webb:** hero/karusell, penna/redigera, Instagram, plats/yrke, intressen chips, dejtingpreferenser, 2×2-arketyper, m.m. |
| `/matches` | [Matches.tsx](../src/pages/Matches.tsx) | MVP | Done (MVP) | `useMatches`, `useMatchStatus`, `match-daily`, `match-status` | Mobil: [`(tabs)/index.tsx`](../apps/mobile/app/(tabs)/index.tsx). Vänteläge `journey_phase === WAITING`: nedräkning + text; **saknas vs spec:** maskot, carousel-prickar, knapp “Fortsätt utforska”, profiltips. |
| `/chat` | [Chat.tsx](../src/pages/Chat.tsx) | MVP | Done (MVP) | `messages`, realtime, mutual lista, `group_messages` | Mobil: [`(tabs)/chat.tsx`](../apps/mobile/app/(tabs)/chat.tsx) — Chatt \| Samling, sök 1:1; Samling → push till dedikerad route (nedan). **Tomt 1:1:** text (`matches.noMatches`), **saknas:** maskot-illustration enligt spec. |
| `/match/:userId` | [ViewMatchProfile.tsx](../src/pages/ViewMatchProfile.tsx) | MVP | TODO | `useMatches` | — |
| `/view-match` | [ViewMatchProfile.tsx](../src/pages/ViewMatchProfile.tsx) | MVP | Done (MVP) | query `match`, `MatchProfileScreen` | Mobil: [`apps/mobile/app/view-match.tsx`](../apps/mobile/app/view-match.tsx) |
| `/notifications` | [Notifications.tsx](../src/pages/Notifications.tsx) | MVP | TODO | `useNotificationFeed` | Push (Expo) ej i webb |
| `/personality-guide` | [PersonalityGuide.tsx](../src/pages/PersonalityGuide.tsx) | MVP | TODO | statiskt + typer | — |
| `/terms` | [Terms.tsx](../src/pages/Terms.tsx) | MVP | **Expo:** Done (placeholder) | innehåll i komponent | Mobil: [`apps/mobile/app/terms.tsx`](../apps/mobile/app/terms.tsx) (webbinnehåll via browser / bas-URL). |
| `/reporting` | [Reporting.tsx](../src/pages/Reporting.tsx) | MVP | **Expo:** Done (placeholder) | statiskt | Mobil: [`apps/mobile/app/reporting.tsx`](../apps/mobile/app/reporting.tsx). |
| `/about` | [About.tsx](../src/pages/About.tsx) | MVP | **Expo:** Done (placeholder) | statiskt | Mobil: [`apps/mobile/app/about.tsx`](../apps/mobile/app/about.tsx). |
| `/report` | [Report.tsx](../src/pages/Report.tsx) | MVP | TODO | `reportAction`, Supabase | filuppladdning RN |
| `/report-history` | [ReportHistory.tsx](../src/pages/ReportHistory.tsx) | MVP | TODO | Supabase | — |
| `/appeal` | [Appeal.tsx](../src/pages/Appeal.tsx) | MVP | TODO | Supabase | — |
| `/group-chat` | [GroupChatList.tsx](../src/pages/GroupChatList.tsx) | MVP | **Expo:** delvis (lista i chat-flik) | Supabase | Ingen egen route; **Samling**-flik i [`(tabs)/chat.tsx`](../apps/mobile/app/(tabs)/chat.tsx). |
| `/group-chat/create` | [CreateGroupChat.tsx](../src/pages/CreateGroupChat.tsx) | MVP | **Expo:** Done (modal) | Supabase | [`CreateGroupModal`](../apps/mobile/components/chat/CreateGroupModal.tsx) från chat-fliken; efter skapande → `/group-chat/:id`. |
| `/group-chat/:groupId` | [GroupChatWindow.tsx](../src/pages/GroupChatWindow.tsx) | MVP | **Expo:** Done (v1) | Supabase realtime | Mobil: [`apps/mobile/app/group-chat/[groupId].tsx`](../apps/mobile/app/group-chat/[groupId].tsx) → `GroupChatRoom`. |
| `/demo-seed` | [DemoSeed.tsx](../src/pages/DemoSeed.tsx) | Senare | TODO | demo | endast dev |
| `/demo-samlingar` | [DemoGroupChat.tsx](../src/pages/DemoGroupChat.tsx) | Senare | TODO | demo | endast dev |
| `/launch-checklist` | [LaunchChecklist.tsx](../src/pages/LaunchChecklist.tsx) | Senare | TODO | intern | — |
| `/admin/reports` | [AdminReports.tsx](../src/pages/AdminReports.tsx) | Senare | TODO | admin | ev. separat app |
| `/admin/email` | [AdminEmail.tsx](../src/pages/AdminEmail.tsx) | Senare | TODO | admin | — |
| `/admin/appeals` | [AdminAppeals.tsx](../src/pages/AdminAppeals.tsx) | Senare | TODO | admin | — |
| `*` | [NotFound.tsx](../src/pages/NotFound.tsx) | MVP | TODO | — | — |

**mvp:** `MVP` = första App Store-mål (justera med produktägare). `Senare` = efter MVP. `Out` = medvetet bort (lägg till motivering i `notes`).

**status:** Uppdatera till `Done` när Expo-skärmen uppfyller DoD i planen.

## Produkt- & designparitet (mobil vs spec, 2026-03)

Referens: övergripande tonalitet, landning, auth, vänteläge, chattlista, profil, inställningar. Jämfört mot **`apps/mobile`** (Expo Router).

| Område | Spec / intention | Byggt i kod nu? | Kommentar |
| ------ | ---------------- | --------------- | --------- |
| **Tonalitet & färger** | Svenska, lugn ton, ljus bakgrund, skogs-/sagegrönt primärt, korall accent | **Delvis** | [`maakTokens`](../packages/core/src/tokens.ts): `#F2F0EF` bakgrund, `#4B6E48` primär, `coral` finns. Kopierar webbens palett. |
| **Typsnitt** | Serif rubriker, sans bröd/knappar | **Nej (MVP)** | Huvudsakligen systemets sans-serif; `SpaceMono` laddas i root layout men används sparsamt (`StyledText`). Ingen serif för rubriker i appen ännu. |
| **Maskot** | Rosa figur: vänteläge, tomma tillstånd, landning | **Delvis** | `WelcomeScreenRN` använder emoji (🌿), inte illustrerad maskot. Vänteläge på matchning och tom chattlista **utan** maskot-bild. |
| **1. Landning /** | Logotyp, CTA, budskap, punkter, exempelkort, online-rad, villkor – start utan konto | **Nej** | `app/index.tsx` redirectar till `phone-auth` / onboarding / tabs; ingen dedikerad marknadslandning som webbens `Index.tsx`. |
| **2. /phone-auth** | Tillbaka, stegprickar, kort m. ikon, rubrik, SMS-förklaring, landskod, Skicka kod | **Delvis** | Tillbaka, kort, ♥, steg phone → verify → ålder (`AgeVerificationRN`). **Saknas:** stegindikator (prickar); fältet är svenskt mobilformat utan +46-väljare i samma UI som specen beskriver. |
| **3. Vänteläge (matches, WAITING)** | Nedräkning, lugn copy, carousel-prickar, tid för nästa omgång, CTA utforska, profiltips, tabbar | **Delvis** | [`(tabs)/index.tsx`](../apps/mobile/app/(tabs)/index.tsx): kicker, titel, brödtext, timer, nästa reset. **Saknas:** prickar/carousel, primär knapp “Fortsätt utforska”, profiltips-rad, maskot. |
| **4. Chattlista** | Rubrik, ev. filterikoner, segment Chatt \| Samling, sök, tomt läge m. maskot | **Delvis** | Rubrik, segment, sök på Chatt. Tomt: endast text. Samling: förklaring + **+**; grupp öppnas på `/group-chat/[groupId]`. |
| **5. Profil** | Hero/karusell, kugghjul + penna, meta, arketyp, intressen, preferenser, 2×2-arketyper, fakta-rutnät | **Delvis** | Namn/bio/spara, foton, arketyp-rad om data finns, inställningar via ⚙. **Saknas:** mesta “rik” profil vs webb (`Profile.tsx`). |
| **6. Inställningar** | Sheet: online-status, konto-ID, språk, notiser, integritet, matchnings-sliders, support, logga ut, radera konto | **Delvis** | [`ProfileSettingsSheet`](../apps/mobile/components/profile/ProfileSettingsSheet.tsx): rubrik, språk (sv/en), länkar terms/about/reporting, notistext (hint), Stäng/Done. **Saknas:** online-pill, användarnamn/ID, notis-toggle, integritet “Hantera”, matchningsinställningar (`MatchingSettings`), utloggning/radera (utloggning ligger på profilskärmen, ej i sheet). |

**En mening per yta (nu-läge, mobil):**

| Yta | En mening |
| --- | --------- |
| Landning | **Ej byggd som egen skärm** – gate skickar vidare till inloggning eller app. |
| Telefon + SMS | **Kärnflöde finns** – SMS, verifiering, ålder; UI är enklare än full spec. |
| Väntan på matchning | **Kärninfo finns** (timer + nästa omgång); engagement-UI enligt spec saknas. |
| Chattlista | **Lista + Samling + route till gruppchatt**; tomt läge utan maskot. |
| Profil | **Redigering + foton + begränsad inställnings-sheet**; inte full “visa för andra”-profil som webben. |
| Inställningar | **Språk + juridik/om/rapportering**; inte full konto-/matchnings-/support-panel. |

## Root layout (webb)

[RootLayout.tsx](../src/RootLayout.tsx): consent, GDPR, `Outlet`, PWA `InstallPrompt`, `DevDiagnosticsPanel` — motsvarande i Expo: ev. splash + consent-screen + dev-meny.

## Ägarskap

- **Produkt:** bekräfta att MVP-kolumnen stämmer (t.ex. om notiser ska vara Senare).
- **Teknik:** admin-routes förblir Senare om de inte ska skeppas i konsumentappen.
