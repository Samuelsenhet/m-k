#!/usr/bin/env node
/**
 * Ensure Supabase CLI is linked to the MÄÄK project and deploy Edge Functions.
 *
 * 1. Runs supabase link --project-ref jappgthiyedycwhttpcu (stdio: inherit so you can
 *    confirm overwrite or enter DB password if first-time link).
 * 2. Runs npm run edge:fix-401 (deploy match-daily + match-status).
 *
 * If link is already correct, re-linking is harmless. First-time link may prompt for
 * database password – run once manually if needed: npx supabase link --project-ref jappgthiyedycwhttpcu
 *
 * Run from repo root: npm run edge:align-and-deploy
 */
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PROJECT_REF = "jappgthiyedycwhttpcu";

function main() {
  console.log("Linking to Supabase project", PROJECT_REF, "...");
  try {
    execSync(
      `npx supabase link --project-ref ${PROJECT_REF}`,
      { stdio: "inherit", cwd: ROOT, timeout: 60000, shell: true }
    );
  } catch (e) {
    console.error("\nLink failed. Ensure you are logged in: npx supabase login");
    if (e.status != null) console.error("Exit code:", e.status);
    process.exit(1);
  }

  console.log("\nDeploying Edge Functions...");
  try {
    execSync(
      "npm run edge:fix-401",
      { stdio: "inherit", cwd: ROOT, timeout: 120000, shell: true }
    );
  } catch (e) {
    console.error("\nDeploy failed. See messages above.");
    if (e.status != null) console.error("Exit code:", e.status);
    process.exit(1);
  }

  console.log("\nDone. Test: Dashboard → Edge Functions → match-daily → Invoke");
}

main();
