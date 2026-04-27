# MÄÄK — App Store Connect asset checklist

All files in this folder are generated from the Figma template
[`MÄÄK - App Store Assets Template`](https://www.figma.com/design/GK8fQ8xs4PScUrFsq1u7vL/M%C3%84%C3%84K---App-Store-Assets-Template).

**Regenerate everything:**
```bash
npm run assets:app-store
```

This reads sources from `figma-import/` and writes:

- `icon-1024x1024.png` — marketing icon (RGB, no alpha, 1024×1024)
- `iphone-65/*.png` — iPhone 6.5" Display screenshots (1242×2688)
- `iphone-69/*.png` — iPhone 6.9" Display screenshots (1320×2868)

---

## Upload order in App Store Connect

### 1. App Icon

| File | Path in ASC |
|---|---|
| `icon-1024x1024.png` | **App Information → App Icon** |

ASC requires RGB with no alpha channel. The build script strips alpha and
flattens onto `#F2F0EF` (splash background from `app.config.cjs`).

### 2. iPhone 6.9" Display (iPhone 16 Pro Max, required)

Uploaded in order:

1. `iphone-69/01-intro-1320x2868.png` — *"Jag heter Mäk"* (intro + profile card)
2. `iphone-69/02-matching-1320x2868.png` — *"Din första matchning kommer snart"*
3. `iphone-69/03-personlighet-1320x2868.png` — *"Personlighet & arketyper"*

Path: **App Store → [version] → iPhone 6.9" Display**

### 3. iPhone 6.5" Display (iPhone 11 Pro Max, legacy but accepted)

Same three screenshots in the 1242×2688 size:

1. `iphone-65/01-intro-1242x2688.png`
2. `iphone-65/02-matching-1242x2688.png`
3. `iphone-65/03-personlighet-1242x2688.png`

Path: **App Store → [version] → iPhone 6.5" Display**

---

## Not included (post-launch follow-ups)

- **Dark / Tinted icon variants** — Figma has them (`App Icon Dark.png`,
  `App Icon Tinted.png`) but v1 ships Light-only per product decision.
  To enable later, add `expo-alternate-app-icons` plugin.
- **iPad screenshots** — `supportsTablet: true` in app.config, but launch
  targets iPhone-first. If ASC blocks submission, export iPad frames from
  Figma and extend `build-app-store-assets.mjs` with a new target.
- **Localized English screenshots** — Figma has empty English frames.
  v1 ships Swedish-only.

## Regeneration notes

The build script (`scripts/build-app-store-assets.mjs`) is deterministic:

- Reads the same 4 source PNGs from `figma-import/` every time
- Cleans stale files from `iphone-65/` and `iphone-69/` before writing
- Writes a `manifest.json` in each output folder with md5, dimensions, and
  Figma node IDs (`3:55`, `3:499`, `3:498`, `3:497`)

If the Figma template changes, re-export the four source PNGs into
`figma-import/` (using Figma's *File → Export* to preserve folder structure),
then run `npm run assets:app-store`.
