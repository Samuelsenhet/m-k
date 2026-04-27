/// <reference types="https://deno.land/x/types/index.d.ts" />
/**
 * introduction-create — an active Värd introduces two of their matches.
 *
 * The host picks two people they have matched with (mutually) and sends a
 * short message. We verify:
 *   1. Caller is authenticated
 *   2. Caller's host_profiles row is status='active'
 *   3. Both targets are CURRENT matches of the host (via resolveMatchedPeerId)
 *   4. Body is well-formed (distinct users, neither is the host, message <=300)
 *
 * If an introduction between the same pair already exists (in either order)
 * AND hasn't been resolved yet (match_created = false), we return it
 * idempotently rather than rejecting — lets the mobile resume a stale flow.
 *
 * Request:
 *   POST /functions/v1/introduction-create
 *   Authorization: Bearer <host JWT>
 *   Body: { user_a_id: string, user_b_id: string, message?: string }
 *
 * Response codes:
 *   200 — { introduction_id, created_at, already_existed }
 *   400 — malformed body, same user, message too long
 *   401 — not authenticated
 *   403 — not an active Värd / either user is not a current match
 *   405 — wrong method
 *   409 — introduction already completed between these users
 *   500 — unexpected DB error
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { verifySupabaseJWT } from "../_shared/env.ts";
import { resolveMatchedPeerId } from "../_shared/match_peer.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req, "POST, OPTIONS");

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Server misconfigured" }, 503, corsHeaders);
  }

  // 1. Auth
  const hostUserId = await verifySupabaseJWT(req.headers.get("Authorization") ?? "");
  if (!hostUserId) return json({ error: "Unauthorized" }, 401, corsHeaders);

  // 2. Parse body
  const body = await req.json().catch(() => ({}));
  const userAId = typeof body?.user_a_id === "string" ? body.user_a_id : "";
  const userBId = typeof body?.user_b_id === "string" ? body.user_b_id : "";
  const rawMessage = typeof body?.message === "string" ? body.message.trim() : "";

  if (!UUID_RE.test(userAId) || !UUID_RE.test(userBId)) {
    return json({ error: "user_a_id and user_b_id required" }, 400, corsHeaders);
  }
  if (userAId === userBId) {
    return json({ error: "user_a and user_b must differ" }, 400, corsHeaders);
  }
  if (userAId === hostUserId || userBId === hostUserId) {
    return json(
      { error: "Cannot introduce yourself — pick two of your matches" },
      400,
      corsHeaders,
    );
  }
  if (rawMessage.length > 300) {
    return json({ error: "message too long (max 300 chars)" }, 400, corsHeaders);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 3. Host gate — must be active Värd.
  const { data: hostRow, error: hostError } = await supabase
    .from("host_profiles")
    .select("status")
    .eq("user_id", hostUserId)
    .maybeSingle();
  if (hostError) {
    console.error("[introduction-create] host lookup error:", hostError);
    return json({ error: "Failed to load host profile" }, 500, corsHeaders);
  }
  if (!hostRow || hostRow.status !== "active") {
    return json({ error: "Not an active Värd" }, 403, corsHeaders);
  }

  // 4. Match gate — both targets must be current matches of the host.
  const peerA = await resolveMatchedPeerId(supabase, hostUserId, userAId, undefined);
  if (!peerA) {
    return json(
      { error: "user_a is not a current match of the host" },
      403,
      corsHeaders,
    );
  }
  const peerB = await resolveMatchedPeerId(supabase, hostUserId, userBId, undefined);
  if (!peerB) {
    return json(
      { error: "user_b is not a current match of the host" },
      403,
      corsHeaders,
    );
  }

  // 5. Dedup — did this host already introduce these two? Check both orderings.
  const { data: existing, error: dedupError } = await supabase
    .from("introductions")
    .select("id, created_at, match_created")
    .eq("host_user_id", hostUserId)
    .or(
      `and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),` +
        `and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`,
    )
    .limit(1)
    .maybeSingle();
  if (dedupError && dedupError.code !== "PGRST116") {
    // PGRST116 = "no rows" which is fine here.
    console.error("[introduction-create] dedup error:", dedupError);
    return json({ error: "Failed to check existing" }, 500, corsHeaders);
  }
  if (existing) {
    if (existing.match_created) {
      return json(
        { error: "Introduction already completed for these users" },
        409,
        corsHeaders,
      );
    }
    // Still pending — idempotently return the existing row.
    return json(
      {
        introduction_id: existing.id,
        created_at: existing.created_at,
        already_existed: true,
      },
      200,
      corsHeaders,
    );
  }

  // 6. Create row. The migration enforces host != users and user_a != user_b
  // at the DB level, so we get defence-in-depth.
  const { data: inserted, error: insertError } = await supabase
    .from("introductions")
    .insert({
      host_user_id: hostUserId,
      user_a_id: userAId,
      user_b_id: userBId,
      message: rawMessage || null,
      accepted_by_a: null,
      accepted_by_b: null,
      match_created: false,
    })
    .select("id, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("[introduction-create] insert error:", insertError);
    return json({ error: "Failed to create introduction" }, 500, corsHeaders);
  }

  return json(
    {
      introduction_id: inserted.id,
      created_at: inserted.created_at,
      already_existed: false,
    },
    200,
    corsHeaders,
  );
});
