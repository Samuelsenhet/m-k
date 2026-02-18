# [FAS 9: Profile – V2 Migration]

**Status:** ✅

---

## Filer ändrade

- **`src/components/profile/ProfileView.tsx`**
  - Migrerad till V2: endast ui-v2-komponenter och token-styling.
  - Data: `interested_in` tillagd i `ProfileData` och i Supabase-select (plus `id_verification_status`, `education`, `gender`, `dating_intention`, `dating_intention_extra`, `relationship_type`, `relationship_type_extra`).
  - Layout: `bg-warm-dark`, sticky top bar (ButtonIcon Inställningar + avatar-knapp Redigera), hero-bild 3:4 med indikatorer och prev/next vid flera foton.
  - Tomt foto-state: MaakMascot pose="idle" + ButtonPrimary "Lägg till foto".
  - Innehållssektion (token text-primary-foreground på mörk bakgrund): namn, ålder, ArchetypeBadge, stats-rad (Verifierad, antal matcher), bio, intressen (InterestChipV2 variant="dark"), ButtonPrimary Redigera profil, knapp "Visa mer".
  - Tom bio / tomma intressen: empty state med MaakMascot + hjälptext + ButtonGhost Redigera.
  - Expandable "Visa mer": panel med bg-card, border-border, token text-foreground/muted-foreground; innehåll oförändrat (dejtingavsikter, personlighet, arketyp, extra info). Sista knapp: ButtonPrimary Redigera.
  - Borttaget: `Button`, `Card`, `CardContent` från profile view; `Camera`, `ImagePlus`, `HelpCircle`; hårdkodad `text-white`/`text-blue-400` i huvudvy och panel (ersatt med tokens).

---

## Checklista

- [x] Profil använder V2-komponenter (ButtonPrimary, ButtonGhost, ButtonIcon, ArchetypeBadge, InterestChipV2, MaakMascot)
- [x] Mörk bakgrund bg-warm-dark
- [x] Stor profilbild 3:4, namn + ålder, ArchetypeBadge under namn
- [x] Bio-sektion; intressen med InterestChipV2 variant="dark"
- [x] Stats-rad (verifierad, antal matcher) med tokens
- [x] Actions: Redigera profil, Inställningar (befintlig navigation)
- [x] Empty states för bio och intressen med MaakMascot pose="idle" + hjälptext
- [x] Alla gamla ui/-komponenter borttagna från ProfileView
- [x] Endast tokens (ingen hårdkodad färg)
- [x] Ingen ny datahämtning eller backend-ändring (endast utökad select)
- [x] A11y: aria-label, fokus, drag-handle och knappar oförändrade

---

## Ändringar

- **Data:** `interested_in` hämtas och parsas till lista (komma/semikolon) för InterestChipV2. Övriga fält som redan användes i "Visa mer" hämtas nu i huvud-fetchen.
- **Layout:** Fullskärms-overlay ersatt med scrollbar sida: top bar → hero 3:4 → innehållsblock. "Visa mer" är kvar som expanderbar panel med token-bakgrund (bg-card).
- **Guardrails:** Inga likes, procent eller scores. ProfileEditor, Settings, Achievements och AI-assistent påverkas inte (samma navigation som tidigare).

---

## Frågor

1. **Achievements / AI-assistent:** De öppnas idag från Profile-sidan (t.ex. via inställningar). Ska de även få direkta actions på profilvyn i en senare fas, eller ska det fortsatt bara vara Redigera + Inställningar?
2. **MatchProfileCardDark:** Används inte som komponent i ProfileView; layouten följer samma idé (mörk kort-liknande vy, bild, namn, about, intressen) men byggd med tokens och separata sektioner för att få in ålder, ArchetypeBadge, stats och egna actions. OK att behålla så?

---

## Nästa steg

- FAS 10 – Landing V2  
- FAS 11 – Photo Upload V2  
- FAS 12 – VideoCall V2  
- FAS 13 – Personality / Welcome / WaitingPhase polish  

**Filosofi-guard:** Ingen like, procent eller score. ✅
