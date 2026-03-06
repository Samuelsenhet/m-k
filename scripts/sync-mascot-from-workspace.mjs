#!/usr/bin/env node
/**
 * mascot:sync
 *
 * Copies all mascot PNGs from docs/mascot-workspace/ to public/mascot/.
 * - The 9 app tokens use a fixed mapping (workspace filename → token.png).
 * - All other PNGs are copied with normalized names (# → -) for URL safety.
 * Writes src/lib/mascot/extra-mascot-images.json with the list of extra image names.
 *
 * Usage: npm run mascot:sync
 *
 * After sync, if any AI token was updated, run: npm run mascot:sprite
 */

import { readdirSync, copyFileSync, existsSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WORKSPACE_DIR = join(ROOT, "docs", "mascot-workspace");
const PUBLIC_MASCOT = join(ROOT, "public", "mascot");
const EXTRA_IMAGES_JSON = join(ROOT, "src", "lib", "mascot", "extra-mascot-images.json");

/** Normalize filename for URL-safe asset name: replace # with -. */
function normalizeName(basename) {
  return basename.replace(/#/g, "-");
}

/** Core token → list of workspace filenames (first existing wins). */
const TOKEN_TO_SOURCE = {
  mascot_calm_idle: ["calm#1.png", "calm#2.png", "calm.png"],
  mascot_ai_listening: ["listening.png"],
  mascot_ai_thinking: ["thinking#1.png", "thinking#2.png", "thinking.png"],
  mascot_ai_open_hand: ["ai-assistant.png", "explains#1.png", "explains#2.png", "explains#3.png", "explains#4.png"],
  mascot_ai_tiny_sparkle: ["celebrates-gently.png"],
  mascot_waiting_tea: ["waiting.png", "waiting#2.png", "waiting#3.png", "loading.png", "chat-waiting.png"],
  mascot_planting_seed: ["empty-matches#2.png", "empty-matches.png", "emply-states.png", "empry-matches.png"],
  mascot_practicing_mirror: ["no-chats.png", "no-chats#2.png"],
  mascot_lighting_lantern: ["first-match.png", "new-match.png", "view-match.png"],
};

/** Extra tokens (STATE_TOKEN_MAP): app filename → workspace candidates (typos / variants). */
const EXTRA_TOKEN_TO_SOURCE = {
  onboarding: ["onboarding.png"],
  teaches: ["teaches.png"],
  icon: ["icon.png"],
  social: ["social.png", "social#2.png"],
  encouraging: ["encouraging.png", "encauraging.png", "encouranging#2.png"],
  reassures: ["reassures.png"],
};

const AI_TOKENS = new Set([
  "mascot_ai_listening",
  "mascot_ai_thinking",
  "mascot_ai_open_hand",
  "mascot_ai_tiny_sparkle",
]);

function main() {
  if (!existsSync(WORKSPACE_DIR) || !statSync(WORKSPACE_DIR).isDirectory()) {
    console.error("Workspace not found:", WORKSPACE_DIR);
    process.exit(1);
  }
  if (!existsSync(PUBLIC_MASCOT)) {
    mkdirSync(PUBLIC_MASCOT, { recursive: true });
  }

  const allPngs = readdirSync(WORKSPACE_DIR).filter((f) => f.toLowerCase().endsWith(".png"));
  const workspaceSet = new Set(allPngs);
  const copied = [];
  const missing = [];
  const usedSources = new Set();
  let aiUpdated = false;

  for (const [token, candidates] of Object.entries(TOKEN_TO_SOURCE)) {
    const sourceFile = candidates.find((f) => workspaceSet.has(f));
    if (!sourceFile) {
      missing.push({ token, tried: candidates });
      continue;
    }
    usedSources.add(sourceFile);
    const srcPath = join(WORKSPACE_DIR, sourceFile);
    const destPath = join(PUBLIC_MASCOT, `${token}.png`);
    copyFileSync(srcPath, destPath);
    copied.push({ token: `${token}.png`, from: sourceFile });
    if (AI_TOKENS.has(token)) aiUpdated = true;
  }

  const extraNames = [];

  for (const [destToken, candidates] of Object.entries(EXTRA_TOKEN_TO_SOURCE)) {
    const sourceFile = candidates.find((f) => workspaceSet.has(f));
    if (!sourceFile) continue;
    usedSources.add(sourceFile);
    const srcPath = join(WORKSPACE_DIR, sourceFile);
    const destPath = join(PUBLIC_MASCOT, `${destToken}.png`);
    copyFileSync(srcPath, destPath);
    copied.push({ token: `${destToken}.png`, from: sourceFile });
    if (!extraNames.includes(destToken)) extraNames.push(destToken);
  }

  for (const file of allPngs) {
    if (usedSources.has(file)) continue;
    const normalized = normalizeName(file.replace(/\.png$/i, ""));
    const srcPath = join(WORKSPACE_DIR, file);
    const destPath = join(PUBLIC_MASCOT, `${normalized}.png`);
    copyFileSync(srcPath, destPath);
    copied.push({ token: `${normalized}.png`, from: file });
    if (!extraNames.includes(normalized)) extraNames.push(normalized);
  }
  extraNames.sort();
  writeFileSync(EXTRA_IMAGES_JSON, JSON.stringify(extraNames, null, 2) + "\n", "utf8");

  console.log("\nMascot sync: docs/mascot-workspace → public/mascot\n");
  if (copied.length) {
    console.log("Copied:", copied.length, "file(s)");
    copied.forEach(({ token, from }) => console.log(`  ${from} → ${token}`));
  }
  if (missing.length) {
    console.log("\nSkipped (no source in workspace):");
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
