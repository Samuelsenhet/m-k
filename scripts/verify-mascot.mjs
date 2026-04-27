#!/usr/bin/env node
/**
 * mascot:verify
 *
 * Checks that all required mascot PNGs exist in public/mascot/
 * and reports file sizes (zero-byte = broken).
 *
 * Run: npm run mascot:verify
 */
import { existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_MASCOT = join(ROOT, "public", "mascot");

const REQUIRED = [
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

const OPTIONAL = ["mascot_sheet_ai"];

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function check(tokens, label) {
  console.log(`\n${label}`);
  let ok = 0;
  let fail = 0;
  for (const token of tokens) {
    const file = join(PUBLIC_MASCOT, `${token}.png`);
    if (!existsSync(file)) {
      console.log(`  ${RED}✗ MISSING${RESET}  ${token}.png`);
      fail++;
    } else {
      const size = statSync(file).size;
      if (size === 0) {
        console.log(`  ${YELLOW}⚠ EMPTY  ${RESET}  ${token}.png  (0 bytes)`);
        fail++;
      } else {
        const kb = (size / 1024).toFixed(1);
        console.log(`  ${GREEN}✓${RESET}          ${token}.png  (${kb} KB)`);
        ok++;
      }
    }
  }
  return { ok, fail };
}

const req = check(REQUIRED, "Required (9 tokens):");
const opt = check(OPTIONAL, "Optional:");

console.log("\n---");
if (req.fail === 0) {
  console.log(`${GREEN}All ${REQUIRED.length} required tokens present.${RESET}`);
} else {
  console.log(`${RED}${req.fail} required token(s) missing or empty.${RESET}`);
  console.log("Export from Figma and run: npm run mascot:extract -- <folder>");
}

if (opt.fail > 0) {
  console.log(`${YELLOW}mascot_sheet_ai.png missing – run: npm run mascot:sprite${RESET}`);
}

process.exit(req.fail > 0 ? 1 : 0);
