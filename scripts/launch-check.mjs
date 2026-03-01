#!/usr/bin/env node
/**
 * Pre-release check: env vars (optional) and production build.
 * Run: npm run launch:check
 * - If .env or .env.production exist, checks VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.
 * - Fails if VITE_ENABLE_DEMO=true in .env.production.
 * - Runs npm run build (production). Fails on build error.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf8");
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        out[key] = value;
      }
    }
  }
  return out;
}

function main() {
  const errors = [];
  const envProd = parseEnvFile(join(ROOT, ".env.production"));
  const env = parseEnvFile(join(ROOT, ".env"));

  if (envProd.VITE_ENABLE_DEMO === "true") {
    errors.push("VITE_ENABLE_DEMO is true in .env.production – must not be enabled in production.");
  }

  const url = process.env.VITE_SUPABASE_URL ?? envProd.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    envProd.VITE_SUPABASE_PUBLISHABLE_KEY ??
    envProd.VITE_SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY;

  if (existsSync(join(ROOT, ".env")) || existsSync(join(ROOT, ".env.production"))) {
    if (!url || url.length < 10) {
      errors.push("VITE_SUPABASE_URL (or VITE_SUPABASE_PROJECT_ID) not set or too short in env or .env files.");
    }
    if (!key || key.length < 20) {
      errors.push("VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) not set or too short in env or .env files.");
    }
  }

  if (errors.length > 0) {
    console.error("launch:check failed:\n");
    errors.forEach((e) => console.error("  -", e));
    process.exit(1);
  }

  console.log("Env check OK. Running production build...");
  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  } catch {
    console.error("\nlaunch:check failed: build exited with error.");
    process.exit(1);
  }

  console.log("\nlaunch:check OK.");
}

main();
