# Manuell verifieringschecklista (US-017–US-029)

Denna checklista motsvarar verifieringsstegen för **App Completion & Polish** (US-017–US-029) i [docs/prd/PRD.md](docs/prd/PRD.md). Kör `npm run dev`, öppna appen i webbläsaren och bocka av medan du testar.

---

## Förberedelse

- [ x] Starta appen: `npm run dev`
- [x ] Öppna http://localhost:8080 (eller den port som visas)
- [ x] Öppna DevTools och sätt mobil-viewport när mobil testas

---

## Profil – foton (US-017–US-020)

**Navigera:** Profil → Redigera profil → Foton.

### Uppladdning (US-017)

- [x] Klicka "Ladda upp foton" och välj en bild
- [x] Progress bar visas med procent
- [x] Filnamn visas under uppladdning
- [x] Progress går smidigt 0% → 100%
- [x] Success-animation när klar
- [x] Testa flera foton (kö fungerar)
- [x] Ogiltig filtyp ger felmeddelande
- [x] Fil > 5MB ger felmeddelande
- [x] Testa i mobil-viewport

### Antal och gräns (US-018)

- [x] "X/6 photos" visas
- [x] Ladda upp tills 6 foton – knappen inaktiveras vid 6
- [x] Tooltip visas vid hover på inaktiverad knapp
- [x] "Komplett"-badge med sparkle-ikon vid max
- [x] Toast-fel om man försöker ladda upp vid max
- [x] Testa i mobil-viewport

### Omdrag (US-019)

- [x] Minst 3 foton uppladdade
- [x] Dra ett foto till ny position
- [x] Visuell feedback under drag
- [x] Ordning uppdateras efter drop
- [x] "Huvudfoto"-badge på första fotot
- [x] Ordning kvar efter sidladdning
- [x] Testa touch-drag i mobil-viewport

### Radera (US-020)

- [x] Minst 2 foton uppladdade
- [x] Klicka papperskorg på ett foto
- [x] Bekräftelsedialog visas
- [x] Klicka "Ta bort" – fotot försvinner
- [x] Kvarvarande foton omordnas
- [x] Sista fotot kan inte raderas (felmeddelande)
- [x] Testa i mobil-viewport

---

## Telefonauth (US-021)

### Ny användare

- [ ] Ange svenskt mobilnummer (07X XXX XX XX)
- [ ] Ta emot OTP (eller demo 123456 i dev)
- [ ] Ange OTP
- [ ] Slutför åldersverifiering
- [ ] Redirect till onboarding

### Återvändande användare

- [x] Ange nummer + OTP
- [x] Redirect till matchningar (om onboarding klar) eller onboarding (om ej klar)

### Fel

- [x] Ogiltigt nummerformat visar fel
- [x] Fel OTP visar fel
- [x] Utgången OTP visar fel

### Session

- [x] Session kvar efter sidladdning
- [x] Inga redirect-loopar

---

## Matchprofil (US-022)

- [] Gå till Matchningar
- [ ] Klicka på ett matchkort
- [ ] MatchProfileView öppnas fullskärm
- [ ] Matchens foton visas
- [ ] Overlay med namn, ålder, längd, arbete, plats
- [ ] Personlighetsbadge visas om tillgänglig
- [ ] Swipe mellan foton fungerar
- [ ] Knappar (like, pass, chatta) fungerar
- [ ] Tillbaka-knapp går tillbaka till matchningar
- [ ] Testa i mobil-viewport

---

## Egen profil (US-023)

- [x] Gå till Profil-sidan
- [x] Fullskärmsfoto visas
- [ ] User info overlay (namn, ålder, längd, arbete, plats)
- [ ] Klicka "Visa mer"
- [x] Expanderbar sektion öppnas smidigt
- [ ] Bio visas om tillgänglig
- [ ] Personlighetssektion: arketyp-emoji/titel, beskrivning, styrkor, kärlekstil
- [ ] Infogrid (arbete, plats, ålder, längd)
- [x] "Redigera profil" fungerar
- [x] Testa i mobil-viewport

---

## Design (US-024)

- [ ] Landing – mobil-first, premium design
- [ ] Matches – kort, fullskärmsprofil
- [ ] Chat – mobil chattgränssnitt
- [ ] Profile – fullskärmsdesign
- [ ] Onboarding – mobiloptimerat flöde
- [ ] Färger, typografi, spacing konsekventa
- [ ] Touch-targets min 44px
- [ ] Safe area hanteras
- [ ] BottomNav på alla huvudsidor
- [ ] Testa i mobil-viewport

---

## TypeScript och lint (US-025)

- [ ] `npm run build` passerar utan fel
- [ ] `npm run lint` passerar utan fel
- [ ] Inga onödiga `any`; `@/`-alias används
- [ ] Supabase-typer uppdaterade; inga oanvända imports
- [ ] Console.log endast i DEV

---

## Användarresa (US-026)

### Ny användare

- [x] Start på hemsidan → "Kom igång"
- [x] Telefonauth → ålder → onboarding
- [ ] Personlighetstest → resultat → foton → profil
- [ ] Matchningar → matchprofil → chatt → isbrytare → egen profil

### Återvändande

- [ ] Inloggning med telefon → korrekt redirect
- [ ] Data kvar (persistens)

### Kvalitet

- [ ] Inga fel under flödena
- [ ] Inga oändliga loopar

---

## Felhantering (US-027)

- [ ] ErrorBoundary finns och routes är wrappade
- [ ] Fallback-UI (svenska, retry-knapp)
- [ ] Async med try/catch; Supabase/edge-fel hanterade
- [ ] Användarvänliga felmeddelanden (svenska)
- [ ] Test: nätverk av, ogiltigt svar, DB-fel (om möjligt)

---

## Prestanda (US-028)

- [ ] `npm run build` – kontrollera bundle-storlekar
- [ ] Main bundle < 600 KB (gzipped)
- [ ] Vendor chunks uppdelade
- [ ] Lighthouse: Performance > 85, Accessibility > 90, Best Practices > 90
- [ ] Lazy loading på tunga komponenter

---

## PWA (US-029)

- [ ] Service worker registrerad
- [ ] "Lägg till på hemskärmen" fungerar
- [ ] Offline-fallback sida
- [ ] manifest.json korrekt
- [ ] Ikoner 192x192 och 512x512
- [ ] (Valfritt) Test på riktig mobil

---

## Build och lint (slutkontroll)

- [x] `npm run typecheck` passerar
- [x] `npm run lint` passerar
- [x] `npm run build` lyckas

---

När alla relevanta rutor är bockade är US-017–US-029 manuellt verifierade. För exakta acceptance criteria, se [docs/prd/PRD.md](docs/prd/PRD.md).
