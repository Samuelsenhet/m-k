# MÄÄK – Anti-Tinder Audit & Release Readiness

Dokumentet listar **UI-delar som riskerar att bli fel psykologiskt**, hur ni skyddar MÄÄK-känslan när appen växer, och en **release-readiness-bedömning** ur produkt/UX-perspektiv.

---

## 1. Anti-Tinder Audit – Riskzoner och skydd

### 1.1 Coral-användning (emotionell färg)

**Regel:** Coral = relation, aldrig discovery.

| Plats | Nuvarande användning | Risk | Skydd |
|-------|----------------------|------|--------|
| **Matches – Chatta-knapp** | ButtonCoral på varje BestMatchCard | ✅ OK – CTA till relation (chat) | Håll Coral endast på "Chatta". Aldrig på "Passa" eller "Se profil" eller på "featured"-kort. |
| **MatchCelebration** | ButtonCoral "Chatta" | ✅ OK – relation-CTA | Behåll. Trigga inte celebration ofta; ingen konfetti-loop. |
| **ChatEmptyStateV2** | ButtonCoral för AI-isbrytare | ✅ OK – stödjer konversation | Coral för "starta samtal", inte för discovery. |
| **ChatListItemCard** | ringVariant="coral" vid active/unread | ✅ OK – relation-status | Coral = du har en relation (chatt), inte "nytt objekt". |
| **StatusBadge** | start-chat (solid coral), your-turn (outline) | ✅ OK – konversationsstatus | Behåll. Lägg inte till t.ex. "Trending" eller "Populär" i coral. |
| **MatchProfileCardDark/Light** | ButtonCoral "Chatta" | ✅ OK | Används i kontext "match → chatta"; inte på landing/discovery. |

**Vad som INTE får bli coral:**  
Discovery-feed, "Rekommenderad", "Top match", "Nya användare", navigationsflikar, antal likes/visningar.

---

### 1.2 BestMatchCard och match-listan

**Regel:** En möjlighet att starta ett samtal med intention – inte "Top pick" eller scroll-feed.

| Risk | Skydd |
|------|--------|
| Kort som känns som "rekommenderade" eller rankade | Ingen procent, ingen score, ingen ordning som signalerar "bäst först". Behåll Likhet/Motsats som typ, inte som ranking. |
| Oändlig scroll / feed-känsla | Behåll begränsad mängd (t.ex. dagens matchningar). Ingen "Ladda fler" som ger FOMO. |
| "Swipe nästa"-beteende | Passa är en medveten knapp (ButtonGhost), inte en gest. Behåll det så. |
| Copy som "Du och X matchar perfekt!" | Undvik match-procent och superlativ. Personality insight är OK ("Varför ni matchade"). |

**Checklist för nya features kring match:**  
- [ ] Finns det någon siffra/percent som validerar match? → Ta bort.  
- [ ] Signaleras "bäst" eller "rekommenderad"? → Formulera om till möjlighet/intention.  
- [ ] Finns swipe eller liknande gest? → Ersätt med tydlig knapp (Passa/Chatta/Se profil).

---

### 1.3 Celebration och belöningskänsla

**Regel:** Känsla av "meningsfullt" – inte "Du vann!".

| Plats | Risk | Skydd |
|-------|------|--------|
| **MatchCelebration** | Triggas för ofta → dopamin-loop | Visa endast när `special_effects === "celebration"` (t.ex. första gången). Ingen generisk "Ny match!"-modal vid varje match. |
| **Konfetti / animation** | För mycket → spelkänsla | FirstMatchCelebration har konfetti; överväg att dämpa eller begränsa till en gång. MatchCelebration V2 är avskalad (AvatarWithRing + insight + Chatta) – behåll den tonen. |
| **Copy** | "Grattis, du fick en match!" | Undvik "vinst"-språk. Använd personality_insight och inbjudan till samtal (Chatta). |

---

### 1.4 Väntfasen (WaitingPhase)

**Syfte:** Tidsbaserad rytm, lugn design, ingen FOMO.

| Nuvarande | Risk | Rekommendation |
|-----------|------|----------------|
| Countdown + "till dina matchningar är redo" | ✅ Tydlig, tidsbaserad | Behåll. Undvik "Bara X användare kvar" eller liknande. |
| Progress bar 100% | ✅ Visar att onboarding är klar | OK. Ingen "nästa nivå" eller poäng. |
| **Tips:** "ökar dina chanser med 40%", "3–6 foton ger de bästa matchningarna" | ⚠️ Låter optimering/statistik | Ta bort procent och "bästa matchningarna". Ersätt med lugna, meningsfulla tips (t.ex. "Fyll i din bio så andra får veta mer om dig", "Lägg till foton du gillar"). |
| "Fortsätt utforska appen" | ✅ Låter användaren lämna | Behåll. Ingen "Kolla in discovery" eller "Swipa vidare". |
| "förbättra din profil för ännu bättre matchningar" | ⚠️ Lite "optimering" | Överväg mjukare: "Medan du väntar kan du lägga till mer om dig i profilen." |

**WaitingPhase = psykologisk nyckelskärm.** Den ska kännas lugn och förutsägbar, inte pressande.

---

### 1.5 Samlingar / gruppchatt

**Regel:** "Social depth UI" – inte "group chat UI" (fler kanaler, notiser, aktivitet).

| Risk | Skydd |
|------|--------|
| Gruppchatt känns som en extra kanal/feed | Designa som "djupare relation med flera" – t.ex. namngivna samlingar, tydlig kontext (vänner, aktivitet), inte anonyma rum. |
| Notiser/antal som driver återkommande check | Undvik "X nya meddelanden"-push på samlingar om det skapar FOMO. Balansera med lugn copy. |
| Lista av grupper som "fler att swipea" | Behåll fokus på konversation och kontext, inte på antal grupper. |

*(Implementationsdetaljer för gruppchatt ligger utanför denna audit; detta är produkt-/UX-principer.)*

---

### 1.6 Landing och onboarding

| Område | Risk | Skydd |
|--------|------|--------|
| **Landing** | "Skaffa fler matchningar" / "Swipa nu" | Storytelling om relation och personlighet. CTA typ "Kom igång" / "Lär känna dig" – inte "Hitta kärleken idag". |
| **Onboarding** | Långa listor, stress | Kort, tydliga steg. MaakMascot och empty states ger emotionell trygghet – behåll. |
| **Personality test** | Känns som "poäng" | Presentera som "Lär känna dig" / "Din typ" – inte "Ditt resultat: 98%". |

---

### 1.7 Navigations- och globala mönster

| Mönster | Status | Skydd |
|---------|--------|--------|
| BottomNav: Matchning → Chatt → Profil | ✅ Matchar Passa → Chatta → Se profil | Lägg inte till "Discovery" eller "Utforska" som huvudflik. |
| Ingen swipe-entry på matchning | ✅ | Nya features ska inte introducera swipe som primär interaktion. |
| Chat som primär handling efter match | ✅ | Behåll. "Se profil" är sekundär. |

---

## 2. Snabbreferens – MÄÄK-guardrails

Använd detta vid ny funktionalitet eller designbeslut:

1. **Inga likes, swipe, match-%, scorebars, ranking.**  
2. **Coral = relation (chat, status i chatt, celebration-CTA).** Aldrig discovery eller "featured".  
3. **BestMatchCard = möjlighet att starta samtal.** Inte "Top match" eller rekommenderad.  
4. **Celebration = sällan, meningsfull.** Ingen konfetti-loop eller "Du vann!".  
5. **WaitingPhase = lugn, tidsbaserad.** Inga procent eller FOMO-copy i tips.  
6. **Chatten är produkten.** Matchning är gateway; relation sker i chatten.  
7. **Empty states + mascot = trygghet.** Behåll emotionell trygghet, inte tomhet som "fyll på mer".  

---

## 3. Är detta redo för release? (Produkt/UX)

### 3.1 Vad som är på plats

| Kriterium | Status |
|-----------|--------|
| Kärnfilosofi Passa → Chatta → Se profil | ✅ Implementerad utan like/swipe/percent. |
| CTA-hierarki (Ghost/Secondary/Coral) | ✅ Chatta = primär (Coral), Passa/Se profil = sekundär. |
| Personlighetsfokus (badges, insight, inga scores) | ✅ |
| Chat som primär handling | ✅ Start Chat / Your Turn, quick actions, AI-isbrytare, celebration → Chatta. |
| Low-pressure UX (coral endast i relation) | ✅ |
| Navigationslogik (Matchning → Chatt → Profil) | ✅ Ingen Discovery-feed. |
| Empty states med mascot | ✅ |
| Designsystem V2 (tokens, komponenter) | ✅ Migreringar genomförda för Chat, Matchning, Profil. |

### 3.2 Vad som återstår för "10/10" (inte stoppare för release)

| Område | Rekommendation |
|--------|----------------|
| **WaitingPhase UX** | Ta bort procent och "bästa matchningarna" i tips; mjukare, lugn copy. Valfritt: migrera till V2-tokens för visuell konsistens. |
| **Samlingar emotionell design** | Tydliggör "social depth" – namn, kontext, inte feed av grupper. |
| **Landing storytelling** | Säkerställ att copy och CTA är relation/personlighet, inte "fler matchningar" eller swipe. |

### 3.3 Slutsats release-readiness

- **Produkt/UX:** Appen följer MÄÄK-filosofin, har rätt CTA-logik, färgstrategi och match-representation.  
- **Release ur MÄÄK-perspektiv:** **Ja, redo**, med förbehåll att:
  - WaitingPhase inte förstärker FOMO (enkel copy-justering).
  - Nya features valvs mot Anti-Tinder-listan ovan.

**Betyg enligt tidigare bedömning:** 9.2/10 – MÄÄK-compliant. Det som saknas för 10/10 är finjustering (WaitingPhase, samlingar, landing) – inte grundläggande UI-logik.

---

## 4. Nästa steg (rekommenderad ordning)

1. **WaitingPhase:** Uppdatera tips-copy (inga procent, ingen "bästa matchningarna"); valfritt V2-styling.  
2. **Ny feature / A/B-test:** Gå igenom "Snabbreferens – MÄÄK-guardrails" innan release.  
3. **Landing V2 (FAS 10):** Säkerställ storytelling och CTA i linje med detta dokument.  
4. **Dokumentera beslut:** När ni avviker från guardrails (t.ex. en coral-CT på landing), dokumentera varför och att det är medvetet.

---

*Senast uppdaterad utifrån design- och feature compliance-genomgång. Kan användas som levande checklista vid design- och produktbeslut.*
