#!/usr/bin/env node
/**
 * Normalizes all mascot PNGs in public/mascot/ to a consistent 512×512 canvas.
 *
 * Rules:
 * - Auto-trim transparent borders first (tight crop to actual figure)
 * - Transparent background canvas (no solid fill)
 * - Centered figure with 8% padding per side (figure fills 84% of 512)
 * - Output: 512×512 PNG, RGBA, lanczos3 upscale
 * - Preserves aspect ratio; tall figures get side space, wide figures get top/bottom space
 *
 * Run: node scripts/normalize-mascot.mjs
 */
import sharp from "sharp";
import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MASCOT_DIR = join(ROOT, "public", "mascot");
const CANVAS = 512;
const PADDING_RATIO = 0.08; // 8% per side → figure fills ~84%
const FIGURE_MAX = Math.round(CANVAS * (1 - PADDING_RATIO * 2)); // 430px

async function normalizeOne(filename) {
  const inPath = join(MASCOT_DIR, filename);
  const orig = await sharp(inPath).metadata();

  // Step 1: trim transparent borders to get tight figure bounds
  const trimmedPng = await sharp(inPath)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
    .ensureAlpha()
    .png()
    .toBuffer();

  const trimMeta = await sharp(trimmedPng).metadata();
  const trimW = trimMeta.width;
  const trimH = trimMeta.height;

  // Step 2: scale trimmed figure to fit within FIGURE_MAX × FIGURE_MAX
  const scale = Math.min(FIGURE_MAX / trimW, FIGURE_MAX / trimH);
  const figW = Math.round(trimW * scale);
  const figH = Math.round(trimH * scale);

  const resizedBuf = await sharp(trimmedPng)
    .resize(figW, figH, { fit: "fill", kernel: "lanczos3" })
    .png()
    .toBuffer();

  // Step 3: place centered on 512×512 transparent canvas
  const offsetX = Math.round((CANVAS - figW) / 2);
  const offsetY = Math.round((CANVAS - figH) / 2);

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedBuf, left: offsetX, top: offsetY }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(inPath);

  console.log(
    `  ✓ ${filename.padEnd(36)} ${orig.width}×${orig.height} → trim ${trimW}×${trimH} → ${figW}×${figH} @ (${offsetX},${offsetY})`,
  );
}

async function main() {
  if (!existsSync(MASCOT_DIR)) {
    console.error("public/mascot/ not found");
    process.exit(1);
  }

  const files = readdirSync(MASCOT_DIR).filter(
    (f) => f.endsWith(".png") && !f.startsWith("mascot_sheet"),
  );

  console.log(`Normalizing ${files.length} mascot PNGs\n`);
  console.log(`Canvas: ${CANVAS}×${CANVAS}  Padding: ${PADDING_RATIO * 100}%  Figure max: ${FIGURE_MAX}px\n`);

  for (const f of files) {
    await normalizeOne(f);
  }

  console.log(`\nDone. ${files.length} files normalized.`);
  console.log("Next: npm run mascot:sprite  → rebuild mascot_sheet_ai.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
