#!/usr/bin/env node
/**
 * Fix 401 from match-daily / match-status: redeploy Edge Functions.
 *
 * SUPABASE_URL and SUPABASE_ANON_KEY are automatically injected by Supabase
 * in the Edge Function runtime (reserved secrets). No need to set them via CLI.
 *
 * This script deploys match-daily and match-status so they run in your linked
 * project with the correct env. Ensure project is linked: supabase link --project-ref <ref>
 *
 * Run from repo root: npm run edge:fix-401
 */
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function main() {
  console.log("Deploying match-daily and match-status...");
  console.log("(SUPABASE_URL and SUPABASE_ANON_KEY are auto-injected by Supabase.)\n");

  try {
    execSync(
      "npx supabase functions deploy match-daily match-status",
      { stdio: "inherit", cwd: ROOT, timeout: 120000, shell: true }
    );
  } catch (e) {
    console.error("\nDeploy failed. Ensure:");
    console.error("  1. npx supabase login");
    console.error("  2. npx supabase link --project-ref jappgthiyedycwhttpcu");
    if (e.status != null) console.error("Exit code:", e.status);
    process.exit(1);
  }

  console.log("\nDone. Test: Dashboard → Edge Functions → match-daily → Invoke");
  console.log("Header: Authorization: Bearer <token from browser>");
}

main();
