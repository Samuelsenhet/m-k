/**
 * Fail-fast if SUPABASE_URL or SUPABASE_ANON_KEY are not set.
 * Returns a 503 Response with clear instructions, or the env values for createClient.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const MISSING_SECRETS_MESSAGE =
  "SUPABASE_URL or SUPABASE_ANON_KEY is not set. Set Edge Function Secrets in Dashboard (Edge Functions → Secrets) or run: supabase secrets set SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key> then redeploy.";

export function getSupabaseEnv(
  _req: Request
): Response | { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const supabaseAnonKey = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: MISSING_SECRETS_MESSAGE }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}
