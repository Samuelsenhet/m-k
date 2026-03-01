# MÄÄK Design System

Formell dokumentation av appens design system. Byggt enligt **MaakUnifiedDesignSystem.jsx** (MÄÄK CLUADE). Alla komponenter och tokens finns i `src/components/ui-v2/` och relaterade moduler.

---

## 1. Översikt

- **Identitet:** Eucalyptus Grove (Forest Green + Sage) + Coral-accents (Dribbble-inspirerad).
- **Filosofi:** Passa → Chatta → Se profil. Inga swipes, inga likes, inga procent, ingen marknadsplatsmekanik.
- **Källa:** `MaakUnifiedDesignSystem.jsx` är den visuella specifikationen; implementationen i appen följer den exakt där det är angivet.

---

## 2. Färgpalett (hex)

### Primary – Forest Green (CTAs, tillit, tillväxt)

| Token   | Hex       |
|--------|-----------|
| 50     | #F0F7F4   |
| 100    | #D9EDE4   |
| 200    | #B5DBC9   |
| 300    | #8AC4A9   |
| 400    | #5FA886   |
| **500**| **#4B6E48** (huvudfärg) |
| 600    | #3D5A3B   |
| 700    | #2F472E   |
| 800    | #253D2C   (text på ljus bakgrund) |
| 900    | #1A2D1E   |

### Coral – Emotionell värme (Start Chat, notiser, ringar)

| Token   | Hex       |
|--------|-----------|
| 50     | #FFF5F3   |
| 100    | #FFE8E4   |
| 200    | #FFD4CC   |
| 300    | #FFB5A8   |
| 400    | #FF9080   |
| **500**| **#F97068** (accent) |
| 600    | #E85550   |
| 700    | #C9403B   |

### Sage – Mjuk betoning (bakgrunder, inaktiva element)

| Token   | Hex       |
|--------|-----------|
| 50     | #FDFCFA   |
| 100    | #F8F6F1   |
| 200    | #F0EDE4   |
| 300    | #E4DED0   |
| 400    | #D1C8B5   |
| **500**| **#B2AC88** |
| 600    | #968F6B   |
| 700    | #787254   |
| 800    | #5A5640   |
| 900    | #3D3B2C   |

### Neutral

| Token     | Hex       |
|----------|-----------|
| white    | #FFFFFF   |
| offWhite | #FAFAF8   |
| cream    | #F5F4F1   |
| sand     | #ECEAE5   |
| stone    | #D4D1CA   |
| gray     | #9A9790   |
| slate    | #6B6860   |
| charcoal | #3D3B36   |
| dark     | #1F1E1B   |

### Arketyper (personlighet)

| Nyckel     | Main     | Light    | Namn        | Emoji |
|-----------|----------|----------|-------------|-------|
| diplomat  | #8B5CF6  | #EDE9FE  | Diplomaten  | 🕊️   |
| strateger | #3B82F6  | #DBEAFE  | Strategen   | 🎯   |
| byggare   | #4B6E48  | #D9EDE4  | Byggaren    | 🏗️   |
| upptackare| #F59E0B  | #FEF3C7  | Upptäckaren | 🧭   |

---

## 3. Typografi

- **Sans:** `"DM Sans", system-ui, sans-serif`
- **Serif / heading:** `"Playfair Display", Georgia, serif`

CSS-variabler i `src/index.css`:

- `--font-body` / `--font-heading`
- Tailwind: `font-body`, `font-heading`

---

## 4. Komponentkatalog (ui-v2)

### Buttons

- **ButtonPrimary** – huvud-CTA
- **ButtonCoral** – emotionell CTA (chat, firande)
- **ButtonSecondary** – sekundär handling
- **ButtonGhost** – tertiär / länk-liknande
- **ButtonIcon** – ikonknapp

### Input

- **InputV2** – textfält (variant: default, filled, outline, error)
- **InputSearchV2** – sökfält (rounded-full, pl-12 för ikon)
- **InputOTPV2** / **InputOTPV2Group** / **InputOTPV2Slot** – OTP-kod

### Avatar

- **AvatarV2**, **AvatarV2Image**, **AvatarV2Fallback**
- **AvatarWithRing** – ring (coral etc.)
- **OnlineIndicator**
- **ArchetypeAvatar**

### Badge

- **ArchetypeBadge** – arketyp (diplomat, strateger, byggare, upptackare)
- **MatchTypeBadge** – likhet / motsats
- **StatusBadge** – chat-status (start-chat, your-turn)

### Card

- **CardV2**, **CardV2Header**, **CardV2Title**, **CardV2Content**, **CardV2Footer**
- **ChatListItemCard**
- **BestMatchCard**
- **MatchProfileCardLight**, **MatchProfileCardDark**
- **InterestChipV2**

### Match

- **MatchCelebration**
- **ActionButtons** – Passa / Chatta / Se profil
- **MatchCardClassic**
- **MatchListItem**

### Navigation

- **BottomNavV2**
- **OnlineBannerV2**
- **ProgressSteps**

### Chat

- **ChatBubbleV2**
- **ChatInputBarV2**
- **ChatHeaderV2**
- **ChatEmptyStateV2**
- **AIChatBubble**

### Empty states

- **EmptyStateWithMascot** – screenState, title, description, optional action

### FAS 5 – Screens

- **VideoCallScreen** – Kemi-Check videosamtal
- **PhotoUploadScreen** – onboarding fotouppladdning (6-grid)
- **MatchListPage** – Dagens matchningar med filter (Alla / Likhets / Motsats)
- **ProfilePageDark** – mörk profilvy (ProfilePageMaak)

---

## 5. Mascot-systemet

- **Regel:** Mascoten visas endast när den lär ut, lugnar, förklarar, väntar eller firar varsamt. Aldrig som dekoration, aldrig hyperaktiv.
- **Källa:** `src/lib/mascot/index.ts` – MASCOT_SCREEN_STATES, STATE_TOKEN_MAP, getMascotTokenForState, getMascotLayoutForState, getMascotAnimationForState.
- **UI:** `useMascot(screenState)` → `<Mascot {...mascot} />`. Se `docs/mascot-system.md`.
- **Storlekar:** hero (empty/onboarding), medium (AI/sekundär), icon (logo/badges).
- **Assets:** PNG i `public/mascot/` med SVG-fallback i `MascotSvgFallback`.

---

## 6. Migreringsguide

Full app uses ui-v2 for buttons, inputs, cards, avatars, chat, match, navigation, and empty states. Input, Avatar, and primary actions have been migrated to InputV2, AvatarV2, and ButtonPrimary/ButtonCoral. Primitives such as Sheet, Tabs, Label, Select, Checkbox, Textarea, AlertDialog, DropdownMenu, Dialog, Progress, Switch, Slider, ScrollArea, Collapsible, Tooltip, Toaster remain from ui/ and are themed with MAAK tokens via CSS variables.

Hela appen använder ui-v2 för knappar, inputfält, kort, avatarer, chatt, matchning, navigation och empty states. Input, Avatar och primära handlingar är migrerade till InputV2, AvatarV2 samt ButtonPrimary/ButtonCoral. Primitiv som Sheet, Tabs, Label, Select, Checkbox, Textarea, AlertDialog, DropdownMenu, Dialog, Progress, Switch, Slider, ScrollArea, Collapsible, Tooltip och Toaster finns kvar i ui/ och är temade med MÄÄK-tokens via CSS-variabler.

Sidor som använder ui-v2 konsekvent:

- **PhoneAuth** – InputOTPV2, Label
- **OnboardingWizard** – ProgressSteps
- **Matches** – EmptyStateWithMascot, CardV2, ButtonPrimary/ButtonCoral/ButtonIcon, BestMatchCard, MatchCelebration
- **Chat / MatchList** – EmptyStateWithMascot, ChatListItemCard, AvatarWithRing
- **ChatWindow** – ChatBubbleV2, ChatHeaderV2, ChatInputBarV2, ChatEmptyStateV2
- **Profile** – CardV2, ButtonPrimary, ButtonGhost, ButtonIcon

---

## 7. FAS-struktur och status

| FAS | Innehåll | Status |
|-----|----------|--------|
| 1   | Mascot assets, SVG-fallback, felhantering | Klar |
| 2   | ProgressSteps, ArchetypeAvatar, MatchCardClassic, MatchListItem, EmptyStateWithMascot, AIChatBubble | Klar |
| 3   | PhoneAuth (InputOTPV2), OnboardingWizard (ProgressSteps), Profile (CardV2/ButtonPrimary), Chat (EmptyState, ChatWindow V2) | Klar |
| 4   | CSS-verktyg (gradient-primary, safe-area) | Klar |
| 5   | VideoCallScreen, PhotoUploadScreen, MatchListPage, ProfilePageDark | Klar |
| 6   | Group Chat ui-v2, final verification | Klar |

Demo av alla komponenter: **UiV2Demo** (t.ex. via `/demo-seed` eller inbäddad sida).

---

## 8. PRD-implementering (US-001–US-017)

**Full implementation status:** Alla 17 User Stories i `docs/prd/PRD_DESIGN_SYSTEM.md` är implementerade och avbockade.

- **US-001–US-014:** Design tokens, Landing, Matches, Chat, ChatWindow, Profile, ViewMatchProfile, BottomNavV2, empty states, AI panel, Onboarding, VideoChat, OnlineBanner, MatchCelebration.
- **US-015:** Input/InputOTP/InputSearch ui-v2 (PhoneAuth, Chat search).
- **US-016:** InterestChipV2 (Profile, ProfileEditor, ViewMatchProfile).
- **US-017:** GroupChatList och GroupChatRoom använder ui-v2 (ChatBubbleV2, ChatInputBarV2, COLORS). Screen-filer importerar COLORS från `src/design/tokens.ts` (inga lokala duplicat).

Build, lint och typecheck ska passera enligt Definition of Done.

---

## 9. Visuell verifiering (US-017)

Den sista punkten i PRD US-017 är: **"Verifiera visuellt att alla skärmar matchar MaakUnifiedDesignSystem.jsx"**.

**Om riktiga skärmar inte fungerar** (t.ex. 401, ingen backend, eller inloggning krävs): du kan verifiera designen via **demo-läget** istället. Demo-sidorna (`/demo-seed` och `/demo-samlingar`) är uppdaterade till samma ui-v2-komponenter och COLORS som resten av appen, så att du kan kontrollera utseendet utan att behöva fungerande backend. Sätt `VITE_ENABLE_DEMO=true` i `.env` och öppna `/demo-seed` (länk från PhoneAuth om Supabase inte är konfigurerat).

Gör så här:

### [x] Steg 1 – Starta appen
```bash
npm run dev
```
Öppna appen i webbläsaren (t.ex. http://localhost:8080).

### [x] Steg 2 – Referens
Ha **MaakUnifiedDesignSystem.jsx** öppen (t.ex. i en annan editor eller som körbar React-demo). Det är din visuella spec; jämför färger, typografi, spacing och komponenter.

### [x] Steg 3 – Gå igenom skärmarna (eller demo)
Öppna varje skärm i appen, eller använd **/demo-seed** och **/demo-samlingar** om de riktiga sidorna inte är tillgängliga. Kontrollera mot designen:

| Skärm | Vad du kollar |
|-------|----------------|
| **Landing** | Hero med staplade kort, gradient-text "matchar din själ", tre feature-ikoner (Brain, Shield, Heart), Knappar Kom igång / Jag har redan konto |
| **PhoneAuth** | Input cream/sage-känsla, OTP-fält w-12 h-14, sage-200 kant, Label primary-800 |
| **Matches** | Header "Dagens matchningar", Smart Personlighetsanalys-kort (primary-100), filter-tabs (Alla/Likhets/Motsats), MatchListItem, OnlineBanner |
| **Chat** | Tabs Chatt/Samling, sökfält rounded-full, ChatListItemCard, COLORS |
| **Chatt-fönster** | ChatHeaderV2, ChatBubbleV2 (egen = primary gradient, andras = cream), ChatInputBarV2 |
| **Profil** | Mörk layout, gradient overlay, statistik, InterestChipV2, knappar |
| **Match-profil (Visa mer)** | Staplade kort, X/MessageCircle, foto 3/4, gradient, ActionButtons, "Visa mer"-sheet, InterestChipV2 |
| **Onboarding** | ProgressSteps, PhotoUpload 6-grid (första slot 2x2), tips-ruta primary-50, Mascot på fotosteg |
| **Samlingar (gruppchatt)** | GroupChatList med CardV2 och primary-100 ikon; GroupChatRoom med ChatBubbleV2 och ChatInputBarV2 |
| **Video-samtal** | Gradient sage→coral, header med avatar + "Kemi-Check", kontroller (coral avsluta) |

### [x] Steg 4 – Färger och tokens
- Ingen skärm ska ha **hårdkodade hex** utanför `src/design/tokens.ts`; allt ska komma från **COLORS**.
- Primary = gröna CTAs och tillit, Coral = chatta/relation/status, Sage = bakgrunder och mjuka element.

### [x] Steg 5 – Avbocka i PRD
När du är nöjd: öppna `docs/prd/PRD_DESIGN_SYSTEM.md`, hitta US-017 och sätt kryss på:
```markdown
- [x] Verifiera visuellt att alla skärmar matchar MaakUnifiedDesignSystem.jsx
```

### Om något inte stämmer
- **Färg fel:** Kolla att sidan importerar `COLORS` från `@/design/tokens` och använder t.ex. `COLORS.primary[500]` istället för Tailwind-klasser som kan vara fel temade.
- **Komponent fel:** Kolla komponentkatalogen i avsnitt 4 ovan – använd ui-v2-versionen (ButtonPrimary, ChatBubbleV2, InterestChipV2 osv.).
- **Layout/typografi:** Jämför med samma sektion i MaakUnifiedDesignSystem.jsx (radnummer står i PRD per US).
