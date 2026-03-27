import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Minimal storage contract for Supabase Auth (works with AsyncStorage on RN). */
export type MaakAuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/**
 * Shared Supabase browser/RN client factory.
 * Pass URL + anon key from env (Vite: import.meta.env / Expo: process.env.EXPO_PUBLIC_*).
 */
export function createMaakSupabaseClient(options: {
  url: string;
  anonKey: string;
  storage: MaakAuthStorage;
}): SupabaseClient {
  return createClient(options.url, options.anonKey, {
    auth: {
      storage: options.storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
