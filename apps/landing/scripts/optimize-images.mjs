// Läser source-PNG:er från images-src/ och skriver optimerade .webp-varianter till public/.
// Körs som ett prebuild-steg — säkert att köra om, överskriver befintliga .webp.
//
// Användning:
//   node scripts/optimize-images.mjs
//
// Sharp är installerat vid repo-root (node_modules/sharp).
// Källbilder hålls utanför public/ så att Next inte kopierar PNG:erna till out/ vid static export.

import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDING_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(LANDING_ROOT, "images-src");
const PUBLIC_DIR = path.join(LANDING_ROOT, "public");

// Konfig – vilka filer att optimera och med vilken profil.
// maxWidth begränsar bredden (behåller aspect ratio) så att sajten inte servar 2688px-höga PNG:er
// när de visas som små bilder i layouten.
const TARGETS = [
  {
    dir: "screenshots",
    maxWidth: 1024,
    webpQuality: 80,
  },
  {
    // Displayas som 96×96 på mobile, 112×112 på desktop. 2× DPR → 224 pixlar.
    // 512 var overkill och drog in ~20 KB extra för ingen synlig skillnad.
    file: "app-icon-light.png",
    maxWidth: 224,
    webpQuality: 88,
  },
  {
    // Används på /vanta/ (140×140) och i <WaitlistBanner> (100×100).
    // 2× DPR → 280 pixlar. 320 ger lite headroom utan att dra in 1 MB PNG.
    file: "mascot-vanta.png",
    maxWidth: 320,
    webpQuality: 85,
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizeFile(inputPath, outputPath, maxWidth, webpQuality) {
  await mkdir(path.dirname(outputPath), { recursive: true });

  const inputStats = await stat(inputPath);
  const inputSize = inputStats.size;

  await sharp(inputPath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: webpQuality, effort: 6 })
    .toFile(outputPath);

  const outputStats = await stat(outputPath);
  const outputSize = outputStats.size;
  const reduction = (((inputSize - outputSize) / inputSize) * 100).toFixed(1);

  const rel = path.relative(LANDING_ROOT, outputPath);
  console.log(
    `  ${rel}  ${formatBytes(inputSize)} → ${formatBytes(outputSize)}  (-${reduction}%)`,
  );
}

function toWebpName(filename) {
  const base = path.basename(filename, path.extname(filename));
  return `${base}.webp`;
}

async function processDir(dirName, maxWidth, webpQuality) {
  const srcSub = path.join(SRC_DIR, dirName);
  const dstSub = path.join(PUBLIC_DIR, dirName);
  const entries = await readdir(srcSub);
  const pngs = entries.filter((e) => e.toLowerCase().endsWith(".png"));
  for (const entry of pngs) {
    await optimizeFile(
      path.join(srcSub, entry),
      path.join(dstSub, toWebpName(entry)),
      maxWidth,
      webpQuality,
    );
  }
}

async function main() {
  console.log("Optimizing landing images...\n");
  for (const target of TARGETS) {
    if (target.dir) {
      console.log(`📁 images-src/${target.dir}/ → public/${target.dir}/`);
      await processDir(target.dir, target.maxWidth, target.webpQuality);
    } else if (target.file) {
      console.log(`📄 images-src/${target.file} → public/${toWebpName(target.file)}`);
      await optimizeFile(
        path.join(SRC_DIR, target.file),
        path.join(PUBLIC_DIR, toWebpName(target.file)),
        target.maxWidth,
        target.webpQuality,
      );
    }
  }
  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("Image optimization failed:", err);
  process.exit(1);
});
