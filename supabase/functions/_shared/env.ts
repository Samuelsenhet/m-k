/**
 * Supabase Edge Function shared env helpers.
 *
 * verifySupabaseJWT: verifies the user's JWT locally using SUPABASE_JWT_SECRET
 * (always auto-injected correctly by Supabase). This avoids depending on
 * SUPABASE_URL being correctly set for auth validation, which was the root
 * cause of 401 errors when SUPABASE_URL was manually set to a wrong/stale value.
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

/**
 * Verify a Supabase user JWT using SUPABASE_JWT_SECRET (HS256).
 * Returns the user's UUID (sub claim) on success, null on failure.
 *
 * This is preferred over createClient.auth.getUser() because it does not
 * depend on SUPABASE_URL being correctly configured — the JWT secret is
 * always auto-injected by the Supabase runtime.
 */
export async function verifySupabaseJWT(authHeader: string): Promise<string | null> {
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) return null;

  const secret = Deno.env.get("SUPABASE_JWT_SECRET");
  if (!secret) {
    console.warn("[auth] SUPABASE_JWT_SECRET not set – cannot verify JWT locally");
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;

    // base64url → Uint8Array
    const b64decode = (s: string) =>
      Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64decode(sig),
      new TextEncoder().encode(`${header}.${payload}`)
    );

    if (!valid) {
      console.warn("[auth] JWT signature invalid");
      return null;
    }

    const data = JSON.parse(new TextDecoder().decode(b64decode(payload)));

    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      console.warn("[auth] JWT expired");
      return null;
    }

    return (data.sub as string) ?? null;
  } catch (e) {
    console.warn("[auth] JWT verification error:", e);
    return null;
  }
}
