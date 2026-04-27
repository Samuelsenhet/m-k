/**
 * Resize screenshots to iPhone 6.5" App Store size: 1284 × 2778 (portrait).
 * Uses cover + centre crop. Edit `selected` to change sources.
 *
 * Usage:
 *   node scripts/resize-app-store-screenshots.mjs <inputDir> [outputDir]
 *   ASSET_DIR=/path node scripts/resize-app-store-screenshots.mjs [outputDir]
 *
 * You must set ASSET_DIR or pass inputDir as the first CLI argument (no default path).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const W = 1284;
const H = 2778;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const defaultOut = path.join(repoRoot, "docs/app-store-screenshots/iphone-65");

const args = process.argv.slice(2);
const envIn = process.env.ASSET_DIR?.trim();

let inputDir;
let outputDir = defaultOut;

if (envIn && args.length === 0) {
  inputDir = path.resolve(envIn);
} else if (envIn && args.length >= 1) {
  inputDir = path.resolve(envIn);
  outputDir = path.resolve(args[0]);
} else if (args[0]) {
  inputDir = path.resolve(args[0]);
  if (args[1]) outputDir = path.resolve(args[1]);
} else {
  inputDir = null;
}

const selected = [
  { file: "landing-profile-merbel-a559bfb0-f0ba-41f1-814a-173cfd72794a.png", slug: "01-landing-matchkort" },
  { file: "Screenshot_2026-03-23_at_22.09.24-c560fa43-5143-461b-830a-ff00c24239de.png", slug: "02-feature" },
  { file: "Screenshot_2026-03-28_at_20.15.32-3e833991-6d7e-449b-bc60-1eb3bf61d932.png", slug: "03-feature" },
  { file: "Ska_rmavbild_2026-03-27_kl._20.48.03-f9b9b53e-6a5d-423a-9f25-9bed95ed0694.png", slug: "04-personality" },
  { file: "Ska_rmavbild_2026-03-27_kl._18.15.22-55b4e121-4fad-4f9f-a1dc-cfd17ddbe15c.png", slug: "05-personality-detail" },
];

async function main() {
  if (!inputDir) {
    console.error(
      "Missing input directory. Set ASSET_DIR to your PNG folder or pass it as the first argument:\n" +
        "  ASSET_DIR=/path/to/pngs node scripts/resize-app-store-screenshots.mjs\n" +
        "  node scripts/resize-app-store-screenshots.mjs /path/to/pngs [outputDir]",
    );
    process.exit(1);
  }

  const assetDir = inputDir;

  if (!fs.existsSync(assetDir)) {
    console.error("Input directory does not exist:", assetDir);
    console.error("Set ASSET_DIR or pass a valid directory as the first CLI argument.");
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const manifest = [];

  for (const { file, slug } of selected) {
    const src = path.join(assetDir, file);
    if (!fs.existsSync(src)) {
      console.warn("Skip (not found):", file);
      continue;
    }
    const dest = path.join(outputDir, `${slug}-${W}x${H}.png`);
    await sharp(src)
      .rotate()
      .resize(W, H, { fit: "cover", position: "centre" })
      .png({ compressionLevel: 9 })
      .toFile(dest);

    const meta = await sharp(dest).metadata();
    manifest.push({
      source: file,
      output: path.relative(repoRoot, dest),
      width: meta.width,
      height: meta.height,
    });
    console.log("Wrote", dest);
  }

  if (manifest.length === 0) {
    console.error("No images processed. Copy PNGs into:", assetDir);
    console.error("Or pass input dir: node scripts/resize-app-store-screenshots.mjs /path/to/pngs");
    process.exit(1);
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify({ target: `${W}x${H}`, items: manifest }, null, 2));
  console.log("\nDone. Manifest:", manifestPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
