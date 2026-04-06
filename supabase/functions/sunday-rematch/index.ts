/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { getSupabaseEnv, verifySupabaseJWT } from "../_shared/env.ts";

/**
 * Sunday Rematch — paid subscribers only.
 *
 * Every Sunday (Europe/Stockholm timezone) this function returns all matches
 * from the past 7 days that the user has NOT chatted with (zero messages).
 * Available for 24 hours (Sunday 00:00–23:59 CET).
 *
 * Matches the user IS chatting with (≥1 message) are excluded — those are
 * already active conversations.
 */

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

  // Verify JWT
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

  // Check if today is Sunday (Europe/Stockholm)
  const now = new Date();
  const stockholmDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Europe/Stockholm",
  }).format(now);

  if (stockholmDay !== "Sunday") {
    return new Response(
      JSON.stringify({
        sunday: false,
        matches: [],
        message: "Sunday Rematch is only available on Sundays",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  // Check subscription
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("plan_type, status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  let isPaid = false;
  if (subRow && subRow.status === "active") {
    const notExpired =
      !subRow.expires_at || new Date(subRow.expires_at) > now;
    const plan = subRow.plan_type as string;
    isPaid =
      notExpired &&
      (plan === "basic" || plan === "plus" || plan === "premium" || plan === "vip");
  }

  if (!isPaid) {
    return new Response(
      JSON.stringify({
        sunday: true,
        matches: [],
        requires_subscription: true,
        message: "Sunday Rematch requires a subscription",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  // Calculate 7 days ago in Stockholm timezone
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  // Find all matches from the past 7 days where the user is a participant
  const { data: weekMatches, error: matchErr } = await supabase
    .from("matches")
    .select("id, user_id, matched_user_id, created_at, compatibility_score")
    .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
    .gte("created_at", sevenDaysAgoIso)
    .order("created_at", { ascending: false });

  if (matchErr) {
    console.error("sunday-rematch: matches query failed", matchErr);
    return new Response(JSON.stringify({ error: "Failed to fetch matches" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  if (!weekMatches || weekMatches.length === 0) {
    return new Response(
      JSON.stringify({ sunday: true, matches: [], message: "No matches from this week" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  const matchIds = weekMatches.map((m) => m.id);

  // Find which matches have messages (= active conversations)
  const { data: matchesWithMessages } = await supabase
    .from("messages")
    .select("match_id")
    .in("match_id", matchIds);

  const chattedMatchIds = new Set(
    (matchesWithMessages ?? []).map((m) => m.match_id),
  );

  // Filter to only un-chatted matches
  const unChattedMatches = weekMatches.filter(
    (m) => !chattedMatchIds.has(m.id),
  );

  if (unChattedMatches.length === 0) {
    return new Response(
      JSON.stringify({
        sunday: true,
        matches: [],
        message: "You've chatted with all your matches this week!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  // Fetch profiles for the matched users
  const matchedUserIds = unChattedMatches.map((m) =>
    m.user_id === userId ? m.matched_user_id : m.user_id,
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, date_of_birth, archetype, photos, bio, hometown",
    )
    .in("id", matchedUserIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  // Build response matching the match-daily format
  const sundayMatches = unChattedMatches.map((m) => {
    const otherUserId =
      m.user_id === userId ? m.matched_user_id : m.user_id;
    const profile = profileMap.get(otherUserId);
    return {
      id: m.id,
      matchedUserId: otherUserId,
      displayName: profile?.display_name ?? "",
      avatarUrl: profile?.avatar_url ?? null,
      photos: profile?.photos ?? [],
      archetype: profile?.archetype ?? null,
      bio: profile?.bio ?? null,
      hometown: profile?.hometown ?? null,
      compatibilityScore: m.compatibility_score,
      createdAt: m.created_at,
    };
  });

  return new Response(
    JSON.stringify({
      sunday: true,
      matches: sundayMatches,
      count: sundayMatches.length,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
