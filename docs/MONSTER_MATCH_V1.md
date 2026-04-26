# Monster Match v1 — MÄÄK matchnings-algoritmen som differentieringsmotor

> **Status (2026-04-26):** Fas 1 (Foundations) klar i working tree, ej committad. Fas 2 (backend), Fas 3 (iOS UI), Fas 4 (verifiering) kvar. Migration ej applicerad mot prod.
>
> **Källa:** internt arbetsdokument `~/.claude/plans/context-pure-taco.md` (mer detaljerat). Denna fil är kanonisk plan i repo.
>
> **Tidsram:** ingår i Build 81 (efter Apple-svar på Build 80). Uppskattat ~5–8 dagars effektivt arbete.

---

## Vision

Matchnings-algoritmen är MÄÄK:s kärnvärde — inte swipe, inte feed. Dagens algoritm (40% personlighet + 30% archetyp + 30% intressen) är funktionell men generisk. **Monster Match v1** ersätter den med en tvålager-motor: matematik som kärna, LLM som synlig röst.

**Sex tänkta lager total** — v1 levererar lager 1, 2, 4. Resten skjuts till Build 82+.

| # | Lager | Roll | I v1? |
|---|---|---|---|
| 1 | Signalbas | Vad vi vet om varje användare | ✅ ja (befintligt) |
| 2 | Compatibility-modell | Räknar matchnings-score | ✅ **ja, uppgraderas** |
| 3 | Lärande | Per-användare-kalibrering | ❌ v2 |
| 4 | Förklaring (LLM) | Översätter matematiken + validerar | ✅ **ja, nytt** |
| 5 | Tempo / dramaturgi | Gradvis avslöjande över tid | ❌ v2 |
| 6 | Feedback-loop | Kemi-Check + meddelande-djup tillbaka | ❌ v2 |

---

## Lager 2 — Matematiska kärnan

### 2A. Vägd metric

| Dimension | Similar-vikt | Complementary-vikt | Why |
|---|---|---|---|
| EI | 0.8 | 1.2 | Olika energi-stilar kan komplettera |
| SN | 0.9 | 1.1 | Olika informationsbehandling balanserar |
| TF | 1.4 | 1.4 | Värderingsbas — kritisk i båda riktningar |
| JP | 1.0 | 1.0 | Beslutsstil — neutral |
| AT | 1.3 | 1.3 | Ångest-kompatibilitet — kritiskt för stabilitet |

`d = sqrt(Σ w_i × (a_i − b_i)²)` → normaliseras till score 0–100.

### 2B. Archetyp-par-kompatibilitetsmatris (16×16)

Handgjord baserad på MBTI-litteratur + complementary-teori. Symmetrisk. Score-skala:
- **90–100** golden pair · **75–89** high · **60–74** moderate · **45–59** friction · **0–44** clash

### 2C. Multi-faktor sammansatt score

```
final_score =
    0.45 × personality_distance_score   // 2A
  + 0.25 × archetype_pair_score          // 2B
  + 0.15 × interest_overlap              // befintligt
  + 0.10 × geo_demographic_soft          // närhet + ålders-närhet
  + 0.05 × complementary_bonus           // 100 om "golden complementary", annars 0
```

= 70% personlighetsbaserat. **Golden complementary** = `match_subtype === "complementary"` AND `archetype_pair_score >= 88`.

### 2D. Tre match-typer

| Typ | Andel target | Klassifikation (initialt) |
|---|---|---|
| **Similar** | 50% | Avstånd under tröskel i alla 5 dimensioner |
| **Complementary** | 35% | Avstånd över tröskel i 2+ av {EI, SN, JP}; matchning på TF/AT |
| **Growth** | 15% | Friktion på 1–2 dim inkl. minst en av {TF, AT}; matchning på resten |

Tröskel default 30; kalibreras under shadow run. Andelar är targets, inte hard constraints.

**Edge:** ingen annan dating-app har explicit "growth match"-kategori.

---

## Lager 4 — LLM-rösten

### 4A. Per match (ett anrop)

```ts
{
  story: string,                    // 1–2 meningar
  dimension_breakdown: Array<{ dim, text }>,
  icebreakers: [string, string, string],
  validation_score: number,         // 0–100, LLM:s oberoende bedömning
  validation_note: string
}
```

### 4B. Timing — hybrid (nattlig generering, latensfri leverans)

```
23:00 UTC nightly cron
  └─ generate-match-pools
       ├─ Lager 2-matematik → top N candidates per user
       └─ för varje par: llm.generateMatchPayload(context)
            └─ output cachas i candidates_data + match_story_cache

Användarens morgon → match-daily levererar redan-genererat innehåll
```

### 4D. Validation-loop

```
om |llm.validation_score - math.raw_score| > 25:
  → logga i match_validation_flags
  → leverera ändå (signal, inte block)
```

Två oberoende intelligenser bedömer samma par. Divergenser används för att kalibrera matrisen i v2.

### 4E. Cache

Nyckel: `your_archetype | their_archetype | top_2_dim_alignments | match_subtype | locale`. ~7 700 unika max. Förväntat >95% hit efter varm cache.

### 4F. Fallback (Anthropic otillgängligt)

1 retry → template-baserad text från `match-fallback.ts` → `fallback_used: true` markeras.

### 4G. Provider-abstraktion

`supabase/functions/_shared/llm.ts` — env `LLM_PROVIDER` (default `anthropic` / Claude Haiku 4.5). Pluggbar.

### 4H. Kostnad

~0.0005 USD/match · ~0.003 USD/aktiv-användare/dag · ~30 USD/dag vid 10k DAU. <5% efter cache-värmning.

---

## Datamodell

### Nya kolumner på `matches`
`match_story · match_subtype · validation_score · validation_note · fallback_used`

### Två nya tabeller
- `match_story_cache` (cache_key PK, story, breakdown, icebreakers, hit_count, last_used_at)
- `match_validation_flags` (math_score, llm_score, divergence, archetype_pair, match_subtype)

Båda `service_role`-only (RLS).

### Migration
`supabase/migrations/20260427000000_monster_match_v1.sql` — additiv, idempotent, säker att köra parallellt med Build 80.

---

## Status-tracker

### ✅ Fas 1 — Foundations (KLAR i working tree, ej committad)

| Fil | Status |
|---|---|
| `packages/core/src/match-types.ts` | ✅ klar — alla typer + konstanter |
| `packages/core/src/archetype-compatibility.ts` | ✅ klar — full 16×16 matris + helpers |
| `packages/core/src/match-fallback.ts` | ✅ klar — sv/en templates per archetyp × subtyp |
| `packages/core/src/personality.ts` | ✅ `DIMENSION_WEIGHTS` + `weightedDistance()` tillagda |
| `packages/core/src/index.ts` | ✅ re-exports tillagda |
| `packages/core/src/__tests__/personality.test.ts` | ✅ 5 nya describe-block för weightedDistance + DIMENSION_WEIGHTS |
| `packages/core/src/__tests__/archetype-compatibility.test.ts` | ✅ 16×16 symmetri, golden pairs, label buckets |
| `packages/core/src/__tests__/match-fallback.test.ts` | ✅ alla archetyp × subtyp × locale |
| `supabase/functions/_shared/llm.ts` | ✅ klar — Anthropic + retry + fallback + cacheKey |
| `supabase/migrations/20260427000000_monster_match_v1.sql` | ✅ skriven, **ej applicerad mot prod** |

**Nästa steg på Fas 1:** kör `npm test` i `packages/core` → committa → applicera migration mot prod (efter Build 80-godkännande).

### ❌ Fas 2 — Backend (PENDING)

| Fil | Status |
|---|---|
| `supabase/functions/generate-match-pools/index.ts` | ❌ uppgradera till ny scoring (2A–D) + LLM-anrop per par |
| `supabase/functions/generate-match-pools/index.test.ts` | ❌ Deno integration-test (success + fallback + divergens) |
| `supabase/functions/match-daily/index.ts` | ❌ surface nya fält i response |
| `supabase/functions/generate-icebreakers/index.ts` | ❌ migrera till `_shared/llm.ts` (samma flöde, ny wrapper) |

**Beror på:** Fas 1 committad + migration applicerad.

### ❌ Fas 3 — iOS UI (PENDING, parallellt med Fas 2)

| Fil | Status |
|---|---|
| `apps/mobile/src/components/match/MatchStoryCard.tsx` | ❌ ny — foto + badge + story + meta |
| `apps/mobile/src/components/match/MatchTypeBadge.tsx` | ❌ ny — sage/forest/guld per typ |
| `apps/mobile/src/components/match/DimensionBreakdownList.tsx` | ❌ ny |
| `apps/mobile/src/components/match/MatchExplanationBlock.tsx` | ❌ ny |
| `apps/mobile/src/app/(tabs)/index.tsx` | ❌ använd `MatchStoryCard` |
| `apps/mobile/src/app/view-match.tsx` | ❌ tre-sektion-layout |
| `apps/mobile/src/hooks/useMatches.ts` | ❌ plocka in nya fält |
| `apps/mobile/src/i18n/locales/{sv,en}.json` | ❌ `match.type.*` + `match.section.*` + fallback-mallar |

**Beror på:** Fas 1 typer (klar) — kan börjas direkt parallellt med Fas 2.

### ❌ Fas 4 — Verifiering (PENDING)

- [ ] `npm test` (Vitest) grönt
- [ ] `supabase functions deno test` grönt
- [ ] Migration applicerad rent (`npx supabase db reset` lokalt → push)
- [ ] `generate-match-pools` producerar alla 3 typer i daglig batch
- [ ] Story-text på rätt språk per användare
- [ ] Cache-träff på upprepad körning
- [ ] Validation-divergenser loggade
- [ ] iOS simulator: nya kort + detaljvy korrekt
- [ ] Fallback-väg verifierad (invalid API-key)
- [ ] Shadow run mot staging — manuell sanity-check på ~20 par
- [ ] `CLAUDE.md` "Core data flow"-sektionen uppdaterad

---

## Visuell hierarki (iOS)

```
┌────────────────────────────────────────┐
│  [Foto]                                │
│                                        │
│  Anna, 28              [Complementary] │  ← MatchTypeBadge
│                                        │
│  "Du är intuitiv och eftertänksam,    │  ← match_story (LLM)
│   hon är spontan och utåtriktad —     │     primär text, 1–2 meningar
│   ni möts på samma värderingsbas."    │
│                                        │
│  4 km bort · 3 gemensamma intressen   │  ← stödinformation
└────────────────────────────────────────┘
```

Detaljvy: tre sektioner — *"Varför ni passar"* / *"Dimensions-analys"* / *"Bra första ord"*.

**Färgmappning** (befintliga Eucalyptus Grove-tokens):
- Similar → Sage (`--secondary`)
- Complementary → Forest green (`--primary`)
- Growth → Guld (Upptäckare-kategorifärg)

Inga nya design-tokens.

---

## Rollout

**Inget A/B-test för v1.** Build 81 = monster på för alla.
- iOS-builds kräver ändå App Store-review per release
- Matematiken validerad via shadow run + tester innan release
- Vid problem: snabb-fix-build (Build 82) snarare än partiell rullout

**Säkerhetsnät:**
- `LLM_PROVIDER` env → kan hot-bytas till strikt-fallback utan deploy
- `match_validation_flags` övervakas första veckan
- Kemi-Check + meddelande-volym vecka 1 vs vecka -1 som kvalitets-proxy

---

## Out of scope (kommande versioner)

| Område | Vad |
|---|---|
| Lager 3 — Lärande | Per-användare-vikter från beteende (chat-djup, Kemi-Check, mutual rate) |
| Lager 5 — Tempo | Gradvis avslöjande över dagar (essence → mer → full profil) |
| Lager 6 — Feedback | Kemi-Check duration + meddelande-djup tillbaka i scoring |
| Embeddings | pgvector + bio/svar-embeddings för semantisk likhet |
| Värderingsfält | Religion, politik, kids, livsstil → ny dimension + onboarding-uppdatering |
| Matris-kalibrering | Auto-uppdatering av 2B från `match_validation_flags` + faktiska resultat |

---

## Risker

| Risk | Mitigation |
|---|---|
| LLM-output inkonsekvent | Strukturerad JSON + retry + fallback |
| Cache-miss högre än väntat | Rapport efter vecka 1; justera nyckel-strategi om <80% hit |
| Matris-värden fel → konstiga matchningar | Shadow run + validation-loop fångar innan användare ser |
| Migration tar lås på `matches` | Alla kolumner nullable + DEFAULT — ingen back-fill |
| Anthropic ner / pris-höjning | Fallback + provider-abstraktion |
| Privacy: profildata till externt LLM | Redan etablerat via befintliga `generate-icebreakers` + `ai-assistant` |
| Apple-review-kö för Build 81 | Monster färdigt i staging; bara väntan på godkännande |

---

## RLS-varning

Nya policies som joinar `matches` × `profiles` **måste använda SECURITY DEFINER helper-function** — recursion-fel (42P17) inträffade 2026-04-20 från inline join. Se `9ec86df` (commit) för fix-mönstret.
