# Token map – Figma → app

Map Figma frame names to app tokens and usage.

| Figma frame / name (example) | App token | Screen state(s) | Expression / scenario |
|-----------------------------|-----------|------------------|------------------------|
| Calm / Idle                 | mascot_calm_idle | home_idle, maak_intro, onboarding_welcome, empty_matches, samlingar_empty, profile_empty, matches_success | Calm, soft breathing, tiny smile |
| Listening (AI)               | mascot_ai_listening | AI assistant when listening | Leaning forward |
| Thinking (AI)                | mascot_ai_thinking | landing_problem, AI thinking | Slow glow, reading/puzzle |
| Open hand (AI)               | mascot_ai_open_hand | landing_hero, AI answering | Offering, open hand |
| Tiny sparkle (AI)           | mascot_ai_tiny_sparkle | First-match celebration (AI) | Celebrating gently |
| Waiting / Tea               | mascot_waiting_tea | waiting_phase, loading | Making tea, sitting |
| Planting seed               | mascot_planting_seed | empty_matches, samlingar_empty | Planting a seed |
| Practicing mirror           | mascot_practicing_mirror | no_chats, profile_empty | Practicing "hej" in mirror |
| Lighting lantern            | mascot_lighting_lantern | first_match | Lighting a lantern |

## State → token (app)

Defined in `src/lib/mascot/index.ts` as `STATE_TOKEN_MAP`. Do not change token names when replacing assets; only replace the PNG files in `public/mascot/`.

## Optional future tokens

If Figma adds frames for these, they can be added to the app later:

- **Sleeping / Offline** – sleeping, blanket, stars, lantern nearby
- **Encouraging** – gentle nod, offering something small (leaf, light)
- **Social** – two mascots, chat bubble, small wave
