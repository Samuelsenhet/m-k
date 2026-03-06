# Figma export spec – MÄÄK mascot

Use this when exporting mascot frames from [Figma MÄÄK-MASCOT](https://www.figma.com/design/KF4TVJwqqTHbddcDklYrAc/).

## Rules

1. **No background** – Export as PNG with transparent background. No checkered or solid fill behind the figure.
2. **Same aspect ratio** – Use one consistent aspect ratio for all mascot assets (e.g. 1:1). Match the ratio used in the Figma canvas.
3. **Same canvas padding** – Each frame should have the same padding around the figure so the mascot is centered and aligned across states.
4. **Centered figure** – The mascot character is centered in the export frame.
5. **Pixel quality** – Export at 2x or 3x for hero size so the 220px display size stays sharp:
   - Hero (220px) → export at 440px or 660px
   - Medium (140px) → 280px or 420px is sufficient if exporting per size; otherwise use hero size and let the app scale.

## Filename convention

Use the app token names so no code changes are needed:

- `mascot_calm_idle.png`
- `mascot_ai_listening.png`
- `mascot_ai_thinking.png`
- `mascot_ai_open_hand.png`
- `mascot_ai_tiny_sparkle.png`
- `mascot_waiting_tea.png`
- `mascot_planting_seed.png`
- `mascot_practicing_mirror.png`
- `mascot_lighting_lantern.png`

See [TOKEN_MAP.md](TOKEN_MAP.md) for Figma frame → filename mapping.

## Export settings in Figma

- Format: **PNG**
- Include background: **Off** (transparent)
- Scale: **2x** or **3x** (for the chosen base size)
- Name the frame or layer so it matches the token name (e.g. "Calm Idle" → `mascot_calm_idle.png` when saving).

## After export

1. Save files into `public/mascot/` with the exact names above.
2. If you changed any of the four AI tokens, run: `npm run mascot:sprite` to rebuild `mascot_sheet_ai.png`.
3. Verify with [ASSET_CHECKLIST.md](ASSET_CHECKLIST.md).
