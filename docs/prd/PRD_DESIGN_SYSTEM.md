# PRD: MaakUnifiedDesignSystem Full Implementation

## Introduction

Fullständig implementering av MaakUnifiedDesignSystem.jsx i hela MÄÄK-appen. Detta inkluderar alla sidor, komponenter, och flöden för att säkerställa en konsekvent visuell upplevelse enligt Eucalyptus Grove + Coral design-identiteten.

## Reference

Design-specifikation: `/Users/samuelsenhet/Downloads/MÄÄK CLUADE/MaakUnifiedDesignSystem.jsx`

## Goals

- Alla sidor använder ui-v2 komponenter konsekvent
- Alla färger kommer från `src/design/tokens.ts` (inga inline hex-värden)
- Mascot visas i korrekta states genom hela appen
- Visuellt utseende matchar MaakUnifiedDesignSystem.jsx exakt
- Filosofi: Passa → Chatta → Se profil (inga swipes, likes, procent)

---

## Phase 1: Foundation

### US-001: Verify Design Tokens Alignment

**Description:** Verifiera att design tokens i appen matchar MaakUnifiedDesignSystem.jsx exakt.

**Reference:** MaakUnifiedDesignSystem.jsx COLORS object (lines 458-536)

**Acceptance Criteria:**

- [x] Jämför `src/design/tokens.ts` COLORS med MaakUnifiedDesignSystem.jsx
- [x] Verifiera primary scale: 50-900 matchar exakt (#F0F7F4 till #1A2D1E)
- [x] Verifiera coral scale: 50-900 matchar exakt (#FFF5F3 till #872928)
- [x] Verifiera sage scale: 50-900 matchar exakt (#FDFCFA till #3D3B2C)
- [x] Verifiera neutral: white, offWhite, cream, sand, stone, gray, slate, charcoal, dark
- [x] Verifiera archetypes: diplomat, strateg, byggare, upptackare, debattoren, vardaren
- [x] Verifiera MASCOT_TOKENS är komplett (alla states från design-systemet)
- [x] Verifiera FONTS: sans = "DM Sans", serif = "Playfair Display"
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

## Phase 2: Core Pages

### US-002: Update Landing Page

**Description:** Uppdatera Landing Page till att matcha MaakUnifiedDesignSystem.jsx LandingPage komponenten.

**Reference:** MaakUnifiedDesignSystem.jsx LandingPage (lines 2072-2213)

**Acceptance Criteria:**

- [x] Uppdatera `src/components/landing/LandingPage.tsx`
- [x] Implementera floating cards hero section (3 staplade kort med rotation: -12deg, 8deg)
- [x] Lägg till floating elements: 💡 badge, MessageCircle ikon, "Likhets-match" badge
- [x] Implementera gradient text för "matchar din själ" (primary-500 till primary-400)
- [x] Lägg till 3 feature icons (Brain, Shield, Heart) med primary-100 bakgrund
- [x] Använd ButtonPrimary för "Kom igång gratis"
- [x] Använd ButtonSecondary för "Jag har redan ett konto"
- [x] Lägg till terms text med länkar (Användarvillkor, Integritetspolicy)
- [x] Bakgrund: gradient från sage-50 till neutral.white
- [x] Importera COLORS från `src/design/tokens.ts`
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-003: Update Matches Page

**Description:** Uppdatera Matches-sidan till MatchListPage layout från design-systemet.

**Reference:** MaakUnifiedDesignSystem.jsx MatchListPage (lines 1442-1567)

**Acceptance Criteria:**

- [x] Uppdatera `src/pages/Matches.tsx`
- [x] Ersätt shadcn Tabs med ui-v2 filter tabs (rounded-full, cream bakgrund)
- [x] Implementera header: "Dagens matchningar" med Playfair Display + Clock ikon
- [x] Lägg till "Smart Personlighetsanalys" card med Zap ikon och primary-100 bakgrund
- [x] Visa Likhets/Motsats badges med Users/Sparkles ikoner
- [x] Använd MatchListItem för match-display (emoji + arketyp)
- [x] Lägg till "Dina matchningar" sektion med Heart ikon
- [x] Filter tabs: Alla / 👥 Likhets / ✨ Motsats
- [x] Footer: "Synkflöde + Vågflöde matchningar"
- [x] Använd COLORS från tokens.ts (ta bort inline färger)
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-004: Update Chat Page

**Description:** Uppdatera Chat-sidan till ChatPageDemo layout.

**Reference:** MaakUnifiedDesignSystem.jsx ChatPageDemo (lines 2407-2466)

**Acceptance Criteria:**

- [x] Uppdatera `src/pages/Chat.tsx`
- [x] Lägg till header med "Chatt" titel + Filter och Search ikoner
- [x] Implementera horisontell avatar-rad med AvatarWithRing (coral ring för olästa)
- [x] Lägg till Chatt/Samling grupp tabs med border-b styling
- [x] Använd ChatListItemCard med StatusBadge (Start Chat = coral, Your Turn = coralOutline)
- [x] Visa tid och unread-indikator
- [x] Bakgrund: neutral.white för header, standard för lista
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-005: Update ChatWindow Component

**Description:** Uppdatera ChatWindow till design-systemets specifikation.

**Reference:** MaakUnifiedDesignSystem.jsx ChatWindow (lines 2355-2400), ChatBubble (lines 1756-1781), ChatInputBar (lines 1784-1838)

**Acceptance Criteria:**

- [x] Uppdatera `src/components/chat/ChatWindow.tsx`
- [x] Använd ChatHeaderV2 med ArchetypeAvatar och "Online nu" status (primary-500 färg)
- [x] Lägg till Video och MoreHorizontal ikoner i header
- [x] Implementera date divider ("Idag") med sage-200 linjer
- [x] Använd ChatBubbleV2: egna meddelanden = gradient primary-500 till primary-400, andra = cream
- [x] Visa tid och read status (Check ikon för lästa)
- [x] Implementera ChatInputBarV2 med quick actions: Bild, Röst, Isbrytare (sage-100 bakgrund)
- [x] Send-knapp: gradient när meddelande finns, sage-200 när tom
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-006: Update Profile Page

**Description:** Uppdatera Profile-sidan till ProfilePageDark layout.

**Reference:** MaakUnifiedDesignSystem.jsx ProfilePage (lines 2218-2333), ProfilePageMaak (lines 1574-1662)

**Acceptance Criteria:**

- [x] Uppdatera `src/pages/Profile.tsx`
- [x] Implementera dark theme (neutral.dark bakgrund)
- [x] Photo section med gradient overlay (transparent till neutral.dark)
- [x] Visa namn, ålder med Shield ikon (verifierad)
- [x] Använd ArchetypeBadge komponent
- [x] Lägg till stats grid: Matchningar, Svarsfrekvens, Chattar (rgba bakgrund)
- [x] "Om mig" sektion med bio
- [x] Intressen som chips (rgba bakgrund)
- [x] Info items med ikoner: MapPin (plats), Briefcase (jobb), GraduationCap (utbildning)
- [x] Settings och Edit2 ikoner i header (glass variant)
- [x] Photo indicator dots
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-007: Update ViewMatchProfile

**Description:** Uppdatera ViewMatchProfile till MatchProfileCard layout.

**Reference:** MaakUnifiedDesignSystem.jsx MatchProfileCard (lines 1129-1263), MatchCardClassic (lines 1269-1408)

**Acceptance Criteria:**

- [x] Uppdatera `src/components/profile/MatchProfileView.tsx` (vyn används av ViewMatchProfile-sidan)
- [x] Implementera stacked cards effect (coral-200 -3deg, primary-200 2deg bakom huvudkort)
- [x] Floating action buttons i hörnen: X (primary-400) vänster, MessageCircle (coral-400) höger
- [x] Photo section med aspect-[3/4]
- [x] Gradient overlay från svart/70 till transparent
- [x] Visa namn, ålder, verified badge, online status dot (green-400)
- [x] Interest chips med backdrop-blur
- [x] Bottom action bar: Passa (neutral), Chatta (primary gradient, störst), Se profil (neutral)
- [x] Använd ActionButtons komponent
- [x] "Visa mer"-sheet behållen för Se profil
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

## Phase 3: Navigation och Globala komponenter

### US-008: Update BottomNav Globally

**Description:** Ersätt BottomNav med BottomNavV2 i hela appen.

**Reference:** MaakUnifiedDesignSystem.jsx BottomNav (lines 1695-1738)

**Acceptance Criteria:**

- [x] BottomNav re-exportar BottomNavV2; alla sidor använder `BottomNav` (V2)
- [x] Items: Heart (Matchning), MessageCircle (Chatt), User (Profil) (+ Demo vid isDemoEnabled)
- [x] Active state: primary-600 färg, primary-50 bakgrund, filled ikon
- [x] Inactive state: neutral.gray färg (COLORS.neutral.gray)
- [x] Coral badge för olästa meddelanden (coral-500) via useTotalUnreadCount
- [x] Backdrop-blur + neutral.white med ee opacity
- [x] Border-top sage-100 (COLORS.sage[100])
- [x] Fixed position bottom-0
- [x] Samma BottomNav på Chat, Matches, Profile, Terms, About, Report, etc.
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-009: Implement Empty States with Mascot

**Description:** Implementera EmptyStateWithMascot i relevanta flöden.

**Reference:** MaakUnifiedDesignSystem.jsx EmptyStateWithMascot (lines 407-432), MASCOT_TOKENS (lines 45-79)

**Acceptance Criteria:**

- [x] EmptyStateWithMascot i Matches.tsx för inga matchningar (token: empty_matches)
- [x] Meddelande: "Bra saker tar lite tid. 🌱"
- [x] EmptyStateWithMascot i MatchList/Chat för inga chattar (token: no_chats)
- [x] Meddelande: "Övning ger färdighet! Hej! 👋"
- [x] Loading state med mascot (token: loading) – LoadingStateWithMascot, MASCOT_SCREEN_STATES.LOADING
- [x] Meddelande: "Jag är här medan vi väntar. Bra saker får ta tid."
- [x] first_match state (token: first_match) i FirstMatchCelebration (matches + journey)
- [x] Meddelande: "Jag sa ju att det var värt att vänta. 💛"
- [x] Mascot size: "hero" (large) för empty/loading states
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-010: Update AIAssistantPanel

**Description:** Integrera Mascot med AI Assistant states.

**Reference:** MaakUnifiedDesignSystem.jsx AI states (lines 53-57), AIChatBubble (lines 436-451)

**Acceptance Criteria:**

- [x] Uppdatera `src/components/ai/AIAssistantPanel.tsx`
- [x] Mascot state ai_listening: "Lyssnar... Välj en kategori nedan så hjälper jag dig."
- [x] Mascot state ai_thinking: "Låt mig tänka..." (under laddning)
- [x] Mascot state ai_answering: "Här är vad jag tänker..." + svar
- [x] Mascot state ai_celebrating: "Klart! ✨" (kort visning efter svar)
- [x] AIChatBubble med COLORS.sage[100] bakgrund
- [x] Mascot size: "small" i AIChatBubble
- [x] AnimatePresence + motion för state-övergångar
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

## Phase 4: Secondary Screens

### US-011: Update Onboarding Flow

**Description:** Uppdatera Onboarding till design-systemets specifikation.

**Reference:** MaakUnifiedDesignSystem.jsx PhotoUploadScreen (lines 1982-2065), ProgressSteps (lines 1676-1692)

**Acceptance Criteria:**

- [x] OnboardingWizard använder ProgressSteps (redan i bruk)
- [x] ProgressSteps: COLORS från tokens (gradient completed, primary-200 current, sage-200 upcoming)
- [x] PhotoUpload: 6-slot grid med första slot col-span-2 row-span-2 (2x2 huvudfoto) + 5 små
- [x] Dashed border sage-300 (COLORS.sage[300]) för tomma slotar
- [x] Huvudfoto tom: coral-50 bakgrund, Camera-ikon coral-500
- [x] Övriga tomma: neutral.cream bakgrund, Plus-ikon
- [x] Tips-ruta med primary-50: "Visa ditt ansikte tydligt", "Använd bra belysning", "Visa dina intressen"
- [x] Mascot (ONBOARDING_WELCOME) på fotosteget i OnboardingWizard
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-012: Update VideoChatWindow

**Description:** Uppdatera VideoChatWindow till VideoCallScreen layout.

**Reference:** MaakUnifiedDesignSystem.jsx VideoCallScreen (lines 1906-1976)

**Acceptance Criteria:**

- [x] Uppdatera `src/components/chat/VideoChatWindow.tsx` till design layout
- [x] Gradient bakgrund (COLORS.sage[200] → COLORS.coral[100])
- [x] Header: Avatar + namn + "Kemi-Check" (primary-500) i rounded-full vit/blur; X-knapp
- [x] Main video (remote/local) med User-placeholder när ingen stream
- [x] PiP bottom-right med coral-100 bakgrund (lokalt video)
- [x] Kontroller: Video, Mic, Volume2 (vita rounded-full); Hang up Phone 135deg coral-500
- [x] callerName/callerAvatar props; Chat skickar match-profil
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-013: Add OnlineBannerV2 Globally

**Description:** Implementera OnlineBannerV2 i relevanta sidor.

**Reference:** MaakUnifiedDesignSystem.jsx OnlineBanner (lines 1742-1749)

**Acceptance Criteria:**

- [x] OnlineBannerV2 från ui-v2 med COLORS (primary-500, neutral.white)
- [x] Matches.tsx: banner ovanför innehåll, useOnlineCount(user?.id)
- [x] Chat.tsx: banner ovanför chat-listan (när ingen match vald), useOnlineCount(user?.id)
- [x] Text: "Just nu är det {{count}} användare online" (t("chat.online_banner", ..., { count }))
- [x] Styling: primary-500 bakgrund, neutral.white text, py-2.5 px-4, text-sm font-medium
- [x] Count från useOnlineCount (Realtime presence)
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-014: Verify Match Celebration Modal

**Description:** Verifiera och uppdatera MatchCelebration modal.

**Reference:** MaakUnifiedDesignSystem.jsx MatchCelebration (lines 1845-1899)

**Acceptance Criteria:**

- [x] MatchCelebration.tsx uppdaterad enligt design
- [x] Mörk overlay med backdrop-blur(8px), rgba(0,0,0,0.6)
- [x] 🎉 emoji med animate-bounce
- [x] "Ny matchning!" titel i vit (kort med neutral.dark bakgrund)
- [x] Beskrivning: "Du och {name} är en {typ}-match" (matchType → likhets/motsats)
- [x] Avatar med AvatarWithRing (coral ring), z-index
- [x] Match type badge UTAN procent (rgba(255,255,255,0.15))
- [x] Tagline: "Era olikheter kompletterar varandra" (motsats) / "Ni delar viktiga värderingar" (likhet)
- [x] Fortsätt (rgba) + Chatta/Skicka meddelande (ButtonCoral)
- [x] matchType prop från Matches
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

## Phase 5: Form Components

### US-015: Update Input Components Globally

**Description:** Uppdatera alla formulär till ui-v2 input-komponenter.

**Reference:** MaakUnifiedDesignSystem.jsx Input (lines 856-887), InputSearch (lines 890-906), InputOTP (lines 910-944)

**Acceptance Criteria:**

- [x] Använd ui-v2 Input i `src/pages/PhoneAuth.tsx`
- [x] Använd ui-v2 InputOTP för verifieringskoder
- [x] Använd ui-v2 InputSearch i Chat page header
- [x] Input styling: neutral.cream bakgrund, transparent border, primary-400 focus border
- [x] Label: text-sm font-medium, primary-800 färg
- [x] Error state: coral-500 border, coral-600 text
- [x] Hint text: neutral.gray färg
- [x] Search input: rounded-full, pl-12 för ikon
- [x] OTP: w-12 h-14, text-center, sage-200 border
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-016: Update Interest Chips

**Description:** Implementera InterestChip konsekvent.

**Reference:** MaakUnifiedDesignSystem.jsx InterestChip (lines 1020-1036)

**Acceptance Criteria:**

- [x] Använd InterestChipV2 i Profile page (intressen-sektion)
- [x] Använd InterestChipV2 i Onboarding (intresse-val)
- [x] Använd InterestChipV2 i ViewMatchProfile (visa matchens intressen)
- [x] Unselected: neutral.white bakgrund, sage-200 border, neutral.charcoal text
- [x] Selected: primary-100 bakgrund, primary-400 border, primary-700 text
- [x] Hover: scale-[1.02], active: scale-[0.98]
- [x] Ikoner från lucide-react (Music, Coffee, Plane, etc.)
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

## Phase 6: Final Verification

### US-017: Update Group Chat UI and Final Verification

**Description:** Uppdatera Group Chat och utför final verifiering.

**Acceptance Criteria:**

- [x] Uppdatera `src/pages/GroupChatList.tsx` att använda ui-v2 komponenter
- [x] Uppdatera `src/components/chat/GroupChatRoom.tsx` att använda ChatBubbleV2, ChatInputBarV2
- [x] Ta bort ALLA duplicate COLORS definitioner från screen-filer:
  - `src/components/ui-v2/screens/ProfilePageDark.tsx`
  - `src/components/ui-v2/screens/MatchListPage.tsx`
  - `src/components/ui-v2/screens/PhotoUploadScreen.tsx`
  - `src/components/ui-v2/screens/VideoCallScreen.tsx`
- [x] Importera COLORS från `src/design/tokens.ts` istället
- [x] Kör `npm run build` - MÅSTE passa utan errors
- [x] Kör `npm run lint` - MÅSTE passa utan errors
- [x] Kör `npm run typecheck` - MÅSTE passa utan errors
- [x] Verifiera visuellt att alla skärmar matchar MaakUnifiedDesignSystem.jsx (kan göras via `/demo-seed` och `/demo-samlingar` när demo är uppdaterad till ui-v2; se DESIGN_SYSTEM.md §9)
- [x] Uppdatera `docs/DESIGN_SYSTEM.md` med completion status

---

## Definition of Done

Hela implementeringen är klar när:

1. ✅ Alla 17 User Stories är markerade som [x]
2. ✅ `npm run build` passerar utan errors
3. ✅ `npm run lint` passerar utan errors
4. ✅ Alla färger kommer från tokens.ts (inga inline hex-värden)
5. ✅ Alla sidor använder ui-v2 komponenter konsekvent
6. ✅ Mascot visas i korrekta states
7. ✅ Visuellt utseende matchar MaakUnifiedDesignSystem.jsx

---

## Notes for Ralph

- Implementera exakt EN uppgift per iteration
- Läs progress_design_system.txt för learnings från tidigare iterationer
- Om tests FAIL: markera INTE uppgiften som klar, logga error i progress
- Om tests PASS: markera [x], commit, logga framgång i progress
- När alla är [x], output: `<promise>COMPLETE</promise>`
