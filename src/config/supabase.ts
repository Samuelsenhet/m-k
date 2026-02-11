/**
 * Centralized Supabase config check. Use this to avoid calling Supabase when
 * .env is missing or invalid (prevents 401 / "Error fetching matches" in console).
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

const validUrl =
  SUPABASE_URL &&
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_URL.includes(".supabase.co") &&
  !SUPABASE_URL.includes("your_project") &&
  !SUPABASE_URL.includes("placeholder");

const validKey =
  SUPABASE_KEY &&
  SUPABASE_KEY.length > 20 &&
  !SUPABASE_KEY.includes("your_anon") &&
  !SUPABASE_KEY.includes("your-anon") &&
  !SUPABASE_KEY.includes("placeholder");

export const isSupabaseConfigured = Boolean(validUrl && validKey);

/** Demo mode: when true, demo routes are shown. Default false for production. */
export const isDemoEnabled = import.meta.env.VITE_DEMO_ENABLED === "true";

/** Collections (Samlingar) feature flag. Set to "false" to hide. Default true. */
export const isCollectionsEnabled = import.meta.env.VITE_ENABLE_COLLECTIONS !== "false";

/**
 * Group video / Kemi-Check feature flag. Set to "false" to disable without redeploy. Default true.
 * Rule: 1:1 video – match creator can start. Group video (when implemented): only samling creator
 * can start; any member may join once a group video is active.
 */
export const isGroupVideoEnabled = import.meta.env.VITE_ENABLE_GROUP_VIDEO !== "false";
