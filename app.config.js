const path = require("path");

const mobileRoot = path.join(__dirname, "apps", "mobile");
// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-require-imports
const { expo } = require(path.join(mobileRoot, "app.json"));
const runtimeSupabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const runtimeSupabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

/** Paths in apps/mobile/app.json are relative to apps/mobile; from monorepo root they must be prefixed. */
function fromMobile(rel) {
  if (typeof rel !== "string" || !rel.startsWith("./")) {
    return rel;
  }
  const tail = rel.slice(2).split(path.sep).join("/");
  return `./apps/mobile/${tail}`;
}

const EAS_PROJECT_ID = "4d900a70-4327-4740-83cc-4ac6745ef8eb";

module.exports = {
  expo: {
    ...expo,
    // EAS Update (OTA JS). Required for `eas update`; cannot be auto-injected into dynamic app.config.js.
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
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
    },
  },
};
