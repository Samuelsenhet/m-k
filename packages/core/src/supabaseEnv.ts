/**
 * Parse Supabase URL + anon key from Vite (`VITE_*`) or Expo (`EXPO_PUBLIC_*`) env.
 */
export type MaakSupabaseEnv = {
  url: string;
  anonKey: string;
  isValid: boolean;
};

export function parseMaakSupabaseEnv(
  env: Record<string, string | undefined | null>,
): MaakSupabaseEnv {
  let url = (
    env.VITE_SUPABASE_URL ||
    env.EXPO_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();
  const projectId = (
    env.VITE_SUPABASE_PROJECT_ID ||
    env.EXPO_PUBLIC_SUPABASE_PROJECT_ID ||
    ""
  ).trim();
  const anon = (
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();

  if (
    (!url || url.includes("your_project") || url.includes("placeholder")) &&
    projectId &&
    !projectId.includes("your_project") &&
    !projectId.includes("placeholder")
  ) {
    url = `https://${projectId}.supabase.co`;
  }

  const isValidUrl =
    !!url &&
    url.startsWith("https://") &&
    url.includes(".supabase.co") &&
    !url.includes("your_project") &&
    !url.includes("placeholder");

  const isValidKey =
    !!anon &&
    anon.length > 20 &&
    !anon.includes("your_anon") &&
    !anon.includes("your-anon") &&
    !anon.includes("placeholder");

  return {
    url: isValidUrl ? url : "",
    anonKey: isValidKey ? anon : "",
    isValid: isValidUrl && isValidKey,
  };
}
