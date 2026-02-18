# [FAS 8: Matchning – V2 Migration]

**Status:** ✅

---

## Filer ändrade

- **`src/hooks/useMatches.ts`**  
  - Match-typen: `interests: string[]` tillagd (mappas från API `common_interests`).

- **`src/components/ui-v2/card/BestMatchCard.tsx`**  
  - Använder `InterestChipV2` istället för vanliga spans.  
  - Ny prop `matchType?: "similar" | "complementary"` → renderar `MatchTypeBadge` (text: Likhet/Motsats).

- **`src/components/ui-v2/match/MatchCelebration.tsx`** (ny)  
  - Modal när `match.special_effects` innehåller `"celebration"`.  
  - Innehåll: `AvatarWithRing`, text från `personality_insight`, CTA Chatta, stängbar.  
  - Token-styling: `bg-card`, `border-border`, `shadow-elevation-2`, `bg-warm-dark/80`.

- **`src/components/ui-v2/match/index.ts`** (ny)  
  - Export av `MatchCelebration` och `MatchCelebrationProps`.

- **`src/components/ui-v2/index.ts`**  
  - Export av `MatchCelebration` och `MatchCelebrationProps`.

- **`src/pages/Matches.tsx`**  
  - Pending-matchkort: ersatta med `BestMatchCard` + `ButtonGhost` (Passa), `ButtonCoral` (Chatta), `ButtonSecondary` (Se profil).  
  - Ingen matchprocent, ingen Gilla-knapp, ingen score-bar.  
  - Celebration: `FirstMatchCelebration` ersatt med `MatchCelebration` (visas när någon match har `special_effects` innehållande `"celebration"`).  
  - Tom state: `MaakMascot` med `pose="idle"`, text från `t('matches.noMatches')`, token-kort, ingen ikon i huvudtexten.  
  - Hjälpfunktion `toArchetypeKey(category)` för att mappa API-kategori till ui-v2 `ArchetypeKey`.  
  - `getCategoryBadgeClass` kvar endast för mutual-matchsektionen (oförändrad).

---

## Checklista

- [x] Riktig data i BestMatchCard (match.id, matchedUser, interests, matchType, archetype)
- [x] Passa → Chatta → Se profil (ButtonGhost, ButtonCoral, ButtonSecondary)
- [x] MatchTypeBadge endast text (Likhet/Motsats)
- [x] ArchetypeBadge med rätt färg (via toArchetypeKey)
- [x] Empty state med MaakMascot, i18n, inga ikoner i huvudtexten
- [x] MatchCelebration vid `special_effects === "celebration"` (AvatarWithRing, personality_insight, CTA Chatta, stängbar)
- [x] Inga gamla ui/-komponenter i pending-korten (endast ui-v2)
- [x] Token-baserad styling på nya kort och modal
- [x] Ingen visuell regression (typecheck ok)

---

## Ändringar

- **Data:** `useMatches` exponerar `interests` (från `common_interests`) per match.  
- **BestMatchCard:** Stöd för `matchType`, `InterestChipV2`, befintlig 3:4-bild och namn.  
- **Matches-sida:** Pending-listan renderar en `BestMatchCard` per match + tre knappar (Passa, Chatta, Se profil). Tabs (Alla / Likhets / Motsats) och förklarande text kvar. Mutual-matchsektionen oförändrad.  
- **Förbjudet enligt prompt:** Like-knapp, swipe, matchprocent, score, snabba beslut-UI – borttagna från pending-korten.

---

## Frågor

1. **Mutual matches:** Sektionen använder fortfarande gamla `card-premium` och `getCategoryBadgeClass`. Ska den migreras till V2-kort i en senare fas?
2. **Chatta-label:** Knappen är hårdkodad som "Chatta". Vill ni ha en i18n-nyckel (t.ex. `matches.chatta`)?

---

## Nästa steg

- **STOPPA.** Starta inte nästa fas.  
- Vänta på godkännande.  
- Därefter enligt er ordning: Profile V2 → Landing V2 → VideoCall V2.

---

**Filosofi-guard:** Ingen like, swipe, procent eller score. Passa → Chatta → Se profil. ✅
