#!/usr/bin/env node
/**
 * Pre-ship launch check — run before `eas build --profile expo-production`
 * or before tagging a release. Run with:
 *
 *   npm run launch:check
 *
 * Philosophy: fail loudly on anything that would break launch-day. False
 * negatives (things we miss) are worse than false positives.
 *
 * What it checks:
 *   1. .env files parse and have required keys
 *   2. Supabase URL + anon key look valid
 *   3. RevenueCat iOS key is a live "appl_" public key — hard fail on
 *      sk_ (secret!) or test_ prefixes
 *   4. PostHog project token is a "phc_" key
 *   5. No VITE_ENABLE_DEMO=true in .env.production
 *   6. Git working tree has no uncommitted files that usually matter
 *      for launch (mobile src, app.config, env.example, migrations)
 *   7. Key migrations are committed (age gate, vardar foundations)
 *   8. Web production build succeeds (npm run build at repo root)
 *
 * What it deliberately does NOT check:
 *   - Database state (age-gate validation happens at migration time)
 *   - EAS-side env vars (we can't see them without `eas env:list`)
 *   - Whether App Store Connect metadata is filled in
 *   - Anything that requires being logged in to a third party
 *
 * Use this as one of several checklists — it's not a complete launch plan.
 * See docs/LAUNCH_CHECKLIST.md for the full list.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── helpers ─────────────────────────────────────────────────────────────
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf8");
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Collect env vars from multiple sources with process.env winning last. */
function collectEnv() {
  const merged = {
    ...parseEnvFile(join(ROOT, ".env")),
    ...parseEnvFile(join(ROOT, "apps", "mobile", ".env")),
    ...parseEnvFile(join(ROOT, ".env.production")),
  };
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) merged[k] = v;
  }
  return merged;
}

const issues = { blocker: [], high: [], warn: [] };

function blocker(msg) {
  issues.blocker.push(msg);
}
function high(msg) {
  issues.high.push(msg);
}
function warn(msg) {
  issues.warn.push(msg);
}

// ── checks ─────────────────────────────────────────────────────────────

function checkSupabase(env) {
  const url =
    env.VITE_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY;

  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co/.test(url)) {
    blocker(
      "Supabase URL missing or not a *.supabase.co URL. Set " +
        "VITE_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL.",
    );
  }
  if (!key || key.length < 40) {
    blocker(
      "Supabase anon key missing or too short. Set " +
        "VITE_SUPABASE_PUBLISHABLE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

function checkRevenueCat(env) {
  const key = env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  if (!key) {
    high(
      "EXPO_PUBLIC_REVENUECAT_IOS_KEY not set. Mobile prod builds will " +
        "throw from app.config.cjs's guard. Set it in apps/mobile/.env or " +
        "via `eas env:create`.",
    );
    return;
  }
  if (key.startsWith("sk_")) {
    blocker(
      "EXPO_PUBLIC_REVENUECAT_IOS_KEY is a SECRET RevenueCat key (sk_). " +
        "NEVER embed secret keys in mobile binaries — they give full REST " +
        "API access. Rotate immediately and use the public iOS SDK key " +
        "(appl_ prefix) from RevenueCat dashboard → Project Settings → " +
        "API keys → iOS → Public app-specific API keys.",
    );
    return;
  }
  if (key.startsWith("test_")) {
    high(
      "EXPO_PUBLIC_REVENUECAT_IOS_KEY looks like a test key (test_). " +
        "Production submissions need the live public key (appl_ prefix). " +
        "OK for dev/preview builds.",
    );
    return;
  }
  if (!key.startsWith("appl_")) {
    warn(
      `EXPO_PUBLIC_REVENUECAT_IOS_KEY has unexpected prefix (starts with "${key.slice(0, 6)}"). ` +
        "Expected appl_ for iOS. Double-check this is the right key.",
    );
  }
}

function checkPostHog(env) {
  const token = env.POSTHOG_PROJECT_TOKEN || env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!token) {
    warn(
      "POSTHOG_PROJECT_TOKEN / NEXT_PUBLIC_POSTHOG_KEY not set. Analytics " +
        "will be disabled in the build. Not a blocker, but funnels won't " +
        "work from day one.",
    );
    return;
  }
  if (!token.startsWith("phc_")) {
    warn(
      `PostHog token has unexpected prefix (starts with "${token.slice(0, 5)}"). ` +
        "Expected phc_ for project keys.",
    );
  }

  const host = env.POSTHOG_HOST || env.NEXT_PUBLIC_POSTHOG_HOST;
  if (host && !/^https:\/\/(eu|us)\.i\.posthog\.com/.test(host)) {
    warn(
      `POSTHOG_HOST "${host}" is not a standard PostHog region. ` +
        "Expected https://eu.i.posthog.com or https://us.i.posthog.com.",
    );
  }
}

function checkDemoFlag(env) {
  if (env.VITE_ENABLE_DEMO === "true") {
    blocker(
      "VITE_ENABLE_DEMO=true is set. Demo mode must be off for production " +
        "builds. Unset it or set it to false.",
    );
  }
  if (env.ALLOW_DEMO_RESET === "true") {
    high(
      "ALLOW_DEMO_RESET=true is set. This opens the reset-demo-password " +
        "edge function with no auth beyond the flag. Unset unless you're " +
        "actively in an App Store review window.",
    );
  }
}

function checkGit() {
  let statusOut = "";
  try {
    statusOut = execSync("git status --porcelain", {
      cwd: ROOT,
      encoding: "utf8",
    });
  } catch (err) {
    warn(`git status failed: ${err.message}`);
    return;
  }
  if (!statusOut.trim()) return;

  const dirty = statusOut
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Categorise: paths that matter for launch vs. incidental
  const critical = dirty.filter(
    (l) =>
      /app\.config\.cjs/.test(l) ||
      /apps\/mobile\/src\//.test(l) ||
      /apps\/mobile\/app\.json/.test(l) ||
      /supabase\/migrations\//.test(l) ||
      /supabase\/functions\//.test(l) ||
      /\.env\.example/.test(l),
  );
  if (critical.length > 0) {
    high(
      "Uncommitted launch-critical files:\n      " +
        critical.join("\n      "),
    );
  }
  // Everything else is just a warning
  const rest = dirty.filter((l) => !critical.includes(l));
  if (rest.length > 0) {
    warn(
      `${rest.length} other uncommitted files — check git status before tagging.`,
    );
  }
}

function checkMigrations() {
  const required = [
    "20260411180000_vardar_foundations.sql",
    "20260411190000_age_gate_enforcement.sql",
  ];
  for (const name of required) {
    const p = join(ROOT, "supabase", "migrations", name);
    if (!existsSync(p)) {
      high(
        `Migration missing from supabase/migrations/: ${name}. ` +
          "Was it deleted or renamed?",
      );
    }
  }
}

function checkBuild() {
  console.log(`${DIM}→ Running npm run build …${RESET}`);
  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  } catch {
    blocker("Web production build failed. See output above.");
  }
}

// ── report ─────────────────────────────────────────────────────────────

function report() {
  const hr = "─".repeat(72);
  const total =
    issues.blocker.length + issues.high.length + issues.warn.length;

  console.log("");
  console.log(hr);
  console.log(`${BOLD}MÄÄK launch check${RESET}`);
  console.log(hr);

  if (issues.blocker.length > 0) {
    console.log(`\n${RED}${BOLD}BLOCKERS (${issues.blocker.length})${RESET}`);
    for (const m of issues.blocker) {
      console.log(`  ${RED}✗${RESET} ${m}`);
    }
  }

  if (issues.high.length > 0) {
    console.log(`\n${YELLOW}${BOLD}HIGH (${issues.high.length})${RESET}`);
    for (const m of issues.high) {
      console.log(`  ${YELLOW}!${RESET} ${m}`);
    }
  }

  if (issues.warn.length > 0) {
    console.log(`\n${DIM}${BOLD}WARNINGS (${issues.warn.length})${RESET}`);
    for (const m of issues.warn) {
      console.log(`  ${DIM}·${RESET} ${m}`);
    }
  }

  console.log("\n" + hr);
  if (issues.blocker.length > 0) {
    console.log(
      `${RED}${BOLD}FAIL${RESET} — ${issues.blocker.length} blocker(s). ` +
        `Fix before running \`eas build --profile expo-production\`.`,
    );
    console.log(hr);
    process.exit(1);
  } else if (issues.high.length > 0) {
    console.log(
      `${YELLOW}${BOLD}PASS WITH WARNINGS${RESET} — ` +
        `${issues.high.length} high-priority issue(s). ` +
        `Launch possible but address before tagging.`,
    );
    console.log(hr);
    process.exit(0);
  } else if (total === 0) {
    console.log(
      `${GREEN}${BOLD}PASS${RESET} — ready to build.\n` +
        `Next: \`eas build --profile expo-production --platform ios\``,
    );
    console.log(hr);
    process.exit(0);
  } else {
    console.log(`${GREEN}${BOLD}PASS${RESET} with ${issues.warn.length} note(s).`);
    console.log(hr);
    process.exit(0);
  }
}

// ── main ───────────────────────────────────────────────────────────────

function main() {
  const env = collectEnv();

  checkSupabase(env);
  checkRevenueCat(env);
  checkPostHog(env);
  checkDemoFlag(env);
  checkGit();
  checkMigrations();

  // Only run the heavy build if no blockers so far — no point compiling
  // if we already know the env is broken.
  if (issues.blocker.length === 0) {
    checkBuild();
  } else {
    console.log(
      `${DIM}→ Skipping web build (blockers already found)${RESET}`,
    );
  }

  report();
}

main();
