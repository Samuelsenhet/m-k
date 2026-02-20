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

- [ ] Uppdatera `src/components/landing/LandingPage.tsx`
- [ ] Implementera floating cards hero section (3 staplade kort med rotation: -12deg, 8deg)
- [ ] Lägg till floating elements: 💡 badge, MessageCircle ikon, "Likhets-match" badge
- [ ] Implementera gradient text för "matchar din själ" (primary-500 till primary-400)
- [ ] Lägg till 3 feature icons (Brain, Shield, Heart) med primary-100 bakgrund
- [ ] Använd ButtonPrimary för "Kom igång gratis"
- [ ] Använd ButtonSecondary för "Jag har redan ett konto"
- [ ] Lägg till terms text med länkar (Användarvillkor, Integritetspolicy)
- [ ] Bakgrund: gradient från sage-50 till neutral.white
- [ ] Importera COLORS från `src/design/tokens.ts`
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-003: Update Matches Page

**Description:** Uppdatera Matches-sidan till MatchListPage layout från design-systemet.

**Reference:** MaakUnifiedDesignSystem.jsx MatchListPage (lines 1442-1567)

**Acceptance Criteria:**

- [ ] Uppdatera `src/pages/Matches.tsx`
- [ ] Ersätt shadcn Tabs med ui-v2 filter tabs (rounded-full, cream bakgrund)
- [ ] Implementera header: "Dagens matchningar" med Playfair Display + Clock ikon
- [ ] Lägg till "Smart Personlighetsanalys" card med Zap ikon och primary-100 bakgrund
- [ ] Visa Likhets/Motsats badges med Users/Sparkles ikoner
- [ ] Använd MatchListItem för match-display (emoji + arketyp)
- [ ] Lägg till "Dina matchningar" sektion med Heart ikon
- [ ] Filter tabs: Alla / 👥 Likhets / ✨ Motsats
- [ ] Footer: "Synkflöde + Vågflöde matchningar"
- [ ] Använd COLORS från tokens.ts (ta bort inline färger)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-004: Update Chat Page

**Description:** Uppdatera Chat-sidan till ChatPageDemo layout.

**Reference:** MaakUnifiedDesignSystem.jsx ChatPageDemo (lines 2407-2466)

**Acceptance Criteria:**

- [ ] Uppdatera `src/pages/Chat.tsx`
- [ ] Lägg till header med "Chatt" titel + Filter och Search ikoner
- [ ] Implementera horisontell avatar-rad med AvatarWithRing (coral ring för olästa)
- [ ] Lägg till Chatt/Samling grupp tabs med border-b styling
- [ ] Använd ChatListItemCard med StatusBadge (Start Chat = coral, Your Turn = coralOutline)
- [ ] Visa tid och unread-indikator
- [ ] Bakgrund: neutral.white för header, standard för lista
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-005: Update ChatWindow Component

**Description:** Uppdatera ChatWindow till design-systemets specifikation.

**Reference:** MaakUnifiedDesignSystem.jsx ChatWindow (lines 2355-2400), ChatBubble (lines 1756-1781), ChatInputBar (lines 1784-1838)

**Acceptance Criteria:**

- [ ] Uppdatera `src/components/chat/ChatWindow.tsx`
- [ ] Använd ChatHeaderV2 med ArchetypeAvatar och "Online nu" status (primary-500 färg)
- [ ] Lägg till Video och MoreHorizontal ikoner i header
- [ ] Implementera date divider ("Idag") med sage-200 linjer
- [ ] Använd ChatBubbleV2: egna meddelanden = gradient primary-500 till primary-400, andra = cream
- [ ] Visa tid och read status (Check ikon för lästa)
- [ ] Implementera ChatInputBarV2 med quick actions: Bild, Röst, Isbrytare (sage-100 bakgrund)
- [ ] Send-knapp: gradient när meddelande finns, sage-200 när tom
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-006: Update Profile Page

**Description:** Uppdatera Profile-sidan till ProfilePageDark layout.

**Reference:** MaakUnifiedDesignSystem.jsx ProfilePage (lines 2218-2333), ProfilePageMaak (lines 1574-1662)

**Acceptance Criteria:**

- [ ] Uppdatera `src/pages/Profile.tsx`
- [ ] Implementera dark theme (neutral.dark bakgrund)
- [ ] Photo section med gradient overlay (transparent till neutral.dark)
- [ ] Visa namn, ålder med Shield ikon (verifierad)
- [ ] Använd ArchetypeBadge komponent
- [ ] Lägg till stats grid: Matchningar, Svarsfrekvens, Chattar (rgba bakgrund)
- [ ] "Om mig" sektion med bio
- [ ] Intressen som chips (rgba bakgrund)
- [ ] Info items med ikoner: MapPin (plats), Briefcase (jobb), GraduationCap (utbildning)
- [ ] Settings och Edit2 ikoner i header (glass variant)
- [ ] Photo indicator dots
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-007: Update ViewMatchProfile

**Description:** Uppdatera ViewMatchProfile till MatchProfileCard layout.

**Reference:** MaakUnifiedDesignSystem.jsx MatchProfileCard (lines 1129-1263), MatchCardClassic (lines 1269-1408)

**Acceptance Criteria:**

- [ ] Uppdatera `src/pages/ViewMatchProfile.tsx`
- [ ] Implementera stacked cards effect (coral-200 -3deg, primary-200 2deg bakom huvudkort)
- [ ] Floating action buttons i hörnen: X (primary-400) vänster, MessageCircle (coral-400) höger
- [ ] Photo section med aspect-[3/4]
- [ ] Gradient overlay från svart/70 till transparent
- [ ] Visa namn, ålder, online status dot (green-400)
- [ ] Interest chips med backdrop-blur
- [ ] Bottom action bar: Passa (neutral), Chatta (primary gradient, störst), Se profil (neutral)
- [ ] Använd ActionButtons komponent om tillgänglig
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

## Phase 3: Navigation och Globala komponenter

### US-008: Update BottomNav Globally

**Description:** Ersätt BottomNav med BottomNavV2 i hela appen.

**Reference:** MaakUnifiedDesignSystem.jsx BottomNav (lines 1695-1738)

**Acceptance Criteria:**

- [ ] Uppdatera `src/components/navigation/BottomNav.tsx` eller ersätt med BottomNavV2
- [ ] Items: Heart (Matchning), MessageCircle (Chatt), User (Profil)
- [ ] Active state: primary-600 färg, primary-50 bakgrund, filled ikon
- [ ] Inactive state: neutral.gray färg
- [ ] Coral badge för olästa meddelanden (coral-500 bakgrund)
- [ ] Backdrop-blur effekt (neutral.white med ee opacity)
- [ ] Border-top med sage-100
- [ ] Fixed position bottom-0
- [ ] Verifiera att alla sidor använder samma BottomNav
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-009: Implement Empty States with Mascot

**Description:** Implementera EmptyStateWithMascot i relevanta flöden.

**Reference:** MaakUnifiedDesignSystem.jsx EmptyStateWithMascot (lines 407-432), MASCOT_TOKENS (lines 45-79)

**Acceptance Criteria:**

- [ ] Lägg till EmptyStateWithMascot i Matches.tsx för inga matchningar (token: empty_matches)
- [ ] Meddelande: "Bra saker tar lite tid. 🌱"
- [ ] Lägg till EmptyStateWithMascot i Chat.tsx för inga chattar (token: no_chats)
- [ ] Meddelande: "Övning ger färdighet! Hej! 👋"
- [ ] Implementera loading state med mascot (token: loading)
- [ ] Meddelande: "Jag är här medan vi väntar. Bra saker får ta tid."
- [ ] Implementera first_match state (token: first_match)
- [ ] Meddelande: "Jag sa ju att det var värt att vänta. 💛"
- [ ] Mascot size: "large" för empty states
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-010: Update AIAssistantPanel

**Description:** Integrera Mascot med AI Assistant states.

**Reference:** MaakUnifiedDesignSystem.jsx AI states (lines 53-57), AIChatBubble (lines 436-451)

**Acceptance Criteria:**

- [ ] Uppdatera `src/components/ai/AIAssistantPanel.tsx`
- [ ] Integrera Mascot med state: ai_listening (lyssnar...)
- [ ] Integrera Mascot med state: ai_thinking (Låt mig tänka...)
- [ ] Integrera Mascot med state: ai_answering (Här är vad jag tänker...)
- [ ] Integrera Mascot med state: ai_celebrating (tiny sparkle)
- [ ] Använd AIChatBubble komponent (sage-100 bakgrund)
- [ ] Mascot size: "small" för AI chat bubbles
- [ ] Lägg till state transition animations
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

## Phase 4: Secondary Screens

### US-011: Update Onboarding Flow

**Description:** Uppdatera Onboarding till design-systemets specifikation.

**Reference:** MaakUnifiedDesignSystem.jsx PhotoUploadScreen (lines 1982-2065), ProgressSteps (lines 1676-1692)

**Acceptance Criteria:**

- [ ] Uppdatera `src/components/onboarding/OnboardingWizard.tsx`
- [ ] Använd ProgressSteps från ui-v2 (gradient bars för completed, primary-200 för current)
- [ ] Uppdatera `src/components/profile/PhotoUpload.tsx`
- [ ] Implementera 6-slot photo grid: 2x2 huvudfoto (col-span-2 row-span-2) + 4 små
- [ ] Dashed border med sage-300
- [ ] Huvudfoto: coral-50 bakgrund, Camera ikon i coral-500
- [ ] Övriga: neutral.cream bakgrund, Plus ikon
- [ ] Tips-ruta med primary-50 bakgrund
- [ ] Tips: "Visa ditt ansikte tydligt", "Använd bra belysning", "Visa dina intressen"
- [ ] Lägg till Mascot för teaching state i onboarding
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-012: Update VideoChatWindow

**Description:** Uppdatera VideoChatWindow till VideoCallScreen layout.

**Reference:** MaakUnifiedDesignSystem.jsx VideoCallScreen (lines 1906-1976)

**Acceptance Criteria:**

- [ ] Uppdatera `src/components/chat/VideoChatWindow.tsx`
- [ ] Implementera gradient bakgrund (sage-200 till coral-100)
- [ ] Header med Avatar och namn i rounded-full container (vita bakgrund med blur)
- [ ] "Kemi-Check" label i primary-500 färg
- [ ] X-knapp för att stänga
- [ ] Main video placeholder med User ikon
- [ ] Self video PiP (picture-in-picture) i bottom-right, coral-100 bakgrund
- [ ] Control buttons: Video, Mic, Volume2 (vita, rounded-full)
- [ ] Hang up button: Phone ikon roterad 135deg, coral-500 bakgrund
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-013: Add OnlineBannerV2 Globally

**Description:** Implementera OnlineBannerV2 i relevanta sidor.

**Reference:** MaakUnifiedDesignSystem.jsx OnlineBanner (lines 1742-1749)

**Acceptance Criteria:**

- [ ] Använd OnlineBannerV2 från ui-v2
- [ ] Lägg till i Matches.tsx (ovanför match-listan)
- [ ] Lägg till i Chat.tsx (ovanför chat-listan)
- [ ] Text: "Just nu är det {count} användare online"
- [ ] Styling: primary-500 bakgrund, neutral.white text
- [ ] Padding: py-2.5 px-4, text-center, text-sm font-medium
- [ ] Hämta count från relevant API/context
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-014: Verify Match Celebration Modal

**Description:** Verifiera och uppdatera MatchCelebration modal.

**Reference:** MaakUnifiedDesignSystem.jsx MatchCelebration (lines 1845-1899)

**Acceptance Criteria:**

- [ ] Verifiera `src/components/ui-v2/match/MatchCelebration.tsx`
- [ ] Dark overlay med backdrop-blur(8px)
- [ ] 🎉 emoji med animate-bounce
- [ ] "Ny matchning!" titel i vit
- [ ] Beskrivning: "Du och {name} är en {typ}-match"
- [ ] Overlapping avatars med ArchetypeAvatar (z-index för överlappning)
- [ ] Match type badge UTAN procent (rgba bakgrund)
- [ ] Text: "Era olikheter kompletterar varandra" eller "Ni delar viktiga värderingar"
- [ ] Fortsätt button (rgba bakgrund) och Skicka meddelande (ButtonCoral)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

## Phase 5: Form Components

### US-015: Update Input Components Globally

**Description:** Uppdatera alla formulär till ui-v2 input-komponenter.

**Reference:** MaakUnifiedDesignSystem.jsx Input (lines 856-887), InputSearch (lines 890-906), InputOTP (lines 910-944)

**Acceptance Criteria:**

- [ ] Använd ui-v2 Input i `src/pages/PhoneAuth.tsx`
- [ ] Använd ui-v2 InputOTP för verifieringskoder
- [ ] Använd ui-v2 InputSearch i Chat page header
- [ ] Input styling: neutral.cream bakgrund, transparent border, primary-400 focus border
- [ ] Label: text-sm font-medium, primary-800 färg
- [ ] Error state: coral-500 border, coral-600 text
- [ ] Hint text: neutral.gray färg
- [ ] Search input: rounded-full, pl-12 för ikon
- [ ] OTP: w-12 h-14, text-center, sage-200 border
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-016: Update Interest Chips

**Description:** Implementera InterestChip konsekvent.

**Reference:** MaakUnifiedDesignSystem.jsx InterestChip (lines 1020-1036)

**Acceptance Criteria:**

- [ ] Använd InterestChipV2 i Profile page (intressen-sektion)
- [ ] Använd InterestChipV2 i Onboarding (intresse-val)
- [ ] Använd InterestChipV2 i ViewMatchProfile (visa matchens intressen)
- [ ] Unselected: neutral.white bakgrund, sage-200 border, neutral.charcoal text
- [ ] Selected: primary-100 bakgrund, primary-400 border, primary-700 text
- [ ] Hover: scale-[1.02], active: scale-[0.98]
- [ ] Ikoner från lucide-react (Music, Coffee, Plane, etc.)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

## Phase 6: Final Verification

### US-017: Update Group Chat UI and Final Verification

**Description:** Uppdatera Group Chat och utför final verifiering.

**Acceptance Criteria:**

- [ ] Uppdatera `src/pages/GroupChatList.tsx` att använda ui-v2 komponenter
- [ ] Uppdatera `src/components/chat/GroupChatRoom.tsx` att använda ChatBubbleV2, ChatInputBarV2
- [ ] Ta bort ALLA duplicate COLORS definitioner från screen-filer:
  - `src/components/ui-v2/screens/ProfilePageDark.tsx`
  - `src/components/ui-v2/screens/MatchListPage.tsx`
  - `src/components/ui-v2/screens/PhotoUploadScreen.tsx`
  - `src/components/ui-v2/screens/VideoCallScreen.tsx`
- [ ] Importera COLORS från `src/design/tokens.ts` istället
- [ ] Kör `npm run build` - MÅSTE passa utan errors
- [ ] Kör `npm run lint` - MÅSTE passa utan errors
- [ ] Kör `npm run typecheck` - MÅSTE passa utan errors
- [ ] Verifiera visuellt att alla skärmar matchar MaakUnifiedDesignSystem.jsx
- [ ] Uppdatera `docs/DESIGN_SYSTEM.md` med completion status

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
