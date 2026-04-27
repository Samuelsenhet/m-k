#!/usr/bin/env node
/**
 * mascot:backup
 *
 * Copies docs/mascot-workspace/ to docs/mascot-workspace-backup/.
 * Run this when your workspace images are the version you want to keep.
 * Later, npm run mascot restores from this backup.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WORKSPACE = join(ROOT, "docs", "mascot-workspace");
const BACKUP = join(ROOT, "docs", "mascot-workspace-backup");

function main() {
  if (!existsSync(WORKSPACE) || !statSync(WORKSPACE).isDirectory()) {
    console.error("docs/mascot-workspace/ not found.");
    process.exit(1);
  }
  if (existsSync(BACKUP)) rmSync(BACKUP, { recursive: true });
  mkdirSync(BACKUP, { recursive: true });
  const entries = readdirSync(WORKSPACE, { withFileTypes: true });
  for (const e of entries) {
    const src = join(WORKSPACE, e.name);
    const dest = join(BACKUP, e.name);
    if (e.isDirectory()) cpSync(src, dest, { recursive: true });
    else cpSync(src, dest);
  }
  console.log("Backup done: docs/mascot-workspace → docs/mascot-workspace-backup");
}

main();
