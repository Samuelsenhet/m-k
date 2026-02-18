#!/usr/bin/env node
/**
 * Builds a horizontal sprite sheet from the 4 AI mascot PNGs.
 * Output: public/mascot/mascot_sheet_ai.png (4 poses in a row)
 * Requires: npm install sharp (dev)
 * Run: node scripts/build-mascot-sprite.mjs
 */
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MASCOT_DIR = join(ROOT, "public", "mascot");

const AI_TOKENS = [
  "mascot_ai_listening",
  "mascot_ai_thinking",
  "mascot_ai_open_hand",
  "mascot_ai_tiny_sparkle",
];

const CELL_SIZE = 256; // equal width & height per cell so sprite is 4 columns of same size

async function main() {
  const images = [];
  for (const token of AI_TOKENS) {
    const path = join(MASCOT_DIR, `${token}.png`);
    if (!existsSync(path)) {
      console.warn("Missing:", path);
      continue;
    }
    const buf = readFileSync(path);
    const resized = await sharp(buf)
      .resize({
        width: CELL_SIZE,
        height: CELL_SIZE,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();
    images.push(resized);
  }

  if (images.length === 0) {
    console.error("No mascot images found in", MASCOT_DIR);
    process.exit(1);
  }

  const columns = images.length;
  const totalWidth = columns * CELL_SIZE;

  const composites = images.map((buf, i) => ({
    input: buf,
    left: i * CELL_SIZE,
    top: 0,
  }));

  await sharp({
    create: {
      width: totalWidth,
      height: CELL_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(join(MASCOT_DIR, "mascot_sheet_ai.png"));

  console.log("Built public/mascot/mascot_sheet_ai.png (" + images.length + " poses, " + totalWidth + "x" + CELL_SIZE + ")");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
