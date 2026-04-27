#!/usr/bin/env node
/**
 * mascot (restore)
 *
 * Restores docs/mascot-workspace/ from docs/mascot-workspace-backup/, then runs mascot:sync.
 * If no backup exists, run "npm run mascot:backup" first when your workspace images
 * are the version you want to keep.
 */

import { cpSync, existsSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WORKSPACE = join(ROOT, "docs", "mascot-workspace");
const BACKUP = join(ROOT, "docs", "mascot-workspace-backup");

function main() {
  if (!existsSync(BACKUP) || !statSync(BACKUP).isDirectory()) {
    console.error("No backup found: docs/mascot-workspace-backup/");
    console.error("Run 'npm run mascot:backup' when your workspace images are the version you want to keep.");
    process.exit(1);
  }
  const entries = readdirSync(BACKUP, { withFileTypes: true });
  for (const e of entries) {
    const src = join(BACKUP, e.name);
    const dest = join(WORKSPACE, e.name);
    if (e.isDirectory()) cpSync(src, dest, { recursive: true, force: true });
    else cpSync(src, dest, { force: true });
  }
  console.log("Restored: docs/mascot-workspace-backup → docs/mascot-workspace");
  console.log("Running mascot:sync…");
  execSync("npm run mascot:sync", { cwd: ROOT, stdio: "inherit" });
}

main();
