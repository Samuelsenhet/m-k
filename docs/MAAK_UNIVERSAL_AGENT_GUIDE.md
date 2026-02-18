# 📄 MĀĀK Universal Agent Guide - Task Prompt Template

Grundguide för agenten att använda för **ALLA** uppdrag.

**Version 1.0 | 2025-02-16**

---

## Innehållsförteckning

1. Introduktion
2. Arbetsmetodik
3. Startup Questions
4. Fas-indelning
5. Checklista
6. Rapporteringsformat
7. Definition of Done
8. Problemhantering
9. Exempel
10. Tom mall
11. Snabbguide & viktiga punkter

---

## 1. Introduktion

Denna guide är det **grundläggande ramverket** för alla uppdrag för MĀĀK. Oavsett om uppgiften är buggfix, ny feature, städning eller design – **följ alltid denna struktur**.

**Syftet:**

- Skapa förutsägbarhet i hur du arbetar
- Säkerställa rätt kontext
- Göra det enkelt att följa arbetet
- Undvika missförstånd och onödiga misstag

---

## 2. Arbetsmetodik

### ❌ ALDRIG

| Beteende | Konsekvens |
|----------|------------|
| Hoppa mellan uppgifter | Kaos, svårt att följa |
| Gissa dig fram | Fel, slöseri med tid |
| Ignorera checklistor | Missade steg |
| Arbeta utan kontext | Fel grund |
| Göra flera saker samtidigt | Tappat fokus, högre risk |

### ✅ ALLTID

| Beteende | Varför |
|----------|--------|
| Börja med Startup Questions | Rätt kontext från början |
| Dela upp i faser | Hanterbara delar |
| Följ checklistan | Inget missas |
| Rapportera enligt formatet | Snabb statusöversikt |
| Fråga vid osäkerhet | Färre misstag |
| Testa efter varje ändring | Fånga fel tidigt |
| Markera när en fas är klar | Tydlighet för nästa steg |

---

## 3. Startup Questions – ALLTID FÖRST

Innan du påbörjar **något arbete**, få svar på:

```
## 🚀 STARTUP QUESTIONS - [UPPDRAGSNAMN]

1. **Projektstruktur:** Vilka filer/kataloger är relevanta? Exakta filvägar om möjligt.
2. **Beroenden:** Finns redan implementerade lösningar eller liknande kod att utgå från?
3. **Design/Visuellt:** Finns designskisser, Figma, referensbilder eller önskad visuell stil?
4. **Teknisk kontext:** Vilka delar av stacken berörs (React, Supabase, etc.)? Databas-schema eller API-dokumentation?
5. **Prioritet:** Vad är viktigast att lösa först? Deadlines eller milstolpar?
6. **Risker:** Finns något som kan gå sönder? Behöver jag vara extra försiktig?
7. **Acceptanskriterier:** Hur vet vi att uppgiften är korrekt löst? Specifika tester som måste passera?
```

---

## 4. Fas-indelning

Alla uppdrag delas in i **tydliga faser**. Varje fas ska vara:

- **Avgränsad** – en sak i taget
- **Testbar** – går att verifiera
- **Hanterbar** – inte för stor

### Mall för fas-indelning

```
### 🔴 FAS 1: [BESKRIVANDE NAMN]
**Mål:** [Vad ska uppnås?]
**Checklista:** [ ] Punkt 1, [ ] Punkt 2, ...
**Definition of Done:** [Kriterier]

### 🟡 FAS 2: [NAMN]
...

### 🟢 FAS 3: [NAMN]
...
```

---

## 5. Checklista per fas

- **Konkret** – inga vaga punkter
- **Mätbar** – går att bocka av
- **Fullständig** – alla nödvändiga steg

Bra exempel: "Skapa filen `/src/components/Button.tsx`", "Implementera variant='primary' med gradient", "Kör `npm run lint` och fixa fel".

---

## 6. Rapporteringsformat

Använd för varje fas/svar:

```
## [FAS X: NAMN]
**Status:** 🟡 Pågående / ✅ Klar / 🔴 Blockerad
**Startad:** [YYYY-MM-DD HH:MM]
**Avslutad:** [YYYY-MM-DD HH:MM]

### 📁 FILER ÄNDRADE:
- `/path/to/file` - [Förklaring]

### ✅ CHECKLISTA STATUS:
- [x] Punkt 1 klar
- [ ] Punkt 2 kvar

### 📊 STATISTIK:
- Nya filer: [X], Ändrade: [X], Borttagna: [X]
- Testresultat: [OK/Fail]

### ❓ FRÅGOR/OSÄKERHETER:
1. [Fråga]

### 🚀 NÄSTA STEG:
1. [Åtgärd]

### ⚠️ RISKER/BLOCKERS:
- [Inga / beskrivning]

### 📝 KOMMENTARER:
- [Observationer]
```

---

## 7. Definition of Done – global

En fas eller uppgift är **klar** först när:

| Kriterium | Verifiering |
|-----------|-------------|
| Checklistan 100 % avbockad | Visuell inspektion |
| Inga console errors | Devtools i webbläsaren |
| Bygget fungerar | `npm run build` |
| Lint klar | `npm run lint` |
| Type check OK | `npm run typecheck` (om finns) |
| Funktionen testad manuellt | Du har provat själv |
| Dokumenterad i kod vid behov | Kommentarer |
| Inga regressioner | Annan funktionalitet påverkas inte |

---

## 8. Problemhantering

1. **STANNA** – fortsätt inte gissa eller chansa.
2. **RAPPORTERA** med:
   - Problembeskrivning (vad, var)
   - Vad du har försökt
   - Förslag på lösningar (med för-/nackdelar)
   - Tydlig fråga
3. **VÄNTA** på svar innan du fortsätter.

---

## 9. Exempel på bra rapport

```
## [FAS 1: SKAPA CORAL-FÄRG I BUTTONS]
**Status:** ✅ Klar
**Startad:** 2025-02-16 10:30
**Avslutad:** 2025-02-16 11:45

### 📁 FILER ÄNDRADE:
- `/src/components/ui/Button/index.tsx` - Lade till variant="coral" med gradient
- `/src/lib/colors.ts` - Uppdaterade med coral-palett
- `/src/index.css` - CSS-variabler för coral

### ✅ CHECKLISTA STATUS:
- [x] Skapa coral-färger i colors.ts
- [x] Uppdatera Button med coral-variant
- [x] Testa Chrome, Safari, Firefox
- [x] Uppdatera dokumentation

### 📊 STATISTIK:
- Nya filer: 0, Ändrade: 3, Borttagna: 0
- Testresultat: OK

### 🚀 NÄSTA STEG:
Inväntar godkännande. Nästa fas: uppdatera Avatar-komponent.
```

---

## 10. Tom mall – kopiera för varje uppdrag

```
## [FAS X: NAMN]
**Status:** 🟡 Pågående / ✅ Klar / 🔴 Blockerad
**Startad:** [YYYY-MM-DD HH:MM]
**Avslutad:** [YYYY-MM-DD HH:MM]

### 📁 FILER ÄNDRADE:
- [Filväg] - [Förklaring]

### ✅ CHECKLISTA STATUS
- [ ] [Punkt]

### 📊 STATISTIK
- Nya filer: [X], Ändrade: [X], Borttagna: [X]
- Testresultat: [OK/Fail]

### ❓ FRÅGOR:
1. [Fråga]

### 🚀 NÄSTA STEG:
1. [Nästa]

### ⚠️ RISKER/BLOCKERS:
- [Inga / beskrivning]

### 📝 KOMMENTARER
- [Kommentar]
```

---

## 11. Snabbguide – arbetsflöde

```
NYTT UPPDRAG → STEG 1: Startup Questions (fråga/bekräfta) → STEG 2: Dela upp i faser, få godkännande
→ STEG 3: Arbeta fas för fas, rapportera efter varje → STEG 4: Klart (DoD uppfylld)
```

| Situation | Gör detta |
|-----------|-----------|
| Osäker på något | Fråga direkt |
| Hittar ett problem | Rapportera med status Blockerad |
| Klar med en fas | Rapportera och ange nästa steg |
| Behöver mer info | Ställ startup questions |
| Allt fungerar | Gå vidare till nästa fas |

---

**Denna guide gäller för alla framtida uppdrag – oavsett storlek.**

Dokument version 1.0.
