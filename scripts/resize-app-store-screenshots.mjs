/**
 * Resize screenshots to iPhone 6.5" App Store size: 1284 × 2778 (portrait).
 * Uses cover + centre crop. Edit `selected` to change sources.
 *
 * Usage:
 *   node scripts/resize-app-store-screenshots.mjs [inputDir] [outputDir]
 *   ASSET_DIR=/path node scripts/resize-app-store-screenshots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const W = 1284;
const H = 2778;

const defaultAssetDir =
  process.env.ASSET_DIR ||
  path.join(
    process.env.HOME,
    ".cursor/projects/Users-samuelsenhet-Downloads-GitHub-APP-m-k/assets",
  );

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const defaultOut = path.join(repoRoot, "docs/app-store-screenshots/iphone-65");

const inputDir = process.argv[2] || defaultAssetDir;
const outputDir = process.argv[3] || defaultOut;

const selected = [
  { file: "landing-profile-merbel-a559bfb0-f0ba-41f1-814a-173cfd72794a.png", slug: "01-landing-matchkort" },
  { file: "Screenshot_2026-03-23_at_22.09.24-c560fa43-5143-461b-830a-ff00c24239de.png", slug: "02-feature" },
  { file: "Screenshot_2026-03-28_at_20.15.32-3e833991-6d7e-449b-bc60-1eb3bf61d932.png", slug: "03-feature" },
  { file: "Ska_rmavbild_2026-03-27_kl._20.48.03-f9b9b53e-6a5d-423a-9f25-9bed95ed0694.png", slug: "04-personality" },
  { file: "Ska_rmavbild_2026-03-27_kl._18.15.22-55b4e121-4fad-4f9f-a1dc-cfd17ddbe15c.png", slug: "05-personality-detail" },
];

async function main() {
  if (!fs.existsSync(inputDir)) {
    console.error("Input directory missing:", inputDir);
    process.exit(1);
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const manifest = [];

  for (const { file, slug } of selected) {
    const src = path.join(inputDir, file);
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
    console.error("No images processed. Copy PNGs into:", inputDir);
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
