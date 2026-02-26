# Mascot Workspace – MÄÄK

Single source of truth for mascot asset export, token mapping, and Figma alignment.

## Figma design

- **File:** [MÄÄK-MASCOT](https://www.figma.com/design/KF4TVJwqqTHbddcDklYrAc/M%C3%84%C3%84K-MASCOT)
- **Dev mode:** [MÄÄK-MASCOT (dev)](https://www.figma.com/design/KF4TVJwqqTHbddcDklYrAc/M%C3%84%C3%84K-MASCOT?node-id=0-1&m=dev)
- **Embed (share):**  
  `https://embed.figma.com/design/KF4TVJwqqTHbddcDklYrAc/M%C3%84%C3%84K-MASCOT?node-id=0-1&embed-host=share`

**Iframe (för dokumentation / Notion etc.):**

```html
<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://embed.figma.com/design/KF4TVJwqqTHbddcDklYrAc/M%C3%84%C3%84K-MASCOT?node-id=0-1&embed-host=share" allowfullscreen></iframe>
```

All mascot visuals in the app come from this Figma file. Export assets according to `FIGMA_EXPORT_SPEC.md` and place them in `public/mascot/` using the names in `TOKEN_MAP.md`.

**Visuell översikt (asset sheet):** [mascot-asset-overview.png](mascot-asset-overview.png) – alla poses och tillstånd (onboarding, curious, waving, thinking, sleeping, listening, explain, social, empty states, loading, first match, no chats, icon/medium/AI) som referens vid export från Figma.

## Workspace contents

| File | Purpose |
|------|---------|
| [mascot-asset-overview.png](mascot-asset-overview.png) | Visuell översikt – alla mascot-poses (referens vid export) |
| [FIGMA_EXPORT_SPEC.md](FIGMA_EXPORT_SPEC.md) | Export rules: transparent BG, aspect ratio, padding, pixel quality, filenames |
| [TOKEN_MAP.md](TOKEN_MAP.md) | Figma frame / name → app token → screen state / usage |
| [EXPRESSIONS_AND_SCENARIOS.md](EXPRESSIONS_AND_SCENARIOS.md) | Expression set (Calm, Encouraging, Thinking, etc.) and scenario set (planting seed, tea, mirror, lantern) |
| [ASSET_CHECKLIST.md](ASSET_CHECKLIST.md) | Checklist of files that must exist in `public/mascot/` after export |

## Usage rules (brand)

The mascot appears only when it:

- Teaches
- Reassures
- Explains
- Waits
- Celebrates gently

Never as decoration. Never hyperactive. All behavior is driven by emotional state (no screen manually sets mascot goal).

## App integration

- **Logic:** `src/lib/mascot/index.ts` – tokens, state map, layout, animation
- **Hook:** `src/hooks/useMascot.ts` – emotion → goal → presence
- **Component:** `src/components/system/Mascot.tsx` – renders PNG or composite sprite
- **Assets:** `public/mascot/*.png` and optional `mascot_sheet_ai.png`
