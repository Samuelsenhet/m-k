const fs = require("fs");
const path = require("path");

/**
 * Load .env from repo root and apps/mobile into process.env when the key is unset or empty.
 * Expo CLI also loads .env, but monorepos often keep VITE_* only at root — we merge before reading Supabase vars.
 * EAS Build / CI: variables are already set; we do not overwrite non-empty values.
 */
function parseEnvFileSync(absPath) {
  if (!fs.existsSync(absPath)) return {};
  /** @type {Record<string, string>} */
  const out = {};
  const raw = fs.readFileSync(absPath, "utf8");
  for (let line of raw.split("\n")) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice("export ".length).trim();
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function applyLocalEnvFiles() {
  const rootEnv = parseEnvFileSync(path.join(__dirname, ".env"));
  const mobileEnv = parseEnvFileSync(path.join(__dirname, "apps", "mobile", ".env"));
  const merged = { ...rootEnv, ...mobileEnv };
  for (const [key, val] of Object.entries(merged)) {
    if (val === undefined || val === "") continue;
    const cur = process.env[key];
    if (cur === undefined || String(cur).trim() === "") {
      process.env[key] = val;
    }
  }
}

applyLocalEnvFiles();

const mobileRoot = path.join(__dirname, "apps", "mobile");
// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-require-imports
const { expo } = require(path.join(mobileRoot, "app.json"));
const runtimeSupabaseUrl = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""
).trim();
const runtimeSupabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim();

/**
 * app.json paths are relative to apps/mobile. Use absolute paths under mobileRoot so prebuild finds files
 * whether EAS cwd is the monorepo root or apps/mobile (relative "./apps/mobile/..." breaks in the latter).
 */
function fromMobile(rel) {
  if (typeof rel !== "string" || !rel.startsWith("./")) {
    return rel;
  }
  const tail = rel.slice(2).split("/").join(path.sep);
  return path.join(mobileRoot, tail);
}

const EAS_PROJECT_ID = "4d900a70-4327-4740-83cc-4ac6745ef8eb";

module.exports = {
  expo: {
    ...expo,
    // EAS Update (OTA JS). Required for `eas update`; cannot be auto-injected into dynamic app.config.
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
      // Bare iOS reads Expo.plist; keep this in sync so `expo export` / docs match the binary.
      requestHeaders: {
        "expo-channel-name": "production",
      },
    },
    // Bare workflow: policy-based runtimeVersion is not supported — use a string (keep in sync with expo.version / native build).
    runtimeVersion: typeof expo.version === "string" ? expo.version : "1.0.0",
    // Root package.json is Vite (`main: index.js`); EAS/Metro must use the Expo app entry.
    main: "expo-router/entry",
    icon: fromMobile(expo.icon),
    splash: expo.splash
      ? {
          ...expo.splash,
          image: fromMobile(expo.splash.image),
        }
      : expo.splash,
    web: expo.web
      ? {
          ...expo.web,
          favicon: fromMobile(expo.web.favicon),
        }
      : expo.web,
    extra: {
      ...(expo.extra ?? {}),
      runtimeSupabaseUrl,
      runtimeSupabaseAnonKey,
      ...(runtimeSupabaseUrl ? { EXPO_PUBLIC_SUPABASE_URL: runtimeSupabaseUrl } : {}),
      ...(runtimeSupabaseAnonKey
        ? { EXPO_PUBLIC_SUPABASE_ANON_KEY: runtimeSupabaseAnonKey }
        : {}),
    },
  },
};
