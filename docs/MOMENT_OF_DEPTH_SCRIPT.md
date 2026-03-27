# Moment of Depth – produktionsskript (~10 s + bridge)

Detta dokument stödjer onboarding-interstitialen i personlighetstestet (mobil: `MomentOfDepthInterstitialRN`, webb: `MomentOfDepthInterstitialWeb`) och anger vilka i18n-nycklar som används på andra ytor.

## Onboarding – filosofi (ca 9,3 s rad-för-rad)

Konstant i kod: `MOMENT_DEPTH_LINE_MS = 580` ms per rad → 16 × 580 ms ≈ **9,28 s** innan paus före matchningsblocket.

| Tid (ca) | Rad | i18n-nyckel (en/sv under `maak_moment_of_depth`) |
|----------|-----|---------------------------------------------------|
| 0,0 s | 1 | `lines_01` |
| 0,58 s | 2 | `lines_02` |
| … | … | `lines_03` … `lines_15` |
| 8,7 s | 16 | `lines_16` |

**Maskot:** `apps/mobile/assets/images/mascot/onboarding.png` (RN) / webbens motsvarande Mascot på landing. **Puls:** scale 1 → 1,06 → 1 med ~1,4 s cykel, loop under hela interstitialen.

## Bridge – hur MÄÄK matchar (efter sista raden)

Visas **efter** att alla 16 rader tickats fram (+ kort paus ~400 ms i kod).

| Innehåll | i18n-nyckel |
|----------|-------------|
| Rubrik | `maak_matching_story.title` |
| Stycke 1 | `maak_matching_story.body_1` |
| Stycke 2 | `maak_matching_story.body_2` |
| Stycke 3 | `maak_matching_story.body_3` |

**CTA:** `maak_moment_of_depth.continue_cta` – återupptar testet på samma frågeindex.

## Placering 2 – matchningar redo (WAITING → READY / FIRST_MATCH)

- **Mobil:** [`apps/mobile/app/(tabs)/index.tsx`](../apps/mobile/app/(tabs)/index.tsx) – modal vid fasbyte, en gång per installation (`AsyncStorage` `@maak/matches_ready_celebration_seen`).
- **Nycklar:** `maak_narrative_variants.matches_ready_title`, `matches_ready_body`, `see_matches_cta`.

## Placering 3 – tom chatt

- **Mobil:** [`ChatThread.tsx`](../apps/mobile/components/chat/ChatThread.tsx) – `ListEmptyComponent`.
- **Nycklar:** `maak_narrative_variants.chat_empty_title`, `chat_empty_body`.

## Placering 4 – AI-isbrytare

- **Mobil:** samma fil, rad ovanför isbrytar-UI.
- **Nycklar:** `maak_narrative_variants.icebreaker_intro`, `ai_suggestions_label`.

## Placering 5 – landing / marknad

- **Webb:** [`LandingHero.tsx`](../src/components/landing/LandingHero.tsx) – hero-undercopy.
- **Mobil:** [`landing.tsx`](../apps/mobile/app/landing.tsx).
- **Nyckel:** `maak_narrative_variants.landing_hero_line`.

## Strategi (tre lager)

1. **Filosofi** – Schrödinger / paradox (`maak_moment_of_depth.lines_*`).
2. **Problem** – många val, lite verklighet (inbakat i raderna + `body_1`).
3. **Handling** – engagemang, konversation, matchning med omsorg (`maak_matching_story`, chat- och isbrytartexter).
