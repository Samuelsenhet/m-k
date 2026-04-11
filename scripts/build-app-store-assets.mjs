/**
 * Build App Store Connect assets for MÄÄK from Figma-exported sources.
 *
 * Sources (checked into repo):
 *   docs/app-store-screenshots/figma-import/App Icon Light.png
 *   docs/app-store-screenshots/figma-import/Swedish / iPhone 6.5 /iPhone 6.5 - 1.png
 *   docs/app-store-screenshots/figma-import/Swedish / iPhone 6.5 /iPhone 6.5 - 2.png
 *   docs/app-store-screenshots/figma-import/Swedish / iPhone 6.5 /iPhone 6.5 - 3.png
 *
 * Outputs:
 *   docs/app-store-screenshots/icon-1024x1024.png            (RGB, no alpha — ASC marketing icon)
 *   docs/app-store-screenshots/iphone-65/*.png + manifest    (1242×2688, iPhone 6.5" Display)
 *   docs/app-store-screenshots/iphone-69/*.png + manifest    (1320×2868, iPhone 6.9" Display)
 *
 * Run: npm run assets:app-store
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const figmaImport = path.join(repoRoot, "docs", "app-store-screenshots", "figma-import");
const outRoot = path.join(repoRoot, "docs", "app-store-screenshots");

// Matches splash background in app.config.cjs — keeps flattened assets on-brand.
const BRAND_BG = "#F2F0EF";

const ICON_SRC = path.join(figmaImport, "App Icon Light.png");

// Figma export writes literal leading/trailing spaces into every path component.
// Verified via fs.readdirSync: "Swedish ", " iPhone 6.5 ", " iPhone 6.5 - N.png".
const SCREENSHOT_SRC_DIR = path.join(figmaImport, "Swedish ", " iPhone 6.5 ");

const SCREENSHOTS = [
  {
    src: path.join(SCREENSHOT_SRC_DIR, " iPhone 6.5 - 1.png"),
    slug: "01-intro",
    figmaNode: "3:499",
  },
  {
    src: path.join(SCREENSHOT_SRC_DIR, " iPhone 6.5 - 2.png"),
    slug: "02-matching",
    figmaNode: "3:498",
  },
  {
    src: path.join(SCREENSHOT_SRC_DIR, " iPhone 6.5 - 3.png"),
    slug: "03-personlighet",
    figmaNode: "3:497",
  },
];

const TARGETS = [
  { dir: "iphone-65", width: 1242, height: 2688, label: 'iPhone 6.5"' },
  { dir: "iphone-69", width: 1320, height: 2868, label: 'iPhone 6.9"' },
];

function md5(file) {
  const buf = fs.readFileSync(file);
  return crypto.createHash("md5").update(buf).digest("hex");
}

function rel(p) {
  return path.relative(repoRoot, p);
}

async function ensureSource(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`Source not found: ${p}`);
  }
}

async function buildIcon() {
  await ensureSource(ICON_SRC);
  const out = path.join(outRoot, "icon-1024x1024.png");
  // Resize to 1024 (no-op if already) → flatten RGBA onto brand bg → RGB PNG.
  await sharp(ICON_SRC)
    .resize(1024, 1024, { fit: "contain", background: BRAND_BG })
    .flatten({ background: BRAND_BG })
    .png({ compressionLevel: 9 })
    .toFile(out);
  const meta = await sharp(out).metadata();
  if (meta.width !== 1024 || meta.height !== 1024) {
    throw new Error(`Icon has wrong dimensions: ${meta.width}×${meta.height}`);
  }
  if (meta.hasAlpha) {
    throw new Error("Icon still has alpha channel — flatten failed");
  }
  console.log(`✓ ${rel(out)}  ${meta.width}×${meta.height}  ${meta.channels}ch  no-alpha`);
  return { output: rel(out), width: meta.width, height: meta.height, md5: md5(out) };
}

async function buildScreenshotSet(target) {
  const outDir = path.join(outRoot, target.dir);
  fs.mkdirSync(outDir, { recursive: true });

  // Clean any stale Figma exports from previous runs so the dir matches the manifest exactly.
  for (const existing of fs.readdirSync(outDir)) {
    if (existing === "manifest.json") continue;
    if (existing.endsWith(".png")) {
      fs.unlinkSync(path.join(outDir, existing));
    }
  }

  const items = [];
  for (const shot of SCREENSHOTS) {
    await ensureSource(shot.src);
    const outName = `${shot.slug}-${target.width}x${target.height}.png`;
    const outPath = path.join(outDir, outName);
    await sharp(shot.src)
      .resize(target.width, target.height, {
        fit: "cover",
        position: "centre",
        kernel: "lanczos3",
      })
      .flatten({ background: BRAND_BG })
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    const meta = await sharp(outPath).metadata();
    if (meta.width !== target.width || meta.height !== target.height) {
      throw new Error(
        `${outName} has wrong dimensions: ${meta.width}×${meta.height}, expected ${target.width}×${target.height}`,
      );
    }
    if (meta.hasAlpha) {
      throw new Error(`${outName} still has alpha — flatten failed`);
    }
    items.push({
      slug: shot.slug,
      figmaNode: shot.figmaNode,
      source: rel(shot.src),
      output: rel(outPath),
      width: meta.width,
      height: meta.height,
      md5: md5(outPath),
    });
    console.log(
      `✓ ${rel(outPath)}  ${meta.width}×${meta.height}  no-alpha  ←  ${shot.figmaNode}`,
    );
  }

  const manifestPath = path.join(outDir, "manifest.json");
  const manifest = {
    label: target.label,
    target: `${target.width}x${target.height}`,
    generatedAt: new Date().toISOString(),
    brandBackground: BRAND_BG,
    items,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`  manifest → ${rel(manifestPath)}`);
  return manifest;
}

async function main() {
  console.log("Building App Store assets…\n");
  console.log("• Icon (1024×1024 RGB)");
  const icon = await buildIcon();

  const manifests = { icon };
  for (const target of TARGETS) {
    console.log(`\n• Screenshots — ${target.label} (${target.width}×${target.height})`);
    manifests[target.dir] = await buildScreenshotSet(target);
  }

  console.log("\nDone. Upload these to App Store Connect:");
  console.log(`  - ${rel(path.join(outRoot, "icon-1024x1024.png"))}`);
  for (const t of TARGETS) {
    console.log(`  - ${rel(path.join(outRoot, t.dir))}/*.png  (${t.label})`);
  }
}

main().catch((err) => {
  console.error("\n✗ Build failed:", err.message);
  process.exit(1);
});
