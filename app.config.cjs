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

/** Inline from apps/mobile/app.json — single source of truth lives here now. */
const expo = {
  name: "MÄÄK",
  slug: "maak",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "maak",
  platforms: ["ios", "web"],
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#F2F0EF",
  },
  ios: {
    // iPhone-only for v1 launch — disables App Store Connect's iPad screenshot requirement.
    // To re-enable iPad later: flip to true, add iPad screenshots, rebuild + submit.
    supportsTablet: false,
    bundleIdentifier: "com.samuelsenhet.maak",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIRequiredDeviceCapabilities: ["armv7", "telephony"],
      // Camera — Kemi-Check video calls + profile photo capture.
      NSCameraUsageDescription:
        "MÄÄK behöver tillgång till din kamera för Kemi-Check videosamtal och för att ta profilbilder.",
      // Mic — video calls only.
      NSMicrophoneUsageDescription:
        "MÄÄK behöver tillgång till din mikrofon för Kemi-Check videosamtal.",
      // Photo library (read) — picking existing photos for profile uploads.
      // expo-image-picker plugin usually injects this from photosPermission below,
      // but we set it explicitly so App Store review never sees a missing key.
      NSPhotoLibraryUsageDescription:
        "MÄÄK behöver tillgång till dina foton för att du ska kunna välja profilbilder.",
      // Photo library (write) — saving photos the user generates in-app (e.g.
      // screenshots of their archetype). Not strictly used today but required
      // by review if UIImageWriteToSavedPhotosAlbum is ever called from a dep.
      NSPhotoLibraryAddUsageDescription:
        "MÄÄK kan spara bilder du skapar i appen till ditt fotobibliotek.",
    },
    // Apple Privacy Manifest (iOS 17+). Expo injects this into
    // ios/MK/PrivacyInfo.xcprivacy on prebuild so it survives
    // regenerations of the native folder.
    //
    // Status: NSPrivacyTracking=false — MÄÄK does not do cross-app
    // tracking. PostHog runs on our own EU project and is tied to the
    // user's in-app account, so it's "analytics linked to identity"
    // but not ATT-relevant tracking.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
          NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"],
        },
      ],
      NSPrivacyCollectedDataTypes: [
        // Identity — needed for phone OTP auth + profile creation.
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeName",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhoneNumber",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeUserID",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            "NSPrivacyCollectedDataTypePurposeAnalytics",
          ],
        },
        // User-generated content — photos, chat messages.
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhotosorVideos",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherUserContent",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        // Sensitive — personality test answers + ID verification.
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeSensitiveInfo",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        // PostHog — linked because we call posthog.identify(userId).
        {
          NSPrivacyCollectedDataType:
            "NSPrivacyCollectedDataTypeProductInteraction",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAnalytics",
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherUsageData",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAnalytics",
          ],
        },
        // Crashes captured by PostHog / native diagnostics.
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeCrashData",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
      ],
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-updates",
    "expo-router",
    "expo-localization",
    [
      "expo-image-picker",
      {
        photosPermission: "MÄÄK behöver tillgång till dina foton för att ladda upp profilbilder.",
      },
    ],
    "expo-image",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#2D5A3D",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  owner: "samuelsenhet",
  android: {
    permissions: ["android.permission.RECORD_AUDIO"],
  },
};

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
const runtimeRevenueCatIosKey = (
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || ""
).trim();

// Hard-fail on any build (not just production) if the RevenueCat key
// looks like a server-side secret (sk_ prefix). Those keys give FULL
// REST API access — they must never ship inside a mobile binary. We
// fail closed for everyone, not just production, because a dev-client
// build is still distributable and can be decompiled.
if (runtimeRevenueCatIosKey.startsWith("sk_")) {
  throw new Error(
    "EXPO_PUBLIC_REVENUECAT_IOS_KEY looks like a RevenueCat SECRET key " +
      "(starts with 'sk_'). Secret keys give full REST API access and " +
      "MUST NOT be embedded in a mobile app. Rotate it in the RevenueCat " +
      "dashboard immediately and replace it with the public iOS SDK key " +
      "(starts with 'appl_'). Aborting.",
  );
}

// Hard-fail the production build if the key is missing or still a test
// key — without this guard a missing env var silently ships with no IAP
// at all and every subscribe button is a dead click.
const easProfile = (process.env.EAS_BUILD_PROFILE || "").trim();
const isProductionBuild =
  easProfile === "expo-production" || easProfile === "production";
if (isProductionBuild && !runtimeRevenueCatIosKey) {
  throw new Error(
    "EXPO_PUBLIC_REVENUECAT_IOS_KEY is not set. Production builds need " +
      "the live RevenueCat iOS key — configure it with `eas env:create` " +
      "or in apps/mobile/.env before running `eas build`. Aborting.",
  );
}
if (isProductionBuild && runtimeRevenueCatIosKey.startsWith("test_")) {
  throw new Error(
    "EXPO_PUBLIC_REVENUECAT_IOS_KEY looks like a test key (starts with " +
      "'test_'). Production builds must use a live key (appl_* prefix). " +
      "Aborting.",
  );
}
const posthogProjectToken = (process.env.POSTHOG_PROJECT_TOKEN || "").trim();
const posthogHost = (
  process.env.POSTHOG_HOST || "https://eu.i.posthog.com"
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
      eas: {
        projectId: EAS_PROJECT_ID,
      },
      runtimeSupabaseUrl,
      runtimeSupabaseAnonKey,
      ...(runtimeSupabaseUrl ? { EXPO_PUBLIC_SUPABASE_URL: runtimeSupabaseUrl } : {}),
      ...(runtimeSupabaseAnonKey
        ? { EXPO_PUBLIC_SUPABASE_ANON_KEY: runtimeSupabaseAnonKey }
        : {}),
      ...(runtimeRevenueCatIosKey
        ? { EXPO_PUBLIC_REVENUECAT_IOS_KEY: runtimeRevenueCatIosKey }
        : {}),
      posthogProjectToken,
      posthogHost,
    },
  },
};
