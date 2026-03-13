/**
 * Central Supabase + Demo config (single source of truth for UI and feature flags).
 * Use hasValidSupabaseConfig from @/integrations/supabase/client for actual auth readiness.
 */

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

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

/** Demo mode is disabled in native app */
export const isDemoEnabled = false;
