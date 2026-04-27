#!/usr/bin/env node
/**
 * mascot:extract <source-folder>
 *
 * Interactively maps PNG files from a Figma export folder to mascot tokens
 * and copies them into public/mascot/.
 *
 * Usage:
 *   npm run mascot:extract -- <path-to-folder>
 *
 * Example:
 *   npm run mascot:extract -- docs/mascot-workspace/export
 */
import { readdirSync, copyFileSync, existsSync, statSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_MASCOT = join(ROOT, "public", "mascot");

const TOKENS = [
  "mascot_calm_idle",
  "mascot_ai_listening",
  "mascot_ai_thinking",
  "mascot_ai_open_hand",
  "mascot_ai_tiny_sparkle",
  "mascot_waiting_tea",
  "mascot_planting_seed",
  "mascot_practicing_mirror",
  "mascot_lighting_lantern",
];

const AI_TOKENS = new Set([
  "mascot_ai_listening",
  "mascot_ai_thinking",
  "mascot_ai_open_hand",
  "mascot_ai_tiny_sparkle",
]);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  const sourceArg = process.argv[2];
  if (!sourceArg) {
    console.error("Usage: npm run mascot:extract -- <source-folder>");
    console.error("Example: npm run mascot:extract -- docs/mascot-workspace/export");
    process.exit(1);
  }

  const sourceDir = sourceArg.startsWith("/") ? sourceArg : join(ROOT, sourceArg);

  if (!existsSync(sourceDir)) {
    console.error(`Not found: ${sourceDir}`);
    process.exit(1);
  }

  if (!statSync(sourceDir).isDirectory()) {
    console.error(`Not a directory: ${sourceDir}`);
    console.error("The source must be a folder containing PNG files.");
    console.error("If you exported from Figma, unzip the export and point to that folder.");
    process.exit(1);
  }

  const pngs = readdirSync(sourceDir)
    .filter((f) => extname(f).toLowerCase() === ".png")
    .sort();

  if (pngs.length === 0) {
    console.error(`No PNG files found in: ${sourceDir}`);
    process.exit(1);
  }

  console.log(`\nFound ${pngs.length} PNG(s) in ${sourceArg}\n`);

  // Show which tokens are already filled
  const existing = new Set(
    TOKENS.filter((t) => existsSync(join(PUBLIC_MASCOT, `${t}.png`)))
  );

  const tokenMenu = TOKENS.map((t, i) => {
    const status = existing.has(t) ? " (exists)" : " (missing)";
    return `  ${i + 1}. ${t}${status}`;
  }).join("\n");

  const assigned = new Map(); // token -> source filename
  const aiChanged = new Set();

  for (const file of pngs) {
    console.log(`\nFile: \x1b[36m${file}\x1b[0m`);
    console.log("Assign to token (number), or 0 to skip:\n");
    console.log(tokenMenu);

    let choice;
    while (true) {
      const raw = (await ask("\nChoice: ")).trim();
      if (raw === "0") {
        choice = null;
        break;
      }
      const n = parseInt(raw, 10);
      if (n >= 1 && n <= TOKENS.length) {
        choice = TOKENS[n - 1];
        break;
      }
      console.log(`Enter 1–${TOKENS.length} or 0 to skip.`);
    }

    if (!choice) {
      console.log("Skipped.");
      continue;
    }

    assigned.set(choice, file);
    console.log(`→ \x1b[32mpublic/mascot/${choice}.png\x1b[0m`);
  }

  if (assigned.size === 0) {
    console.log("\nNothing assigned. Done.");
    rl.close();
    return;
  }

  console.log("\n--- Preview ---");
  for (const [token, file] of assigned) {
    console.log(`  ${file}  →  public/mascot/${token}.png`);
  }

  const confirm = (await ask("\nCopy files? (y/n): ")).trim().toLowerCase();
  if (confirm !== "y") {
    console.log("Aborted.");
    rl.close();
    return;
  }

  for (const [token, file] of assigned) {
    const src = join(sourceDir, file);
    const dest = join(PUBLIC_MASCOT, `${token}.png`);
    copyFileSync(src, dest);
    console.log(`✓ ${token}.png`);
    if (AI_TOKENS.has(token)) aiChanged.add(token);
  }

  // Summary: which tokens are still missing
  const stillMissing = TOKENS.filter(
    (t) => !existing.has(t) && !assigned.has(t)
  );

  console.log("\n✅ Copied. Files in public/mascot/.");

  if (stillMissing.length > 0) {
    console.log("\nStill missing:");
    for (const t of stillMissing) console.log(`  ✗ ${t}.png`);
  } else {
    console.log("All 9 tokens present.");
  }

  if (aiChanged.size > 0) {
    console.log(`\nAI token(s) updated: ${[...aiChanged].join(", ")}`);
    const rebuild = (await ask("Rebuild mascot_sheet_ai.png? (y/n): "))
      .trim()
      .toLowerCase();
    if (rebuild === "y") {
      try {
        execSync("npm run mascot:sprite", { stdio: "inherit", cwd: ROOT });
      } catch {
        console.error("mascot:sprite failed – run it manually: npm run mascot:sprite");
      }
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
