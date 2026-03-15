#!/usr/bin/env node
/**
 * Makes assets/icon.png square (1024x1024) for Expo app.json schema.
 * Requires: npm install sharp (dev). Run: node scripts/make-icon-square.mjs
 * If the icon is already 1024x1024, exits without change.
 */
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ICON_PATH = join(ROOT, "assets", "icon.png");

async function main() {
  if (!existsSync(ICON_PATH)) {
    console.error("assets/icon.png not found.");
    process.exit(1);
  }
  const meta = await sharp(ICON_PATH).metadata();
  const { width = 0, height = 0 } = meta;
  if (width === 1024 && height === 1024) {
    console.log("Icon is already 1024x1024.");
    return;
  }
  const size = Math.min(width, height, 1024);
  const pipeline = sharp(ICON_PATH);
  const cropped = await pipeline
    .extract({
      left: Math.max(0, Math.floor((width - size) / 2)),
      top: Math.max(0, Math.floor((height - size) / 2)),
      width: size,
      height: size,
    })
    .toBuffer();
  await sharp(cropped)
    .resize(1024, 1024)
    .png()
    .toFile(ICON_PATH);
  console.log("Icon updated to 1024x1024.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
