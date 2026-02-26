#!/usr/bin/env node
/**
 * Extracts individual mascot poses from source sheets in MÄÄK-MASCOT folder.
 * Crops out text labels, flattens transparent/checkered background to #F8FAF9,
 * resizes to 512x512, and writes to public/mascot/.
 * Run: node scripts/fix-mascot-images.mjs
 * Optional: MASCOT_SOURCE=/path/to/MÄÄK-MASCOT node scripts/fix-mascot-images.mjs
 */
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MASCOT_DIR = join(ROOT, "public", "mascot");
const SOURCE_DIR =
  process.env.MASCOT_SOURCE ||
  join(process.env.HOME || "", "Downloads", "MÄÄK-MASCOT");

const BG_HEX = "#F8FAF9";
const BG_RGB = { r: 248, g: 250, b: 249 };
const OUT_SIZE = 512;

/** Parse hex color to r,g,b */
function hexToRgb(hex) {
  const m = hex.slice(1).match(/.{2}/g);
  return m
    ? { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) }
    : BG_RGB;
}

/**
 * Crop region: { left, top, width, height } (all in px for 1536x1024 source).
 * Source filenames are the ChatGPT Image ... .png names.
 */
const CROPS = [
  // From 06_01_37 PM.png - AI Assistant (4 poses in a row, 384px each)
  {
    source: "ChatGPT Image Feb 15, 2026, 06_01_37 PM.png",
    crops: [
      { left: 0, top: 120, width: 384, height: 804, out: "mascot_ai_listening.png" },
      { left: 384, top: 120, width: 384, height: 804, out: "mascot_ai_thinking.png" },
      { left: 768, top: 120, width: 384, height: 804, out: "mascot_ai_open_hand.png" },
      { left: 1152, top: 120, width: 384, height: 804, out: "mascot_ai_tiny_sparkle.png" },
    ],
  },
  // From 06_03_11 PM.png - App states (4 poses)
  {
    source: "ChatGPT Image Feb 15, 2026, 06_03_11 PM.png",
    crops: [
      { left: 0, top: 80, width: 384, height: 850, out: "mascot_planting_seed.png" },
      { left: 384, top: 80, width: 384, height: 850, out: "mascot_waiting_tea.png" },
    ],
  },
  // From 06_03_04 PM.png - App states (3 poses, 512px each)
  {
    source: "ChatGPT Image Feb 15, 2026, 06_03_04 PM.png",
    crops: [
      { left: 512, top: 80, width: 512, height: 850, out: "mascot_practicing_mirror.png" },
      { left: 1024, top: 80, width: 512, height: 850, out: "mascot_lighting_lantern.png" },
    ],
  },
  // From 06_07_09 PM.png - Base poses (4 poses)
  {
    source: "ChatGPT Image Feb 15, 2026, 06_07_09 PM.png",
    crops: [
      { left: 0, top: 80, width: 384, height: 850, out: "mascot_calm_idle.png" },
    ],
  },
];

async function processCrop(sourcePath, { left, top, width, height, out }) {
  const img = sharp(sourcePath);
  const cropped = await img
    .extract({ left, top, width, height })
    .toBuffer();

  // Flatten: composite onto solid background so transparent/checkered areas become BG
  const bg = hexToRgb(BG_HEX);
  const withBg = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: bg,
    },
  })
    .composite([{ input: cropped, blend: "over" }])
    .png()
    .toBuffer();

  // Resize to OUT_SIZE x OUT_SIZE (fit contain to keep aspect, then extend to square with BG)
  const resized = await sharp(withBg)
    .resize({
      width: OUT_SIZE,
      height: OUT_SIZE,
      fit: "contain",
      background: bg,
    })
    .png()
    .toFile(join(MASCOT_DIR, out));

  console.log("  ->", out);
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error("Source directory not found:", SOURCE_DIR);
    console.error("Set MASCOT_SOURCE or ensure ~/Downloads/MÄÄK-MASCOT exists.");
    process.exit(1);
  }

  if (!existsSync(MASCOT_DIR)) {
    mkdirSync(MASCOT_DIR, { recursive: true });
  }

  console.log("Source:", SOURCE_DIR);
  console.log("Output:", MASCOT_DIR);
  console.log("Background:", BG_HEX, "| Resize:", OUT_SIZE + "x" + OUT_SIZE);

  for (const { source, crops } of CROPS) {
    const sourcePath = join(SOURCE_DIR, source);
    if (!existsSync(sourcePath)) {
      console.warn("Skip (missing):", source);
      continue;
    }
    console.log("\nProcessing:", source);
    for (const crop of crops) {
      await processCrop(sourcePath, crop);
    }
  }

  console.log("\nDone. Run: npm run mascot:sprite");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
