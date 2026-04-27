/// <reference types="https://deno.land/x/types/index.d.ts" />
/**
 * introduction-respond — one of the introduced users accepts or declines.
 *
 * When both users have accepted, we create a mutual match between them:
 * two rows in the `matches` table (bidirectional, one per direction), both
 * with status='mutual' and match_type='introduction'. This skips the
 * pending → liked → mutual lifecycle that normal matches go through, since
 * the host already curated the pair.
 *
 * Required columns on matches.Insert (verified via types.ts):
 *   user_id, matched_user_id, compatibility_score (NOT NULL)
 * Plus we set: status, match_type, match_date, personality_insight, a few
 * empty arrays so the match card in mobile doesn't hit null-deref crashes.
 *
 * Request:
 *   POST /functions/v1/introduction-respond
 *   Authorization: Bearer <user JWT>
 *   Body: { introduction_id: string, accept: boolean }
 *
 * Response codes:
 *   200 — { accepted_by_a, accepted_by_b, match_created }
 *   400 — missing fields / already responded
 *   401 — not authenticated
 *   403 — caller is not a participant in this introduction
 *   404 — introduction not found
 *   405 — wrong method
 *   500 — unexpected DB error
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { verifySupabaseJWT } from "../_shared/env.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Curated introductions get a round number rather than an algorithmic score.
// The match-daily function computes scores in the 50–95 range based on
// personality dimensions — 85 puts introductions near the top without
// claiming algorithmic precision they don't have.
const INTRODUCTION_COMPAT_SCORE = 85;

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

  const userId = await verifySupabaseJWT(req.headers.get("Authorization") ?? "");
  if (!userId) return json({ error: "Unauthorized" }, 401, corsHeaders);

  const body = await req.json().catch(() => ({}));
  const introductionId =
    typeof body?.introduction_id === "string" ? body.introduction_id : "";
  const accept = body?.accept === true; // strict — anything else is decline

  if (!UUID_RE.test(introductionId)) {
    return json({ error: "introduction_id required" }, 400, corsHeaders);
  }
  if (typeof body?.accept !== "boolean") {
    return json({ error: "accept (boolean) required" }, 400, corsHeaders);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Load the introduction row
  const { data: intro, error: loadError } = await supabase
    .from("introductions")
    .select(
      "id, host_user_id, user_a_id, user_b_id, accepted_by_a, accepted_by_b, match_created",
    )
    .eq("id", introductionId)
    .maybeSingle();
  if (loadError) {
    console.error("[introduction-respond] load error:", loadError);
    return json({ error: "Failed to load introduction" }, 500, corsHeaders);
  }
  if (!intro) return json({ error: "Introduction not found" }, 404, corsHeaders);

  // Which side is the caller on?
  const isUserA = intro.user_a_id === userId;
  const isUserB = intro.user_b_id === userId;
  if (!isUserA && !isUserB) {
    return json({ error: "Not a participant" }, 403, corsHeaders);
  }
  if (intro.match_created) {
    return json(
      { error: "Introduction already completed" },
      409,
      corsHeaders,
    );
  }
  const callerFlag = isUserA ? intro.accepted_by_a : intro.accepted_by_b;
  if (callerFlag !== null) {
    return json({ error: "Already responded" }, 400, corsHeaders);
  }

  // Write the accept/decline flag
  const update = isUserA
    ? { accepted_by_a: accept }
    : { accepted_by_b: accept };
  const { data: updated, error: updateError } = await supabase
    .from("introductions")
    .update(update)
    .eq("id", introductionId)
    .select(
      "accepted_by_a, accepted_by_b, user_a_id, user_b_id, host_user_id, match_created",
    )
    .single();

  if (updateError || !updated) {
    console.error("[introduction-respond] update error:", updateError);
    return json({ error: "Failed to update introduction" }, 500, corsHeaders);
  }

  // Mutual-accept path: both flags are now true → create the match rows
  let matchCreated = updated.match_created;
  if (
    !matchCreated &&
    updated.accepted_by_a === true &&
    updated.accepted_by_b === true
  ) {
    const ok = await createMutualMatch(supabase, {
      userAId: updated.user_a_id,
      userBId: updated.user_b_id,
      hostUserId: updated.host_user_id,
    });
    if (ok) {
      matchCreated = true;
      // Mark the introduction as resolved so a re-run is a no-op.
      const { error: flagError } = await supabase
        .from("introductions")
        .update({ match_created: true })
        .eq("id", introductionId);
      if (flagError) {
        console.error(
          "[introduction-respond] flag update error (match still created):",
          flagError,
        );
      }
    }
  }

  return json(
    {
      accepted_by_a: updated.accepted_by_a,
      accepted_by_b: updated.accepted_by_b,
      match_created: matchCreated,
    },
    200,
    corsHeaders,
  );
});

async function createMutualMatch(
  supabase: SupabaseClient,
  args: { userAId: string; userBId: string; hostUserId: string },
): Promise<boolean> {
  const { userAId, userBId, hostUserId } = args;

  // Look up the host's display name for the default personality_insight text.
  // Non-fatal if the lookup fails — we fall back to a generic line.
  let hostName = "En Värd";
  {
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", hostUserId)
      .maybeSingle();
    if (hostProfile?.display_name) hostName = hostProfile.display_name;
  }
  const insight = `${hostName} ville att ni skulle pratas vid.`;

  // match_date is a DATE column in the matches schema. Use today in UTC.
  const today = new Date().toISOString().slice(0, 10);

  const baseRow = {
    match_type: "introduction",
    match_score: null,
    match_date: today,
    status: "mutual",
    compatibility_score: INTRODUCTION_COMPAT_SCORE,
    dimension_breakdown: [],
    archetype_score: null,
    anxiety_reduction_score: null,
    icebreakers: null,
    personality_insight: insight,
    photo_urls: [],
    common_interests: [],
  };

  // Two rows, one per direction. Unique constraint on
  // (user_id, matched_user_id, match_date) — upsert handles the edge case
  // where the daily algo already produced a row between these users today.
  const rows = [
    { ...baseRow, user_id: userAId, matched_user_id: userBId },
    { ...baseRow, user_id: userBId, matched_user_id: userAId },
  ];

  const { error: upsertError } = await supabase
    .from("matches")
    .upsert(rows, {
      onConflict: "user_id,matched_user_id",
      ignoreDuplicates: false,
    });

  if (upsertError) {
    console.error("[introduction-respond] match upsert error:", upsertError);
    return false;
  }
  return true;
}
