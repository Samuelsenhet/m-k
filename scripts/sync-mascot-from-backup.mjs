#!/usr/bin/env node
/**
 * mascot:sync-from-backup
 *
 * Copies all mascot PNGs from docs/mascot-workspace-backup/ to public/mascot/.
 * Same logic as mascot:sync but source is the backup folder (includes extra
 * candidate filenames that exist in backup, e.g. no-chat.png, empty-states.png).
 * Writes src/lib/mascot/extra-mascot-images.json.
 *
 * Use when the new mascot assets live in mascot-workspace-backup and you want
 * to push them into the app without overwriting docs/mascot-workspace.
 *
 * Usage: npm run mascot:sync-from-backup
 *
 * After sync, if any AI token was updated, run: npm run mascot:sprite
 */

import { readdirSync, copyFileSync, existsSync, statSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BACKUP_DIR = join(ROOT, "docs", "mascot-workspace-backup");
const PUBLIC_MASCOT = join(ROOT, "public", "mascot");
const EXTRA_IMAGES_JSON = join(ROOT, "src", "lib", "mascot", "extra-mascot-images.json");

function normalizeName(basename) {
  return basename.replace(/#/g, "-");
}

/** Token → list of source filenames (first existing in backup wins). Includes backup-specific names. */
const TOKEN_TO_SOURCE = {
  mascot_calm_idle: ["calm#1.png", "calm#2.png", "calm.png"],
  mascot_ai_listening: ["listening.png"],
  mascot_ai_thinking: ["thinking#1.png", "thinking#2.png", "thinking.png"],
  mascot_ai_open_hand: ["ai-assistant.png", "explains#1.png", "explain#2.png", "explain#3.png"],
  mascot_ai_tiny_sparkle: ["celebrates-gently.png", "encouraging.png"],
  mascot_waiting_tea: ["waiting.png", "loading.png", "laoding.png", "waiting#2.png", "loading-match.png"],
  mascot_planting_seed: ["empty-matches#2.png", "empty-states.png"],
  mascot_practicing_mirror: ["no-chats.png", "no-chat.png"],
  mascot_lighting_lantern: ["first-match.png", "new-match.png"],
};

const AI_TOKENS = new Set([
  "mascot_ai_listening",
  "mascot_ai_thinking",
  "mascot_ai_open_hand",
  "mascot_ai_tiny_sparkle",
]);

function main() {
  if (!existsSync(BACKUP_DIR) || !statSync(BACKUP_DIR).isDirectory()) {
    console.error("Backup not found:", BACKUP_DIR);
    process.exit(1);
  }

  const allPngs = readdirSync(BACKUP_DIR).filter((f) => f.toLowerCase().endsWith(".png"));
  const backupSet = new Set(allPngs);
  const copied = [];
  const missing = [];
  const usedSources = new Set();
  let aiUpdated = false;

  for (const [token, candidates] of Object.entries(TOKEN_TO_SOURCE)) {
    const sourceFile = candidates.find((f) => backupSet.has(f));
    if (!sourceFile) {
      missing.push({ token, tried: candidates });
      continue;
    }
    usedSources.add(sourceFile);
    const srcPath = join(BACKUP_DIR, sourceFile);
    const destPath = join(PUBLIC_MASCOT, `${token}.png`);
    copyFileSync(srcPath, destPath);
    copied.push({ token, from: sourceFile });
    if (AI_TOKENS.has(token)) aiUpdated = true;
  }

  const extraNames = [];
  for (const file of allPngs) {
    if (usedSources.has(file)) continue;
    const normalized = normalizeName(file.replace(/\.png$/i, ""));
    const srcPath = join(BACKUP_DIR, file);
    const destPath = join(PUBLIC_MASCOT, `${normalized}.png`);
    copyFileSync(srcPath, destPath);
    copied.push({ token: `${normalized}.png`, from: file });
    extraNames.push(normalized);
  }
  extraNames.sort();
  writeFileSync(EXTRA_IMAGES_JSON, JSON.stringify(extraNames, null, 2) + "\n", "utf8");

  console.log("\nMascot sync: docs/mascot-workspace-backup → public/mascot\n");
  if (copied.length) {
    console.log("Copied:", copied.length, "file(s)");
    copied.forEach(({ token, from }) => console.log(`  ${from} → ${String(token).endsWith(".png") ? token : token + ".png"}`));
  }
  if (missing.length) {
    console.log("\nSkipped (no source in backup):");
    missing.forEach(({ token, tried }) =>
      console.log(`  ${token} (tried: ${tried.join(", ")})`)
    );
  }
  console.log("\nExtra images list written to src/lib/mascot/extra-mascot-images.json");
  if (aiUpdated) {
    console.log("At least one AI token was updated. Run: npm run mascot:sprite");
  }
  console.log("Done.\n");
}

main();
