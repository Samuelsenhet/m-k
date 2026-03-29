/**
 * Supabase Edge Function shared env helpers.
 *
 * verifySupabaseJWT: resolves the user id via GoTrue using SUPABASE_URL +
 * SUPABASE_ANON_KEY (both auto-injected on deploy). This supports HS256 legacy
 * JWTs and asymmetric (e.g. ES256) signing keys. Manual HS256-only verification
 * with SUPABASE_JWT_SECRET fails for ES256 tokens and caused 401 after JWT
 * migration.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveCorsAllowOrigin } from "./cors.ts";

function corsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveCorsAllowOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

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
        headers: { ...corsHeaders(_req), "Content-Type": "application/json" },
      }
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Verify the caller's Bearer token with GoTrue and return the user's id.
 * Uses anon key + forwarded Authorization (not service role).
 *
 * Optional `supabaseUrl` / `supabaseAnonKey` avoid re-reading env when the
 * caller already validated them via getSupabaseEnv.
 */
export async function verifySupabaseJWT(
  authHeader: string,
  supabaseUrl?: string,
  supabaseAnonKey?: string
): Promise<string | null> {
  const raw = authHeader.trim();
  if (!raw) return null;

  const url = (supabaseUrl ?? Deno.env.get("SUPABASE_URL") ?? "").trim();
  const anon = (supabaseAnonKey ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();
  if (!url || !anon) {
    console.warn("[auth] SUPABASE_URL or SUPABASE_ANON_KEY missing – cannot verify session");
    return null;
  }

  const authorization = raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;

  try {
    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      if (error) console.warn("[auth] getUser failed:", error.message);
      return null;
    }
    return user.id;
  } catch (e) {
    console.warn("[auth] getUser error:", e);
    return null;
  }
}
