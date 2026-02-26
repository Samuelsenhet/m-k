# Asset checklist – public/mascot/

After exporting from Figma, ensure these files exist in `public/mascot/`.

## Required PNGs (one per token)

- [ ] mascot_calm_idle.png
- [ ] mascot_ai_listening.png
- [ ] mascot_ai_thinking.png
- [ ] mascot_ai_open_hand.png
- [ ] mascot_ai_tiny_sparkle.png
- [ ] mascot_waiting_tea.png
- [ ] mascot_planting_seed.png
- [ ] mascot_practicing_mirror.png
- [ ] mascot_lighting_lantern.png

## Optional (built from above)

- [ ] mascot_sheet_ai.png – Built by `npm run mascot:sprite` from the four `mascot_ai_*.png` files. If you updated any AI token, run the script after replacing those PNGs.

## Verification

1. All 9 PNGs listed above are present.
2. Files have transparent background and consistent aspect ratio (see FIGMA_EXPORT_SPEC.md).
3. No screen should reference a token that has no asset; `getMascotAsset()` in `src/lib/mascot/index.ts` resolves to `/mascot/{token}.png` for single assets and to the composite sheet for AI tokens when `MASCOT_COMPOSITE_MAP` is used.

## If a file is missing

The app falls back to `MascotSvgFallback` when the image fails to load. For production, all 9 assets should be present from Figma export.
