#!/usr/bin/env node
/**
 * STEG 4 – Invoke match-daily and expect 200 (or 202 WAITING).
 * Run from repo root: node scripts/invoke-match-daily-test.mjs
 *
 * Requires one of:
 *   A) SUPABASE_SERVICE_ROLE_KEY in .env (Dashboard → Settings → API → service_role)
 *   B) SUPABASE_TEST_EMAIL + SUPABASE_TEST_PASSWORD in .env (real user)
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  const envPath = join(ROOT, ".env");
  try {
    const raw = readFileSync(envPath, "utf8");
    const out = {};
    for (const line of raw.split("\n")) {
      const i = line.indexOf("=");
      if (i <= 0) continue;
      const key = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !key.startsWith("#")) out[key] = value;
    }
    return out;
  } catch (e) {
    if (e.code === "ENOENT") return {};
    throw e;
  }
}

async function main() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const testEmail = env.SUPABASE_TEST_EMAIL?.trim();
  const testPassword = env.SUPABASE_TEST_PASSWORD?.trim();

  if (!url || !anonKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
    process.exit(1);
  }

  const functionsUrl = `${url.replace(/\/$/, "")}/functions/v1/match-daily`;

  // A) Service role: get one profile id, then invoke with Bearer service_role + user_id
  if (serviceRoleKey) {
    const listUrl = `${url.replace(/\/$/, "")}/rest/v1/profiles?select=id&limit=1`;
    const listRes = await fetch(listUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
    });
    if (!listRes.ok) {
      console.error("Failed to list profiles:", listRes.status, await listRes.text());
      process.exit(1);
    }
    const rows = await listRes.json();
    const userId = rows?.[0]?.id;
    if (!userId) {
      console.error("No profiles in DB. Create a user first or pass user_id via SUPABASE_TEST_USER_ID in .env");
      process.exit(1);
    }
    const res = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    console.log("STEG 4 – match-daily (service role):", res.status, res.statusText);
    if (res.ok) {
      console.log("✅ Backend OK. Body:", JSON.stringify(data, null, 2));
      process.exit(0);
    }
    console.error("Response:", data);
    process.exit(res.status === 401 ? 1 : 1);
  }

  // B) Test user: sign in, then invoke with Bearer access_token
  if (testEmail && testPassword) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, anonKey);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (signInError || !signInData?.session?.access_token) {
      console.error("Sign-in failed:", signInError?.message ?? "no session");
      process.exit(1);
    }
    const token = signInData.session.access_token;
    const res = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    console.log("STEG 4 – match-daily (test user):", res.status, res.statusText);
    if (res.ok) {
      console.log("✅ Backend OK. Body:", JSON.stringify(data, null, 2));
      process.exit(0);
    }
    console.error("Response:", data);
    process.exit(1);
  }

  console.error("To run STEG 4 automatically, add to .env one of:");
  console.error("  A) SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API → service_role)");
  console.error("  B) SUPABASE_TEST_EMAIL and SUPABASE_TEST_PASSWORD (real user)");
  process.exit(1);
}

main();
