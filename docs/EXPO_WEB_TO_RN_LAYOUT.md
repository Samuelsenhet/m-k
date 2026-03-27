# Webb → Expo RN: layout- och komponentlexikon

**Kanonisk plan:** `~/.cursor/plans/expo_rn_port_kickoff_f588fd01.plan.md`  
**Design tokens (källa):** [src/index.css](../src/index.css), [tailwind.config.ts](../tailwind.config.ts)  
**Delade token (hex/const):** [packages/core/src/tokens.ts](../packages/core/src/tokens.ts) (när monorepo är aktivt)

## Global skal (återkommande Tailwind → RN)

| Webb (mönster) | RN-motsvarighet |
| -------------- | --------------- |
| `min-h-screen` + `container max-w-2xl mx-auto px-4 pt-6 pb-24` | `SafeAreaView` + max bredd ~448–512 px (centrerat), `paddingHorizontal: 16`, `paddingTop: 24`, `paddingBottom` = tab bar + safe area |
| `safe-area-bottom`, `pb-24` med `BottomNav` | `useSafeAreaInsets().bottom` + fast tab bar-höjd (~72–80) |
| `bg-gradient-to-b from-background to-muted/20` | `LinearGradient` (expo-linear-gradient) eller enhetlig `backgroundColor` + subtil gradient från `@maak/core` tokens |
| `bg-black` (profil hero) | `backgroundColor: '#000'` + samma bildlager |
| `rounded-3xl` + `shadow-elevation-1` + `border border-primary/20` | `borderRadius: 24–28`, iOS `shadow*`, Android `elevation`, border `rgba(75,110,72,0.2)` |
| Primär knapp `var(--gradient-primary-button)` + `h-14` + `rounded-2xl` | `LinearGradient` `#4B6E48` → `#5FA886`, `minHeight: 56`, `borderRadius: 16` |
| `sticky top-0 z-10 bg-background/95 backdrop-blur border-b` | Fast header ovanför `FlatList` / `ScrollView` `stickyHeaderIndices`, eller collapsible header |
| Radix **Sheet** (`max-h-[70vh]`, scroll inuti) | `@gorhom/bottom-sheet` eller `Modal` + `ScrollView` |
| Radix **Dialog** / **AlertDialog** | `Alert.alert` eller modal + `Text` + två `Pressable` (t.ex. radera konto) |
| `grid grid-cols-2 gap-4` | `flexDirection: 'row'`, `flexWrap: 'wrap'`, `width: '48%'` eller två kolumner med `flex: 1` |

## Segmentkontroll (Chat)

Webb: [Chat.tsx](../src/pages/Chat.tsx) — `COLORS` från [src/design/tokens.ts](../src/design/tokens.ts), två `button` med vit aktiv bakgrund + skugga.

RN: två `Pressable` i `View` med `flex: 1`, `borderRadius: 12`, aktiv: vit bakgrund + lätt skugga; inaktiv: transparent, grå text.

## Per-yta: React-komponent → fil → RN-notering

| Yta / komponent | Sidfil | Viktiga underdelar | RN-notering |
| --------------- | ------ | ------------------ | ----------- |
| `WaitingPhase` | [Matches.tsx](../src/pages/Matches.tsx) (villkor) | [WaitingPhase.tsx](../src/components/journey/WaitingPhase.tsx) | Centrerad kolumn, kort, nedräkning, CTA-knapp |
| `Chat` | [Chat.tsx](../src/pages/Chat.tsx) | `MatchList`, `ChatWindow`, segment | Lista + stack till chattrum; `?match=` deep link |
| `ProfileView` | [Profile.tsx](../src/pages/Profile.tsx) | [ProfileView.tsx](../src/components/profile/ProfileView.tsx) | Bild `Image` + overlay-knappar, mörk footer |
| Profil sheet (Radix) | Profile | Scroll, sektioner, arketyper 2×2 | Bottom sheet / full screen modal |
| `PhoneAuth` | [PhoneAuth.tsx](../src/pages/PhoneAuth.tsx) | [PhoneInput.tsx](../src/components/auth/PhoneInput.tsx), CardV2 | Steg + OTP; tangentbordstyper |
| `LandingPage` | [Index.tsx](../src/pages/Index.tsx) | [LandingPage.tsx](../src/components/landing/LandingPage.tsx) | `ScrollView`, stacked cards, gradient bakgrund |
| `PersonalityGuide` | [PersonalityGuide.tsx](../src/pages/PersonalityGuide.tsx) | kategori-kort `badge-*` | Lång `ScrollView`, accordion per rad |
| `Terms` / `About` / `Reporting` | respektive page | sticky header + `max-w-lg` innehåll | `FlatList` eller `ScrollView` + sticky header |
| `Report` / `Appeal` / `ReportHistory` | respektive page | CardV2, länkar | Form + `expo-image-picker` för bilagor |
| `Notifications` | [Notifications.tsx](../src/pages/Notifications.tsx) | switches | `Switch`, sektioner |
| Inställningar sheet | Profile | Sheet, kort, sliders | Bottom sheet; `@react-native-community/slider` + ev. multi-slider för ålder |
| `DemoSeed` / `DemoGroupChat` | demo pages | — | Senare; kan hoppas över i MVP |

## Typsnitt

Webb: **DM Sans** + **Playfair Display** (Google Fonts i CSS).

Expo: `expo-font` + `@expo-google-fonts/dm-sans` + `@expo-google-fonts/playfair-display` (eller bundlade filer). Rubriker: serif; UI: sans.

## Övrigt

- **BottomNav:** [BottomNavV2.tsx](../src/components/ui-v2/navigation/BottomNavV2.tsx) — tre flikar, `layoutId`-indikator → RN: `react-native-reanimated` shared element eller enkel grön streck ovanför aktiv ikon.
- **Mascot / empty states:** återanvänd PNG/SVG från webb; `Image` / `react-native-svg`.

Uppdatera denna fil när webben ändrar struktur eller när en Expo-skärm får avvikelser (notera i route-matrisen).
