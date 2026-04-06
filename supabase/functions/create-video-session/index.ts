/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { getSupabaseEnv, verifySupabaseJWT } from "../_shared/env.ts";

/**
 * Create a video session (Kemi-Check).
 *
 * - Validates JWT auth
 * - Checks subscription: free users limited to 1 call/day (Stockholm timezone)
 * - Paid users: unlimited
 * - Returns { allowed, sessionId } or { allowed: false, reason }
 */

const FREE_DAILY_MAX = 1;

function stockholmDayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Stockholm" });
}

function stockholmDayStartIso(dayKey: string): string {
  return new Date(`${dayKey}T00:00:00+01:00`).toISOString();
}

serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv();

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  const payload = await verifySupabaseJWT(jwt);
  if (!payload?.sub) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }
  const userId = payload.sub as string;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Parse matchId from body
  let matchId: string | undefined;
  try {
    const body = await req.json();
    matchId = body?.matchId;
  } catch {
    // ignore
  }
  if (!matchId) {
    return new Response(JSON.stringify({ error: "matchId required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Check subscription
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("plan_type, status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  let isPaid = false;
  if (subRow && subRow.status === "active") {
    const notExpired = !subRow.expires_at || new Date(subRow.expires_at) > new Date();
    const plan = subRow.plan_type as string;
    isPaid = notExpired && (plan === "basic" || plan === "plus" || plan === "premium" || plan === "vip");
  }

  // Rate limit for free users
  if (!isPaid) {
    const dayKey = stockholmDayKey();
    const dayStart = stockholmDayStartIso(dayKey);
    const rateKey = `user:${userId}:video_call:free_daily`;

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "try_consume_rate_limit",
      { p_key: rateKey, p_window_start: dayStart, p_max: FREE_DAILY_MAX },
    );

    if (rpcError) {
      console.error("create-video-session: rate limit RPC failed", rpcError);
      return new Response(JSON.stringify({ error: "Rate limit check failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const allowed = (rpcResult as { allowed?: boolean })?.allowed ?? false;
    if (!allowed) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "daily_limit",
          message: "Du har redan använt din dagliga Kemi-Check. Uppgradera för obegränsat.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }
  }

  // Session ID = matchId (the Realtime channel uses this)
  return new Response(
    JSON.stringify({
      allowed: true,
      sessionId: matchId,
      matchId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
