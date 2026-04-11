// Genererar favicon-set från images-src/app-icon-light.png.
// Outputs:
//   public/favicon-16x16.png
//   public/favicon-32x32.png
//   public/apple-touch-icon.png  (180x180)
//   public/icon-192.png          (PWA)
//   public/icon-512.png          (PWA)
//   public/favicon.ico           (16 + 32 combined)
//
// Körs via `npm run favicons` eller automatiskt som en del av prebuild
// (se package.json -> scripts.prebuild).

import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDING_ROOT = path.resolve(__dirname, "..");
const SRC = path.join(LANDING_ROOT, "images-src", "app-icon-light.png");
const PUBLIC_DIR = path.join(LANDING_ROOT, "public");

const OUTPUTS = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Bygg en ICO-fil som innehåller både 16x16- och 32x32-varianter.
 * ICO-formatet är en simpel container med en header + entries + PNG-data per storlek.
 * Moderna browsers accepterar PNG inuti .ico så vi slipper BMP-encoding.
 */
async function buildIco(buffers) {
  const ICONDIR = 6; // ICO header size
  const ICONDIRENTRY = 16; // Per-entry size
  const headerSize = ICONDIR + ICONDIRENTRY * buffers.length;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved, must be 0
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(buffers.length, 4); // Number of images

  let offset = headerSize;
  const parts = [header];

  for (let i = 0; i < buffers.length; i++) {
    const { size, buffer } = buffers[i];
    const entryOffset = ICONDIR + i * ICONDIRENTRY;
    // width/height: 0 = 256
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 0);
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2); // Color palette
    header.writeUInt8(0, entryOffset + 3); // Reserved
    header.writeUInt16LE(1, entryOffset + 4); // Color planes
    header.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    header.writeUInt32LE(buffer.length, entryOffset + 8); // Image size
    header.writeUInt32LE(offset, entryOffset + 12); // Image offset
    offset += buffer.length;
    parts.push(buffer);
  }

  return Buffer.concat(parts);
}

async function main() {
  try {
    await stat(SRC);
  } catch {
    console.error(`Source icon missing: ${SRC}`);
    process.exit(1);
  }

  await mkdir(PUBLIC_DIR, { recursive: true });

  console.log("Generating favicons from images-src/app-icon-light.png\n");

  // PNG-varianter
  for (const { name, size } of OUTPUTS) {
    const outPath = path.join(PUBLIC_DIR, name);
    await sharp(SRC)
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9, palette: true })
      .toFile(outPath);
    const s = await stat(outPath);
    console.log(`  public/${name}  ${size}×${size}  ${formatBytes(s.size)}`);
  }

  // favicon.ico (16 + 32 combined, PNG-komprimerat inuti ICO)
  const ico16 = await sharp(SRC)
    .resize(16, 16, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const ico32 = await sharp(SRC)
    .resize(32, 32, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const ico = await buildIco([
    { size: 16, buffer: ico16 },
    { size: 32, buffer: ico32 },
  ]);
  const icoPath = path.join(PUBLIC_DIR, "favicon.ico");
  await writeFile(icoPath, ico);
  const icoStat = await stat(icoPath);
  console.log(`  public/favicon.ico  16+32 combined  ${formatBytes(icoStat.size)}`);

  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("Favicon generation failed:", err);
  process.exit(1);
});
