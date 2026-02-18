# RELEASE READINESS – DESIGN EDITION

**Syfte:** Brutal 10/10-check av hela första användarresan från Landing till första chatten.  
**Lins:** MÄÄK-filosofi, emotion, tempo, trygghet, relation.

**Resa som valideras:**  
Landing → CTA-klick → Phone auth → Onboarding (emotion) → Waiting phase → Första match-momentet → Första chatten

---

## Hur checklistan fungerar

För varje steg:

- **Kriterier (1–10):** Konkret vad som krävs för 10/10 ur design/UX.
- **Status:** 🟢 OK / 🟡 Justera / 🔴 Åtgärd krävs.
- **Anteckning:** Kort motivering eller åtgärd.

Slutbedömning: **Release-ready** om inga 🔴 kvarstår och 🟡 är dokumenterade/acceptabla.

---

## 1. Landing → CTA-klick

**Vad användaren ser:** Hero, story (problem → transformation → så fungerar det), social proof, avslutande CTA. Klick på "Kom igång gratis".

| # | Kriterium | Status | Anteckning |
|---|-----------|--------|------------|
| 1 | **Filosofi:** Säljer transformation (slipp marknadsplatsen), inte funktion (hitta matchningar). | 🟢 | H1 + undertext MÄÄK-aligned. |
| 2 | **Emotion:** Känns lugn, premium, anti-Tinder. Ingen FOMO, ingen procent/siffra. | 🟢 | CardV2, BestMatchCard som känsla, citat utan siffror. |
| 3 | **Tempo:** Andas – tydliga sektioner, ingen dopamin-UI (carousel, countdown). | 🟢 | Statiskt flöde, lugnt spacing. |
| 4 | **Trygghet:** CTA = "Kom igång gratis" / "Jag vill veta mer" – low pressure. | 🟢 | Primär + sekundär korrekt. |
| 5 | **Relation:** Coral används inte på landing (coral = relation, inte discovery). | 🟢 | Endast tokens/primary. |
| 6 | **Komponenter:** Endast V2 (ButtonPrimary, ButtonGhost, CardV2, BestMatchCard). | 🟢 | FAS 11 implementerad. |
| 7 | **Mascot:** Emotionell (happy i hero, idle i problem), inte dekorativ/bounce. | 🟢 | pose="happy" / "idle". |
| 8 | **Flödesrad:** "Passa → Chatta → Se profil" + "Inga snabba beslut. Bara medvetna." | 🟢 | Tydlig anti-Tinder-position. |
| 9 | **Transformation-card:** Känslomässig (t.ex. "Någon du vill fortsätta prata med"). | 🟢 | Uppdaterad från "Så kan det kännas". |
| 10 | **Ingen regression:** Samma navigation, auth-flöde, demo-länk. | 🟢 | handleStart → /phone-auth eller /onboarding. |

**Steg 1 sammanfattning:** 🟢 **10/10** – Release-ready.

---

## 2. Phone auth

**Vad användaren ser:** Steg telefon → OTP → ålder (vid behov). Tillbaka till Landing om ej inloggad.

| # | Kriterium | Status | Anteckning |
|---|-----------|--------|------------|
| 1 | **Filosofi:** Inloggning känns som "steg in i resan", inte "registrera för erbjudande". | 🟡 | Titlar från i18n (auth.phoneTitle etc.). Kontrollera att copy inte är "Få fler matchningar nu". |
| 2 | **Emotion:** Lugn, ingen countdown-FOMO (resend är OK). Ingen "X användare väntar". | 🟢 | Countdown endast för resend; ingen social proof med siffror. |
| 3 | **Tempo:** Tydliga steg (phone → verify → profile). Ingen överbelamring. | 🟢 | Progress dots, AnimatePresence. |
| 4 | **Trygghet:** Åldersverifiering tydlig; ingen press ("Slutför nu för 20 % rabatt"). | 🟢 | Age verification = compliance + trygghet. |
| 5 | **Relation:** N/A (pre-relation). Coral undviks. | 🟢 | Primary/gradient för CTA. |
| 6 | **Felhantering:** Tydliga felmeddelanden, ingen generisk "Något gick fel". | 🟢 | Zod + toast, Supabase-fel hanteras. |
| 7 | **Demo-länk:** Synlig när demo aktiverad; låg profil. | 🟢 | Card med demo-länkar. |
| 8 | **Tillbaka:** Tillbaka till Landing (/) – inte till en "marknadsplats". | 🟢 | Back → navigate('/'). |
| 9 | **Efter inloggning:** Redirect till onboarding eller matches – konsekvent. | 🟢 | getProfilesAuthKey + onboarding_completed. |
| 10 | **Språk:** i18n för titel, beskrivning, knappar. | 🟢 | t('auth.*'). |

**Steg 2 sammanfattning:** 🟢 **9–10/10** – Release-ready. 🟡 = valfri copy-audit av auth-strängar.

---

## 3. Onboarding (emotion)

**Vad användaren ser:** WelcomeScreen (om ny) → OnboardingWizard (grundläggande, personlighet, bakgrund, foton, integritet, ID, klart) → WelcomeScreen med "Vad som väntar".

| # | Kriterium | Status | Anteckning |
|---|-----------|--------|------------|
| 1 | **Filosofi:** Onboarding = "lära känna dig" / "förbereda din profil" – inte "fyll i för högre match-rate". | 🟡 | WelcomeScreen har "Dagliga matchningar", "AI-isbrytare" – mer funktion än transformation. Överväg mjukare formulering. |
| 2 | **Emotion:** Känns som ett steg i resan. Ingen progress-bar som "nivå" eller poäng. | 🟢 | Steg-indikator är steg, inte gamification. |
| 3 | **Tempo:** Valbara steg (t.ex. bakgrund), skip där det är meningsfullt. Ingen rush. | 🟢 | Optional steps, "Fortsätt utforska" i WaitingPhase. |
| 4 | **Trygghet:** Integritet tydlig; ID valfritt. Ingen "Du måste slutföra för att matcha". | 🟢 | Privacy-step, ID optional. |
| 5 | **Relation:** Personlighet först – inte "lägg till 6 foton för bästa resultat". | 🟡 | PHOTO_PROMPTS är relationella ("Vad gör dig genuint lycklig?"). Kontrollera att ingen copy säger "fler foton = fler matchningar". |
| 6 | **Foto-prompts:** Känslomässiga, inte "optimera för algoritmen". | 🟢 | PHOTO_PROMPTS redan i rätt riktning. |
| 7 | **Avslut:** WelcomeScreen → "Vad som väntar" – inbjudan till matches, inte "Du är klar! Swipa nu". | 🟡 | "Dagliga matchningar" kan bytas till "Matchningar som passar dig" för att undvika kvantitet. |
| 8 | **Mascot:** Används där det stödjer (t.ex. tom state) – inte överallt. | 🟢 | Ej överdrivet. |
| 9 | **Ingen FOMO:** Ingen "X % slutför inte – du är nästan klar!". | 🟢 | Ingen sådan copy. |
| 10 | **Redirect efter klart:** Till /matches – konsekvent med Passa → Chatta → Se profil. | 🟢 | handleWelcomeContinue → navigate('/matches'). |

**Steg 3 sammanfattning:** 🟢 **8–9/10** – Release-ready med små 🟡 (copy på WelcomeScreen / foto-copy).

---

## 4. Waiting phase (känsla)

**Vad användaren ser:** "Din första matchning kommer snart", countdown till nästa reset, tips (Matchning med mening, Ta den tid det tar, Medan du väntar), "Fortsätt utforska appen", "Medan du väntar kan du lägga till mer om dig i profilen – lugn och i din takt."

| # | Kriterium | Status | Anteckning |
|---|-----------|--------|------------|
| 1 | **Filosofi:** Väntan = meningsfull, inte straff. "Ta den tid det tar" – ingen stress. | 🟢 | Tips utan procent, utan "bästa matchningarna". |
| 2 | **Emotion:** Lugn, förutsägbar. Ingen "Bara 3 användare kvar i din region". | 🟢 | Tidsbaserad countdown, mjuk copy. |
| 3 | **Tempo:** Tips roterar lugnt (5 s). Ingen snabb-blink eller urgency. | 🟢 | 5 s intervall. |
| 4 | **Trygghet:** "Fortsätt utforska appen" = användaren kan lämna. Ingen lock-in. | 🟢 | Knapp till /profile. |
| 5 | **Relation:** N/A här; förbereder för relation (match → chatta). | 🟢 | - |
| 6 | **Progress bar:** Visar "Onboarding klar 100%" – inte "nivå" eller poäng. | 🟢 | Informativ, inte belönande. |
| 7 | **Bottom line:** "Medan du väntar kan du lägga till mer om dig – lugn och i din takt." | 🟢 | Redan implementerat. |
| 8 | **Mascot:** Idle/vänlig – inte bounce/hype. | 🟢 | pose="idle". |
| 9 | **Ingen siffra på "matchningar":** Ingen "Du får X matcher klockan Y". | 🟢 | Endast nästa tillfälle (tid). |
| 10 | **Design:** Card från ui (Card), inte nödvändigtvis V2 – acceptabelt i denna fas. | 🟡 | Framtida polish: CardV2 för konsistens. |

**Steg 4 sammanfattning:** 🟢 **9–10/10** – Release-ready. 🟡 = valfri CardV2-migration.

---

## 5. Första match-momentet

**Vad användaren ser:** Matches-sida med dagens matchningar. BestMatchCard(s). Knappar: Passa (Ghost), Chatta (Coral), Se profil. Eventuellt MatchCelebration vid första match (special_effects).

| # | Kriterium | Status | Anteckning |
|---|-----------|--------|------------|
| 1 | **Filosofi:** Match = möjlighet till samtal, inte "vinst" eller "poäng". | 🟢 | Ingen procent, ingen score. Likhet/Motsats = typ, inte ranking. |
| 2 | **Emotion:** "Här börjar samtalet" – Chatta (Coral) som relation-CTA. Passa = medvetet, inte swipe. | 🟢 | ButtonCoral på Chatta, ButtonGhost på Passa. |
| 3 | **Tempo:** Begränsad mängd (dagens matchningar). Ingen oändlig scroll/FOMO. | 🟢 | useMatches begränsat. |
| 4 | **Trygghet:** Ingen "Top pick" eller "Rekommenderad". Ingen "X gillade dig". | 🟢 | Ingen sådan copy. |
| 5 | **Relation:** Coral endast på Chatta – discovery (Passa, Se profil) utan coral. | 🟢 | Enligt guardrails. |
| 6 | **Celebration:** Endast vid special_effects "celebration"; ingen generisk "Ny match!"-modal. | 🟢 | MatchCelebration styrd av backend. |
| 7 | **Copy:** Ingen "Du och X matchar 94 %". Personality insight OK. | 🟢 | Insight = varför ni matchade, inte siffra. |
| 8 | **Tom state:** Vid inga matcher – väntfas eller tydlig "Dina matchningar kommer"-känsla. | 🟢 | WaitingPhase när journey_phase === 'WAITING'. |
| 9 | **Fel:** Vid backend-fel – ärlig felvy, inte "Du har inga matchningar" som mask. | 🟢 | Error state med Card + destructive. |
| 10 | **Navigering:** Till chatt när användaren klickar Chatta – ingen extra "Vill du verkligen chatta?". | 🟢 | Direkt till Chat. |

**Steg 5 sammanfattning:** 🟢 **10/10** – Release-ready.

---

## 6. Första chatten

**Vad användaren ser:** ChatWindow med ChatEmptyStateV2 (mascot, "Säg hej 👋", icebreakers, AI-isbrytare). ChatInputBarV2. ChatHeaderV2. Inga meddelanden än.

| # | Kriterium | Status | Anteckning |
|---|-----------|--------|------------|
| 1 | **Filosofi:** Chatt = kärnan – "Här börjar samtalet". Isbrytare som stöd, inte spel. | 🟢 | ChatEmptyStateV2 inbjuder till samtal. |
| 2 | **Emotion:** Lugn, inbjudande. "Välj en konversationsstartare eller skriv ditt eget." | 🟢 | Ingen "Skriv nu för att inte förlora matchningen". |
| 3 | **Tempo:** Användaren bestämmer när och vad. Ingen typing-pressure (visuellt OK med TypingIndicator). | 🟢 | Icebreakers valfria. |
| 4 | **Trygghet:** Ingen exponering av "läser" eller "senast sedd" om det inte är avsiktligt. | 🟡 | Kontrollera att inte "senast sedd" skapar stress. |
| 5 | **Relation:** Coral på AI-isbrytare (starta samtal) – korrekt. | 🟢 | ButtonCoral för AI-isbrytare. |
| 6 | **Mascot:** Idle i empty state – stödjer, inte distraherar. | 🟢 | MaakMascot pose="idle". |
| 7 | **Copy:** "Säg hej 👋" + "Välj konversationsstartare eller skriv ditt eget" – relationellt. | 🟢 | Ingen FOMO-copy. |
| 8 | **Header:** Match-namn, tillbaka – tydlig kontext. | 🟢 | ChatHeaderV2. |
| 9 | **Input:** Placeholder och bar känns lugn, inte "Skriv ett meddelande nu!". | 🟢 | ChatInputBarV2. |
| 10 | **Ingen "X har skrivit – svar nu":** Notiser/push är separat; i-chatten ingen urgency-copy. | 🟢 | Ingen sådan copy i empty state. |

**Steg 6 sammanfattning:** 🟢 **9–10/10** – Release-ready. 🟡 = valfri check av "senast sedd"-synlighet.

---

## Slutbedömning

| Steg | Sammanfattning | Release-ready? |
|------|----------------|----------------|
| 1. Landing → CTA | 10/10 | 🟢 Ja |
| 2. Phone auth | 9–10/10 | 🟢 Ja |
| 3. Onboarding | 8–9/10 | 🟢 Ja |
| 4. Waiting phase | 9–10/10 | 🟢 Ja |
| 5. Första match | 10/10 | 🟢 Ja |
| 6. Första chat | 9–10/10 | 🟢 Ja |

**Sammanlagt:** Resan **Landing → första chatten** är **release-ready** ur MÄÄK design-edition. Inga 🔴.  
🟡 är valfria polish: auth-copy, WelcomeScreen/formulering, foto-copy, CardV2 i WaitingPhase, "senast sedd" i chat.

---

## Rekommenderade nästa steg (valfria)

1. **Copy-audit:** Gå igenom i18n för auth + WelcomeScreen; byt "Dagliga matchningar" → mer transformationsfokus om ni vill.
2. **WaitingPhase:** Byta Card → CardV2 när ni gör UI-V2-migration på journey-komponenter.
3. **Chat:** Bekräfta policy för "senast sedd" / "läser" så att det inte bryter mot lugn/relation.
4. **Mascot-story (senare fas):** Hero happy → Problem thoughtful → Transformation love – för ännu starkare visuell berättelse.

---

*Document version: 1.0 – RELEASE READINESS DESIGN EDITION (post FAS 11).*
