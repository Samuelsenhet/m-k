# Määk Mascot System

Production-ready mascot implementation for the MÄÄK dating app.

---

## 0. Figma and mascot workspace

**Visual assets** come from a single source:

- **Figma:** [MÄÄK-MASCOT](https://www.figma.com/design/KF4TVJwqqTHbddcDklYrAc/M%C3%84%C3%84K-MASCOT)
- **Workspace:** [docs/mascot-workspace/](mascot-workspace/README.md) – export spec, token map, expressions/scenarios, asset checklist
- **Backup (källbilder):** [docs/mascot-workspace-backup/](mascot-workspace-backup/README.md) – när nya assets ligger här, kör `npm run mascot:sync-from-backup` för att kopiera till `public/mascot/`

Export from Figma according to the workspace spec; place PNGs in `public/mascot/` with the token names in [FIGMA_EXPORT_SPEC.md](mascot-workspace/FIGMA_EXPORT_SPEC.md). You can also put source PNGs in `docs/mascot-workspace/` and run `npm run mascot:sync` to copy them into `public/mascot/` with the correct token names (the sync script maps workspace filenames, including variants and typos like `encauraging.png`, to the app tokens so images display correctly). Do not use other image sources for mascot visuals.

---

## 1. Design System and Usage Rules

### Source of Truth

All mascot **logic** lives in:

```
src/lib/mascot/index.ts
```

Contains:

- **MASCOT_SCREEN_STATES** — all product states where mascot appears
- **STATE_TOKEN_MAP** — state → visual token mapping
- **getMascotLayoutForState(state)** — returns size and placement
- **getMascotAnimationForState(state)** — returns animation type

### Usage Rule

Mascot is **only** used when it:

- Teaches
- Reassures
- Explains
- Waits
- Celebrates gently

**Never as decoration.**

Mascot must NOT be used in dense UI or as visual filler.

---

## 2. Single Entry Point in UI

All screens use the `useMascot` hook:

```tsx
const mascot = useMascot(MASCOT_SCREEN_STATES.XXX);
<Mascot {...mascot} />
```

UI never calls token/layout/animation logic directly. This ensures:

- Consistent behavior across the app
- Single place to change mascot rules
- Type-safe props

---

## 3. Määk Journey Copy

Four key emotional moments where Määk speaks:

| Moment | Screen | Copy (sv) |
|--------|--------|-----------|
| First meeting | Landing | Jag heter Määk. Jag finns här med dig, medan vi hittar någon som verkligen passar. |
| Guide | Onboarding | Jag guidar dig lugnt genom det här. |
| Waiting | Waiting phase | Jag är här medan vi väntar. Bra saker får ta tid. |
| First match | Celebration | Jag sa ju att det var värt att vänta. 💛 |

Landing intro is shown once using localStorage:

```
maek_intro_seen
```

Copy is managed via i18n (`sv.json` / `en.json`) under `maak.*` keys.

---

## 4. States and Tokens

| State | Token | Purpose |
|-------|-------|---------|
| landing_hero | mascot_ai_open_hand | reassure |
| landing_problem | mascot_ai_thinking | explain |
| maak_intro | mascot_calm_idle | reassure |
| onboarding_welcome | mascot_calm_idle | guide |
| waiting_phase | mascot_waiting_tea | wait |
| empty_matches | mascot_planting_seed | reassure |
| no_chats | mascot_practicing_mirror | reassure |
| first_match | mascot_lighting_lantern | celebrate |
| profile_empty | mascot_practicing_mirror | reassure |
| samlingar_empty | mascot_planting_seed | reassure |
| home_idle | mascot_calm_idle | presence |

---

## 5. Mascot Behavior Spec

Complete specification for each state:

| State | Token | Purpose | Emotion | Animation | Intensity |
|-------|-------|---------|---------|-----------|-----------|
| landing_hero | mascot_ai_open_hand | reassure | calm | idle-breathe | very-subtle |
| landing_problem | mascot_ai_thinking | explain | thoughtful | idle-breathe | very-subtle |
| maak_intro | mascot_calm_idle | reassure | calm | idle-breathe | very-subtle |
| onboarding_welcome | mascot_calm_idle | guide | calm | idle-breathe | very-subtle |
| waiting_phase | mascot_waiting_tea | wait | hopeful | gentle-float | gentle |
| empty_matches | mascot_planting_seed | reassure | hopeful | gentle-float | gentle |
| no_chats | mascot_practicing_mirror | reassure | hopeful | gentle-float | gentle |
| first_match | mascot_lighting_lantern | celebrate | joyful | celebrate-bounce | playful |
| profile_empty | mascot_practicing_mirror | reassure | calm | idle-breathe | very-subtle |
| samlingar_empty | mascot_planting_seed | reassure | calm | idle-breathe | very-subtle |
| home_idle | mascot_calm_idle | presence | neutral | none | — |

### Animation Definitions

| Animation | Intensity | Description |
|-----------|-----------|-------------|
| idle-breathe | very-subtle | 2% scale pulse, 4s duration — barely noticeable, calm presence |
| gentle-float | gentle | 6px vertical float, 3s duration — noticeable but soothing |
| celebrate-bounce | playful | 8% scale + slight rotate, plays twice on mount |
| none | — | No animation (used for icon size in navigation) |

---

## 6. Core Components

### Mascot Component

```
src/components/system/Mascot.tsx
```

Supports:

- Single PNG assets
- Composite sprite sheets (for AI tokens)
- State-based animations via framer-motion
- Solid background to handle transparency

### useMascot Hook

```
src/hooks/useMascot.ts
```

Returns:

```ts
{
  token: MascotToken;
  size: "icon" | "small" | "medium" | "hero";
  placement: "center" | "inline";
  animation: "idle-breathe" | "gentle-float" | "celebrate-bounce" | "none";
}
```

---

## 7. Assets and Performance

### Single Assets

```
public/mascot/*.png
```

Individual mascot poses as transparent PNGs.

### AI Sprite Sheet

```
public/mascot/mascot_sheet_ai.png
```

Four AI tokens combined into one sprite for:

- Reduced HTTP requests
- No layout shift
- Enables future animation states

Mapped via `MASCOT_COMPOSITE_MAP` in mascot lib.

### Performance Mode

```ts
getMascotTokenLocal(state)
```

Fast local lookup without AI. AI is only used in chat context.

---

## 8. Where Mascot Appears

### Hero Size (220px)

- Landing page
- Onboarding welcome
- Empty matches
- First match celebration

### Medium Size (140px)

- Waiting phase
- Empty collections
- Profile empty states
- AI assistant

### Icon Size (32px)

- Logo / navigation

Layout is always determined by `getMascotLayoutForState` — never hardcoded in UI.

---

## 9. File Structure

| Purpose | Location |
|---------|----------|
| Figma export spec, token map, checklist | `docs/mascot-workspace/` |
| States, tokens, layout, animation | `src/lib/mascot/index.ts` |
| Hook | `src/hooks/useMascot.ts` |
| Component | `src/components/system/Mascot.tsx` |
| Copy constants | `src/constants/mascot.ts` |
| i18n copy | `src/i18n/locales/sv.json`, `en.json` |
| Landing intro | `src/components/landing/LandingHero.tsx` |
| Assets | `public/mascot/` |

---

## 10. Design Principles

### Why This Architecture

1. **Single source of truth** — All mascot decisions in one file
2. **Hook isolation** — UI doesn't know about token logic
3. **Token-based** — Assets are named by function, not emotion
4. **i18n-ready** — Copy separated from components
5. **Performance-optimized** — Sprites for frequently used tokens
6. **Animation by state** — Emotional context drives movement

### Asset Naming Convention

Use functional names:

- `mascot_waiting_tea` (function)
- `mascot_planting_seed` (action)

Avoid emotional names:

- ~~`mascot_happy`~~
- ~~`mascot_cute_idle`~~

Function > emotion.

---

## 11. Adding a New State

1. Add state to `MASCOT_SCREEN_STATES` in `src/lib/mascot/index.ts`
2. Map state to token in `STATE_TOKEN_MAP`
3. Add layout rule in `getMascotLayoutForState` if needed
4. Add animation in `MASCOT_ANIMATION_MAP`
5. Use in component: `useMascot(MASCOT_SCREEN_STATES.NEW_STATE)`

---

## 12. Mascot scripts and sharp (development)

Scripts that process mascot assets (`mascot:sprite`, `mascot:clean`, `mascot:fix`, `normalize-mascot.mjs`, `generate-icons.js`, `remove-background.js`) require the **sharp** devDependency. Sharp is not used at runtime or during the app build; it is only used when you run these scripts locally. **EAS Build** installs only production dependencies (`npm ci --omit=dev`), so sharp is never installed on the build worker — build-from-source and the notes below apply only to local development.

### If sharp builds from source

Sharp normally uses prebuilt binaries. If no prebuilt is available for your platform, it may try to build from source. For that you need:

- **C++17 compiler**
- **node-addon-api** version 7+
- **node-gyp** version 9+ and its dependencies

If `node-addon-api` or `node-gyp` cannot be found:

```sh
npm install --save-dev node-addon-api node-gyp
```

### Environment variables

- **`SHARP_IGNORE_GLOBAL_LIBVIPS=1`** — Never use a globally installed libvips; use only sharp’s prebuilt binaries.
- **`SHARP_FORCE_GLOBAL_LIBVIPS=1`** — Always try to use system libvips (even if missing or outdated).

### Cross-compiling

Use the `--platform`, `--arch`, and `--libc` npm flags (or `npm_config_platform`, `npm_config_arch`, `npm_config_libc` environment variables) to configure the target environment.

---

## Summary

This mascot system is:

- An emotional UX system, not just an illustration
- A scalable design-token architecture
- Performance-optimized with sprites
- i18n-ready for multiple languages
- Developer-friendly with single entry point

The mascot (Määk) is positioned as an emotional companion — the app's soul expressed as a relationship, not a feature.
