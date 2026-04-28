# Monster Match v1 — MÄÄK matchnings-algoritmen som differentieringsmotor

> **Status (2026-04-28):** Fas 1 (foundations), Fas 2 (backend), Fas 3 (iOS UI) **alla committade på `feature/monster-match-v1`**. Synthesis-refit (lager 4 in i ranking + embeddings) committad på `feature/monster-match-synthesis` (7 commits framåt). Schema, embeddings-cron, scoring-uppgradering: **allt deployat mot prod**. End-to-end synthesis verifierad live 2026-04-28 — flagga `MONSTER_MATCH_ENABLED` är off i prod tills Build 81 godkänd.
>
> **Återstår:** Steg 4 (iOS UI-refresh — komponenterna finns, useMatches konsumerar redan nya fält), Steg 5 (Build 81 ship + permanent flag-flip efter Apple), Steg 6 (v1.1 — beteende- och foto-signaler om 3–4 veckor).
>
> **Källa:** plan-fil `~/.claude/plans/eager-honking-stream.md` (synthesis-refit godkänd 2026-04-28).
>
> **Tidsram:** Backend klart. Build 81 = iOS-refresh + Apple submission.

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
`supabase/migrations/20260427000000_monster_match_v1.sql` — additiv, idempotent, applicerad mot prod 2026-04-28.

---

## Synthesis-refit (2026-04-28)

Efter Fas 1–3 var v1-baselinen fortfarande "aggregering med kosmetika": LLM såg bara fem strängar (archetyper + top-2-dim + subtyp + locale), validation-loop scorade från samma input, cache var 7 700 fasta mallar. Synthesis-refiten gör algon till äkta syntes.

### Lager 2 omformat: math shortlistar, LLM scorar, composite rankar

Slutgiltig composite-formel ersätter `0.45/0.25/0.15/0.10/0.05`:

```
final_score =
    0.30 × math_distance         (Lager 2A — weightedDistance)
  + 0.20 × archetype_pair        (Lager 2B — 16×16 matris)
  + 0.20 × embedding_similarity  (NY — pgvector cosine på bio + answers)
  + 0.20 × llm_judgment          (NY — validation_score från generateMatchPayload)
  + 0.05 × interests
  + 0.05 × geo
```

Synthesis-vikterna aktiveras endast när BÅDA nya signaler finns. Partial-mode (bara embedding eller bara llm) faller tillbaka på v1-formeln för att inte dubbelräkna personlighet.

### Ny: Lager 1.5 — feature store (`user_signals`)

Per-user-tabell som scoring läser från. Att lägga till nya signaler i v1.1+ = ny kolumn, **inte** refactor av formel.

| Kolumn | v1 | v1.1 |
|---|---|---|
| `bio_embedding vector(1536)` | ✅ populeras nattligt | |
| `answers_embedding vector(1536)` | ✅ populeras nattligt | |
| `response_time_p50 numeric` | (null) | ✅ från Build 81-data |
| `kemi_check_avg_seconds numeric` | (null) | ✅ |
| `message_depth_p50 numeric` | (null) | ✅ |
| `photo_aesthetic_tags jsonb` | (null) | ✅ vision-API |

Service-role-only RLS. HNSW-index på båda embeddings för cosine-ANN-sökning.

### Embedding-cron (Lager 1.5 producent)

`supabase/functions/compute-user-embeddings` — kör nattligt 00:45 UTC (efter match-pools 23:00 + engagement 00:30). OpenAI `text-embedding-3-small` (1536 dim, $0.02/M tokens). Provider-abstraktion i `_shared/embeddings.ts` så Voyage/Cohere kan kopplas in senare via `EMBEDDING_PROVIDER`-env.

### Cache-strategi-byte

- **Innan:** 7 700 fasta mallar keyade per archetyp-par × subtyp × locale → ~99 % hit, ~0 syntes.
- **Efter:** per-par cache keyad på `(user_a_id, user_b_id, signals_hash, model_version)`, TTL 7 dagar. Lägre hit-rate (~60–70 %) men äkta syntes. Kostnad <100 USD/dag vid 10k DAU.

### Feature flag

`MONSTER_MATCH_ENABLED` (default off). Med flaggan av går scoring v1-vägen → Build 80 i App Review opåverkad. Flippas till true efter Build 81 godkänd.

---

## Status-tracker (2026-04-28)

### ✅ Fas 1 — Foundations (commit `d2c26d8` på `feature/monster-match-v1`)
Typer, 16×16 matris, fallback-mallar, `_shared/llm.ts`, migration `20260427000000_monster_match_v1.sql`. **Migration applicerad mot prod.**

### ✅ Fas 2 — Backend (commits `ac422e4` + `c8d4653` på `feature/monster-match-v1`)
generate-match-pools wirar Monster Match-fält, match-daily + sunday-rematch surfacar dem.

### ✅ Fas 3 — iOS UI (commit `4062ca2` på `feature/monster-match-v1`)
`MatchStoryCard`, `MatchTypeBadge`, `DimensionBreakdownList`, `MatchExplanationBlock`. `useMatches.ts` konsumerar nya fält.

### ✅ Synthesis-refit (commits `2aff68a` → `e7f17e9` på `feature/monster-match-synthesis`)

| Steg | Commit | Verifierad |
|---|---|---|
| 1. Schema (user_signals + pgvector + revoke-anon) | `2aff68a` + `e07e300` | ✓ prod |
| 2. compute-user-embeddings cron | `9cfbd6e` + `fafd5ce` | ✓ 2/3 users embeddade |
| 3a-c. Composite + cosine + flag | `668b0e4` | ✓ 156/156 tester |
| 3d. Wire embedding + LLM-judgment | `92a0af8` | ✓ deployad |
| 3e. End-to-end synthesis | (live test) | ✓ matchScore 75 = full formel |
| 3f. Synthesis-mode tester | `e7f17e9` | ✓ 15 nya tester |
| Diagnostic-fix för LLM-fel | `9a5e3e0` | ✓ |

### ❌ Fas 4 — Återstår

- [ ] iOS UI testat i Expo Go efter att ha satt `MONSTER_MATCH_ENABLED=true` lokalt
- [ ] Build 81 submission till Apple
- [ ] Permanent flag-flip i prod efter Apple-godkännande
- [ ] Övervaka `match_validation_flags` första 7 dagarna
- [ ] CLAUDE.md "Core data flow"-sektionen uppdaterad med synthesis-formeln

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
