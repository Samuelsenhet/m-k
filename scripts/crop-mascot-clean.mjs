#!/usr/bin/env node
/**
 * Crops mascot PNGs to remove bottom label text ("Calm", "Listening", etc.),
 * leaving only the mascot illustration. Overwrites files in public/mascot/.
 * Run: node scripts/crop-mascot-clean.mjs
 */
import sharp from "sharp";
import { existsSync, renameSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MASCOT_DIR = join(ROOT, "public", "mascot");

const TOKENS = [
  "mascot_ai_listening",
  "mascot_ai_open_hand",
  "mascot_ai_thinking",
  "mascot_ai_tiny_sparkle",
  "mascot_calm_idle",
  "mascot_lighting_lantern",
  "mascot_planting_seed",
  "mascot_practicing_mirror",
  "mascot_waiting_tea",
];

/** Keep top share of image (1 = 100%). Bottom part is removed (usually the text label). */
const CROP_TOP_RATIO = 0.82;

async function main() {
  for (const token of TOKENS) {
    const path = join(MASCOT_DIR, `${token}.png`);
    if (!existsSync(path)) {
      console.warn("Skip (missing):", token);
      continue;
    }
    const img = sharp(path);
    const meta = await img.metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    if (!w || !h) {
      console.warn("Skip (no size):", token);
      continue;
    }
    const cropHeight = Math.round(h * CROP_TOP_RATIO);
    const tmpPath = join(MASCOT_DIR, `${token}.tmp.png`);
    await img
      .extract({ left: 0, top: 0, width: w, height: cropHeight })
      .toFile(tmpPath);
    renameSync(tmpPath, path);
    console.log(token, "-> cropped to", w, "x", cropHeight);
  }
  console.log("Done. Run npm run mascot:sprite to rebuild AI sheet.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
