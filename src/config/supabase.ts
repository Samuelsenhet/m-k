/**
 * Central Supabase + Demo config (single source of truth for UI and feature flags).
 * Use hasValidSupabaseConfig from @/integrations/supabase/client for actual auth readiness.
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_KEY &&
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("your_project") &&
    !SUPABASE_URL.includes("placeholder") &&
    SUPABASE_KEY.length > 20 &&
    !SUPABASE_KEY.includes("your_anon") &&
    !SUPABASE_KEY.includes("placeholder")
);

/** Demo mode is opt-in via VITE_ENABLE_DEMO=true. When false, no Demo UI in main app. */
const _isDemoEnabled = import.meta.env.VITE_ENABLE_DEMO === "true";
if (import.meta.env.PROD && _isDemoEnabled) {
  throw new Error("Demo must not be enabled in production. Set VITE_ENABLE_DEMO=false.");
}
export const isDemoEnabled = _isDemoEnabled;
