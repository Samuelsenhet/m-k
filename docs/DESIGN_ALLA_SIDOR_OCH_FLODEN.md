# MÄÄK – Alla sidor och flöden (design i detalj)

Detta dokument beskriver **varje sida och varje flöde** i appen med fokus på layout, komponenter och användarupplevelse.

---

## Innehåll

1. [App-struktur och global layout](#1-app-struktur-och-global-layout)
2. [Startsida och Index-flöde](#2-startsida-och-index-flöde)
3. [Telefoninloggning (Phone Auth)](#3-telefoninloggning-phone-auth)
4. [Onboarding](#4-onboarding)
5. [Profil](#5-profil)
6. [Matchningar](#6-matchningar)
7. [Chatt](#7-chatt)
8. [Matchprofil (View Match)](#8-matchprofil-view-match)
9. [Övriga sidor](#9-övriga-sidor)
10. [Admin och support](#10-admin-och-support)
11. [Demo och felhantering](#11-demo-och-felhantering)

---

## 1. App-struktur och global layout

### Wrapper och routing
- **HelmetProvider** → sidtitel och meta.
- **QueryClientProvider** (TanStack Query).
- **ConsentProvider** → GDPR-samtycke.
- **AuthProvider** → inloggning.
- **AchievementsProvider** → achievement-toasts och unlock.
- **BrowserRouter** med Routes; `future.v7_startTransition` och `v7_relativeSplatPath`.

### Globala element
- **OnlineCountBar** – visar antal användare online (när Supabase är konfigurerad).
- **GdprOnboarding** – modal/overlay om användaren inte gett samtycke; visas före resten av appen.
- **InstallPrompt** – PWA-installationsprompt.
- **Toaster** (Radix) + **Sonner** – notiser.
- **TooltipProvider** – tooltips.
- **SpeedInsights** och **Analytics** (Vercel) i produktion.

### Body-layout
- `<div className="pb-10">` runt Routes – ger plats åt **BottomNav** (fixed bottom).
- Sidor som har egen fullskärmsvy (t.ex. Profile med svart bakgrund) hanterar sin egen scroll.

### Bottom-navigation
- **BottomNav**: fast längst ner, `glass` (backdrop-blur), border-top, safe-area-bottom.
- Ikoner: Heart (Matchning), MessageCircle (Chatt), Sparkles (Demo om `isDemoEnabled`), User (Profil).
- Aktiv flik: primary-färg, gradient-indikator ovanför (Framer Motion `layoutId`), ikoner filled och scale 1.1.
- Grid 3 eller 4 kolumner beroende på om Demo finns.

### Laddning och fel (globalt)
- Consent laddas: fullskärms-spinner (border-primary, transparent topp).
- Supabase ej konfigurerad: **SupabaseSetupPage**.
- Demo utan Supabase: **AppWithoutSupabase** med bara demo-rutter.

---

## 2. Startsida och Index-flöde

**Route:** `/`  
**Komponent:** `Index.tsx`

### Tillstånd
- `appState`: `'landing' | 'test' | 'result' | 'loading'`.
- Vid laddning: kollas om användaren redan har personlighetsresultat i `personality_results`.
- Om användare + befintligt resultat → `result` med sparad data.
- Annars (ej inloggad eller inget resultat) → `landing`.

### Landing (`LandingPage`)
- **Bakgrund:** `bg-gradient-premium`, mjuka orbs (blur-3xl, primary/accent, animate-glow, animate-pulse-soft).
- **Header:** Logo 48px, till höger: inloggad → Heart, MessageCircle, User (länkar); ej inloggad → ShimmerButton "Logga in" → `/phone-auth`.
- **Hero:** MaakMascot (200px mobil / 280px desktop), rubrik "Hitta kärlek som" + "matchar din själ" (text-gradient), undertext om personlighetsmatchning, ev. online-räknare, CTA "Kom igång gratis" (ShimmerButton) → antingen `/onboarding` eller `/phone-auth`.
- **Features-carousel:** 4 kort (Brain, Sparkles, MessageCircle, Video) med titel + kort beskrivning, byter var 3:e sekund.
- Accordion för FAQ/info längre ner.

### Test (`PersonalityTest`)
- **PersonalityTest:** 30 frågor från `QUESTIONS`, slumpade per session.
- **ProgressBar** visar framsteg.
- **QuestionCard** per fråga med Likert-scale (1–5); svar sparas, auto-advance efter 400 ms.
- Navigering: ChevronLeft/ChevronRight; "Se resultat" när alla svarade.
- Vid klar: beräknar dimensioner (ei, sn, tf, jp, at), arketyp och kategori → `onComplete(result)`.

### Resultat (`PersonalityResult`)
- **Bakgrund:** `gradient-hero`.
- Header: MÄÄK-badge med Heart-ikon, ev. "Ditt sparade resultat".
- **Huvudkategori:** Stor kort med kategori-emoji, titel, beskrivning (CATEGORY_INFO), färgad med `CATEGORY_STYLES[category]`.
- **Fyra arketyper:** Grid 2x2 med arketyper i kategorin; användarens typ markerad med ring-2 ring-primary.
- **Dimensioner:** Staplar eller liknande för ei/sn/tf/jp/at med dimension-färger.
- Knappar: "Gå till startsidan" / "Se matchningar" (om inloggad) eller "Logga in för att spara".
- Om användare inloggad och inget tidigare resultat sparas resultatet till `personality_results` och toast visas.

### Loading
- Fullskärm `gradient-hero`, centrerad text "Laddar...", animate-pulse.

---

## 3. Telefoninloggning (Phone Auth)

**Route:** `/phone-auth`  
**Komponent:** `PhoneAuth.tsx`

### Layout
- **Bakgrund:** `min-h-screen gradient-hero`, centrerad, p-4.
- Dekorativa orbs (blur, animate-float) i bakgrunden.
- Max bredd `max-w-md`, relativ container.

### Steg (AnimatePresence, slide-variants)
1. **phone** – Telefonnummer
   - Tillbaka-pil → `/` eller steg tillbaka.
   - Ev. varning om Supabase ej konfigurerad (röd Card).
   - Ev. Demo-card med länkar till demo-seed och demo-samlingar.
   - **Card:** shadow-card, border. Header: Heart-ikon i gradient-primary-ruta, titel (t.auth.phoneTitle), beskrivning.
   - **PhoneInput** (nummer), felvisning, Button "Skicka kod" (gradient-primary, shadow-glow).

2. **verify** – OTP
   - Samma Card, titel/beskrivning för verifiering, visar nummer.
   - **OtpInput** (6 siffror), Button "Verifiera", länk "Skicka igen" med countdown (60 s).

3. **profile** – Ålder
   - **AgeVerification:** dag/månad/år (Select eller inputs).
   - Validering: minst 20 år (t.auth.error_too_young).
   - Button "Slutför profil" → sparar date_of_birth, phone, phone_verified_at i profiles; sedan navigate till `/onboarding` eller `/matches`.

### Progress
- Tre prickar under kortet: phone | verify | profile; aktiv = primary, genomförd = primary/50.

### Redirect-logik
- Inloggad + onboarding_completed → `/matches`.
- Inloggad + date_of_birth men ej onboarding → `/onboarding`.
- Ny användare → kvar för age verification.

---

## 4. Onboarding

**Route:** `/onboarding`  
**Komponent:** `Onboarding.tsx`

### Förutsättningar
- Kräver inloggad användare; annars redirect till `/phone-auth`.
- Om `onboarding_completed` → redirect till `/`.

### Flöde
1. **Kontroll:** Hämtar profil (onboarding_completed, date_of_birth, display_name). Saknas date_of_birth → phone-auth.
2. **OnboardingWizard** – steg-för-steg.
3. Vid **onComplete** → **WelcomeScreen** med ev. displayName.
4. WelcomeScreen "Se mina matchningar" → `/matches`.

### OnboardingWizard (kort översikt)
- **STEPS:** basics, personality, background, photos, privacy, id_verification, complete.
- Steg-indikator med ikoner (User, Brain, Briefcase, Camera, Shield, ShieldCheck, Sparkles).
- **basics:** Förnamn, efternamn, pronomen, kön, längd m.m. (Input, Select).
- **personality:** Inbäddad PersonalityTest + PersonalityResult (samma som på Index).
- **background:** Hometown, jobb, utbildning, religion, politik, alkohol, rökning.
- **photos:** PhotoUpload med PHOTO_PROMPTS (6 promptar); minst ett foto krävs (required).
- **privacy:** Checkboxar för showAge, showJob, showEducation, showLastName.
- **id_verification:** IdVerificationStep (valfritt); kan hoppa över.
- **complete:** Sammanfattning, spara till Supabase (profiles, profile_photos, personality_results), sätt onboarding_completed.

Design: gradient-hero, Card-baserade formulär, gradient-primary-knappar, AnimatePresence mellan steg.

### WelcomeScreen
- **Bakgrund:** gradient-hero, flytande orbs.
- Logo (icon-only, 80px), rubrik "Välkommen, [namn]!", undertext om att profilen är klar.
- Ev. online-räknare.
- Tre feature-kort (Dagliga matchningar, Isbrytare, Djupare kontakter) med ikoner (Users, MessageCircle, Sparkles).
- CTA "Se mina matchningar" (gradient-primary, Sparkles-ikon).
- Dekorativa små cirklar som animeras (confetti-liknande).

---

## 5. Profil

**Route:** `/profile`  
**Komponent:** `Profile.tsx`

### Layout
- **Bakgrund:** `min-h-screen bg-black` (mörk profilvy).
- En **Sheet** för Inställningar, en för ID-verifiering, en för Integritet.
- Innehåll: antingen **ProfileView**, **ProfileEditor**, **AchievementsPanel** eller **AIAssistantPanel** (fullskärm overlay med z-30).

### ProfileView
- **Profilkort:** Stora profilbilder (carousel), namn, ålder, arketyp/kategori med badge (CATEGORY_STYLES), VerifiedBadge om verifierad.
- Info-sektioner: bio, hemort, jobb, utbildning, kön, intention, sociala länkar (Instagram, LinkedIn) med getInstagramUsername/getLinkedInUsername.
- **Knappar:** Redigera (Pencil), Inställningar (Settings), Achievements (Trophy), AI-assistent (Sparkles), ev. Verifiera ID.
- Design: mörk bakgrund, vita/grå texter, kort med border och rounded-2xl.

### ProfileEditor
- Fullskärm overlay (bg-black), header "Redigera profil" med X för att stänga.
- **ProfileEditor-komponenten:** Formulär för alla profilfält + PhotoUpload; sparar till profiles och profile_photos.

### Inställningar-Sheet
- **SheetContent:** ScrollArea, max-h-[70vh].
- **Kort 1 – Konto:** Visar displayName (@…), email. Länkar: Personlighet & arketyper (/personality-guide), Språk (LanguageToggle), Notiser (/notifications), Integritet (öppnar Privacy-sheet), Achievements (öppnar panel), Användarvillkor, Integritetspolicy, Rapportering, Om oss, Rapporthistorik, Rapportera problem, Överklagande; moderatörer ser även Admin Rapporter.
- **MatchingSettings:** Ålder och avstånd (sliders), Submit.
- **Kort 2 – Support:** Rapporthistorik, Rapportera problem, Överklagande, (Admin).
- **Knappar:** Logga ut (destructive), Radera konto (AlertDialog med bekräftelse).

### Verify ID / Privacy
- Sheet för ID-verifiering: IdVerificationStep.
- Sheet för Integritet: korta texter, "Profilsynlighet" / "Deldata" med "Kommer snart"-knappar.

### AchievementsPanel / AIAssistantPanel
- Fullskärm över profil med X; AchievementsPanel visar achievement-lista, AIAssistantPanel visar AI-panel.

---

## 6. Matchningar

**Route:** `/matches`  
**Komponent:** `Matches.tsx`

### Förutsättningar
- Kräver inloggad användare.
- **matchStatus.journey_phase === 'WAITING'** → visar **WaitingPhase** (nedräkning till nästa matchning) + BottomNav.

### Layout
- **Bakgrund:** `min-h-screen bg-gradient-premium pb-24 safe-area-bottom`.
- **Container:** max-w-lg mx-auto px-4 py-6.

### Header
- "Dagens matchningar" (text-gradient), undertext "24h löpande • Kvalitetsfokus" med Clock-ikon.
- Ikoner: Demo (Sparkles) om isDemoEnabled, AI-panel (Brain), Uppdatera (RefreshCw).

### Info-kort
- **card-premium:** "Smart Personlighetsanalys", "30 frågor • 16 arketyper • 4 kategorier", badges för antal Likhets- och Motsats-matchningar.

### AI-panel
- AnimatePresence: **AIAssistantPanel** expanderar/kollapsar under header.

### ProfileCompletionPrompt
- Visas om profilen behöver kompletteras.

### Ömsesidiga matchningar
- Om mutualMatches.length > 0: rubrik med Heart-ikon och "Ömsesidiga matchningar (N)".
- Lista med kort: avatar (foto eller arketyp-emoji), namn, arketyp/kategori, knapp "Chatta" (gradient-rose-glow) → `/chat?match=…`.

### Pending-matchningar
- **Tabs:** Alla | Likhets (Users) | Motsats (Sparkles).
- Under tabs: kort förklaring av valt filter.
- **Matchkort** (card-premium):
  - Topp: bild 4:3, overlay med namn, arketyp, kategori-badge, match-%.
  - Badge för typ (Liknande / Kompletterande) med glass-dark.
  - Foto-räknare 1/N om flera foton.
  - Vertikala knappar: Passa (X), Chatta (MessageCircle).
  - Under bilden: namn, arketyp, matchScore (text-gradient), MatchCountdown, kort arketypbeskrivning, styrkor (badges), bio (citat), "Varför ni matchade" (personalityInsight) i grön box, progressbar (gradient-rose-glow), knappar Passa / Gilla / Se profil.
- Klick på kortet → `/view-match?match=…`.

### First Match Celebration
- Om första matchningen har special_effects 'celebration' → **FirstMatchCelebration**-overlay med special_message och matchCount, knapp för att fortsätta.

### Tom state
- Card med Heart-ikon (animate float), "Inga matchningar just nu", "Kom tillbaka imorgon…", ev. Demo-knapp.

### Fel
- Card border-destructive med felmeddelande och "Försök igen"-knapp.

### NotificationPrompt
- Komponent för att uppmuntra till notis-tillstånd.

---

## 7. Chatt

**Route:** `/chat`  
**Komponent:** `Chat.tsx`

### Layout
- **MatchList** (vänster/sidopanel på desktop) med lista över matchade användare och grupper.
- **ChatWindow** eller **VideoChatWindow** eller **GroupChatRoom** i huvudområdet.
- **CreateGroupModal** och **IncomingCallNotification** vid behov.
- Query-param `?match=…` öppnar vald match.

### MatchList
- Sökfält (chatSearchQuery).
- Lista med matchade användare: avatar, namn, ev. senaste meddelande; klick → setSelectedMatch.
- Grupper: GroupAvatar, namn; "Skapa grupp"-knapp (Plus) → CreateGroupModal.
- MSN-inspirerad styling (msn-list-card, msn-list-header) i Eucalyptus-färger.

### ChatWindow
- MSN-liknande layout: titelrad (msn-title-bar), verktygsfält (msn-toolbar), meddelandeområde (msn-messages-area), inmatningsfält (msn-input-field), skicka (msn-send-btn).
- Bubblor: egna (msn-bubble-own), deras (msn-bubble-them).
- Isbrytare, videoringsning (VideoChatWindow), Kemi-Check m.m. integrerat.

### VideoChatWindow / GroupChatRoom
- Video-samtal respektive gruppchatt med egen layout; IncomingCallNotification vid inkommande samtal.

### BottomNav
- Syns på Chat-sidan.

---

## 8. Matchprofil (View Match)

**Route:** `/match/:userId`, `/view-match?match=…`  
**Komponent:** `ViewMatchProfile.tsx` → **MatchProfileView**

### ViewMatchProfile
- Hämtar matchId från query eller userId från params; löser matchedUserId och personalityInsight från matches-tabellen.
- Vid laddning: fullskärm svart med vit spinner.
- Renderar **MatchProfileView** med userId, matchId, matchScore, personalityInsight; likeMatch/passMatch vid behov, navigate tillbaka till /matches.

### MatchProfileView
- Lik **ProfileView** men för en annan användare (match).
- Profilbilder (carousel), namn, ålder, arketyp/kategori, VerifiedBadge.
- Bio, hemort, jobb, utbildning, intention, sociala länkar.
- Om matchId: matchScore och "Varför ni matchade" (personalityInsight).
- Knappar: Tillbaka, Gilla, Passa; Dropdown (MoreVertical) för Rapportera, Blockera m.m.
- Design: samma mörka tema och badge-stilar som ProfileView.

---

## 9. Övriga sidor

### Gruppchatt
- **/group-chat** – **GroupChatList**: lista över grupper, skapa grupp, öppna grupp.
- **/group-chat/create** – **CreateGroupChat**: skapa ny grupp.
- **/group-chat/:groupId** – **GroupChatWindow**: ett gruppchattrum.

### Notifieringar
- **Route:** `/notifications`  
- **Notifications.tsx:** Lista över profilvisningar och intressen (interest); Switches för push_new_matches, push_messages, email_new_matches, email_messages. Sparar till profiles. Sticky header med tillbaka till profil/inställningar, BottomNav.

### Personlighetsguide
- **Route:** `/personality-guide`  
- **PersonalityGuide.tsx:** Sticky header "Personlighet & arketyper", tillbaka → profil (openSettings). Sektioner med Collapsible: kategorier (CATEGORY_INFO), arketyper (ARCHETYPE_INFO), dimensioner (DIMENSION_LABELS). Card/CardHeader/CardTitle, badge-klasser för färgkodning. BottomNav.

### Användarvillkor & Integritet
- **Route:** `/terms`, `/privacy`  
- **Terms.tsx:** Sticky header "Användarvillkor & Integritet", tillbaka → profil (openSettings). Lång text i Cards med sektioner (Ålders- & ID-krav, Säkerhet, Innehåll, m.m.). BottomNav.

### Om oss
- **Route:** `/about`  
- **About.tsx:** Samma sticky header-mönster, Card med titel (t.about.about_maak) och intro/placeholder från i18n. BottomNav.

### Rapportering
- **Route:** `/reporting`  
- **Reporting.tsx:** Sticky header "Rapportering", kort beskrivning av rapportflöde, Cards för steg 1–3 (Rapportinlämning, Moderering, Kommunikation). BottomNav.

### Rapportera problem
- **Route:** `/report`  
- **Report.tsx:** Formulär med Select för violationType (harassment, hate_speech, fraud, …), Textarea för beskrivning och vittnesmål, filuppladdning (evidenceFiles). Query params: userId, matchId, context. Submit → toast och redirect. Sticky header, BottomNav.

### Rapporthistorik
- **Route:** `/report-history`  
- Lista över användarens egna rapporter; samma header-/nav-mönster.

### Överklagande
- **Route:** `/appeal`  
- **Appeal.tsx:** Formulär för att överklaga avstängning/åtgärd; länkas från inställningar.

---

## 10. Admin och support

### Admin Rapporter
- **Route:** `/admin/reports`  
- **AdminReports.tsx:** Endast för användare med moderator_roles. Lista/granskning av rapporter.

### Admin Överklaganden
- **Route:** `/admin/appeals`  
- **AdminAppeals.tsx:** Hantering av överklaganden.

### Admin E-post
- **Route:** `/admin/email`  
- **AdminEmail.tsx:** E-postinstrument (dashboard, mallar, loggar, analytics, bulk-sändning) för admin.

Alla admin-sidor följer samma mörka/neutrala layout med tillbaka-länk och innehåll i Cards/Tables.

---

## 11. Demo och felhantering

### Demo (matchningar & chatt)
- **Route:** `/demo-seed`  
- **DemoSeed.tsx:** Demo med seed-data för matchningar och chatt; används när Supabase saknas eller för test. Samma visuella språk som Matches/Chat.

### Demo-samlingar
- **Route:** `/demo-samlingar`  
- **DemoGroupChat.tsx:** Demo för gruppchatt.

### 404
- **Route:** `*`  
- **NotFound.tsx:** Centrerad sida på bg-muted, "404", "Oops! Page not found", länk "Return to Home" till `/`.

### Supabase ej konfigurerad
- **SupabaseSetupPage:** Fullskärm, gradient #f2f0ef → #e8e6e4, text #253d2c. Rubrik "Supabase är inte konfigurerad", instruktioner med code-taggar för VITE_SUPABASE_URL och VITE_SUPABASE_PUBLISHABLE_KEY, länk till Supabase dashboard. Länkar till /demo-seed och /demo-samlingar med grön knapp (#4b6e48).

### GDPR (samtycke)
- **GdprOnboarding:** Fixed overlay z-50, bg-background/95 backdrop-blur. Steg 1: Välkomstkort med Heart-ikon, titel, "Anpassa" / "Acceptera alla". Steg 2: Switches för analytics, marketing, personalization; "Spara". AnimatePresence mellan steg.

---

## Sammanfattning av designmönster

- **Bakgrunder:** gradient-hero, gradient-premium, bg-background, bg-black (profil/editor).
- **Kort:** Card, card-premium, shadow-card, glass / glass-dark.
- **Knappar:** gradient-primary, ShimmerButton, variant outline/ghost/destructive.
- **Rubriker:** font-serif (Playfair), text-gradient där det ska kännas premium.
- **Badges:** badge-diplomat/strateger/byggare/upptackare, dimension-färger.
- **Navigation:** Sticky header med ChevronLeft + titel, max-w-lg mx-auto, BottomNav på de flesta sidor.
- **Formulär:** Label, Input, Select, Checkbox, Textarea; validering med Zod, fel via toast eller inline.
- **Animationer:** Framer Motion (AnimatePresence, layoutId, variants), animate-fade-in, animate-slide-up, animate-scale-in, vibe-card-hover.

Alla sidor och flöden använder dessa konsekvent för en enhetlig MÄÄK-upplevelse.
