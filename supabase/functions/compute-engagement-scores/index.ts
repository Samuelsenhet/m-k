/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * compute-engagement-scores
 *
 * Runs daily (after match-daily). Scans recent matches, computes engagement
 * metrics from the messages table, and updates match_engagement_scores +
 * user_match_preferences. These learned weights feed into generate-match-pools
 * for personalized scoring.
 *
 * Deploy: supabase functions deploy compute-engagement-scores --no-verify-jwt
 * Trigger: cron via pg_cron or external scheduler (00:30 CET daily).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Outcome = "pending" | "chatted" | "engaged" | "deep" | "passed" | "expired";

function classifyOutcome(
  messageCount: number,
  conversationHours: number,
  matchStatus: string,
): Outcome {
  if (matchStatus === "passed") return "passed";
  if (matchStatus === "expired" || matchStatus === "expired_no_intro") return "expired";
  if (messageCount === 0) return "pending";
  if (messageCount >= 20 || conversationHours >= 24) return "deep";
  if (messageCount >= 5) return "engaged";
  return "chatted";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Get all matches from last 7 days that need scoring.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentMatches, error: matchErr } = await supabase
      .from("matches")
      .select("id, user_id, matched_user_id, status, created_at")
      .gte("created_at", sevenDaysAgo);

    if (matchErr) throw matchErr;
    if (!recentMatches?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const matchIds = recentMatches.map((m) => m.id);

    // 2. Get message stats per match.
    const { data: messageStats } = await supabase
      .from("messages")
      .select("match_id, sender_id, created_at")
      .in("match_id", matchIds)
      .order("created_at", { ascending: true });

    // Build per-match message aggregates.
    const msgByMatch = new Map<string, { senderId: string; createdAt: string }[]>();
    for (const msg of messageStats ?? []) {
      const arr = msgByMatch.get(msg.match_id) ?? [];
      arr.push({ senderId: msg.sender_id, createdAt: msg.created_at });
      msgByMatch.set(msg.match_id, arr);
    }

    // 3. Compute engagement scores for each user-match pair.
    const engagementRows: Record<string, unknown>[] = [];
    const userOutcomes = new Map<string, { total: number; engaged: number; deep: number }>();

    for (const match of recentMatches) {
      const msgs = msgByMatch.get(match.id) ?? [];
      const userMsgs = msgs.filter((m) => m.senderId === match.user_id);
      const matchedMsgs = msgs.filter((m) => m.senderId === match.matched_user_id);

      // Conversation duration
      let durationHours = 0;
      if (msgs.length >= 2) {
        const first = new Date(msgs[0].createdAt).getTime();
        const last = new Date(msgs[msgs.length - 1].createdAt).getTime();
        durationHours = (last - first) / (1000 * 60 * 60);
      }

      // Average response time (user's perspective)
      let avgResponseMinutes: number | null = null;
      if (userMsgs.length > 0 && matchedMsgs.length > 0) {
        const responseTimes: number[] = [];
        for (const received of matchedMsgs) {
          const receivedAt = new Date(received.createdAt).getTime();
          // Find next user message after this
          const nextReply = userMsgs.find(
            (m) => new Date(m.createdAt).getTime() > receivedAt,
          );
          if (nextReply) {
            responseTimes.push(
              (new Date(nextReply.createdAt).getTime() - receivedAt) / (1000 * 60),
            );
          }
        }
        if (responseTimes.length > 0) {
          avgResponseMinutes =
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        }
      }

      const outcome = classifyOutcome(msgs.length, durationHours, match.status);

      // Score for user_id side
      engagementRows.push({
        user_id: match.user_id,
        matched_user_id: match.matched_user_id,
        match_id: match.id,
        messages_sent: userMsgs.length,
        messages_received: matchedMsgs.length,
        avg_response_time_minutes: avgResponseMinutes,
        conversation_duration_hours: durationHours,
        initiated_chat: userMsgs.length > 0 && (matchedMsgs.length === 0 || new Date(userMsgs[0].createdAt) < new Date(matchedMsgs[0].createdAt)),
        match_type: null, // filled from match pool data if available
        outcome,
        updated_at: new Date().toISOString(),
      });

      // Track user-level stats
      for (const uid of [match.user_id, match.matched_user_id]) {
        const stats = userOutcomes.get(uid) ?? { total: 0, engaged: 0, deep: 0 };
        stats.total++;
        if (outcome === "engaged" || outcome === "deep") stats.engaged++;
        if (outcome === "deep") stats.deep++;
        userOutcomes.set(uid, stats);
      }
    }

    // 4. Upsert engagement scores.
    if (engagementRows.length > 0) {
      const { error: upsertErr } = await supabase
        .from("match_engagement_scores")
        .upsert(engagementRows, { onConflict: "user_id,matched_user_id" });
      if (upsertErr) console.error("Engagement upsert error:", upsertErr);
    }

    // 5. Update user match preferences (learned weights).
    for (const [userId, stats] of userOutcomes) {
      const engageRate = stats.total > 0 ? stats.engaged / stats.total : 0;

      // Simple weight learning: if user engages more with certain match types,
      // adjust weights. More data = stronger signal.
      // For now: users with high engagement get slight boost to personality weight
      // (personality matching leads to deeper connections).
      const personalityWeight = stats.total >= 3
        ? 1.0 + (engageRate - 0.5) * 0.4 // Range: 0.8 - 1.2
        : 1.0;

      const { error: prefErr } = await supabase
        .from("user_match_preferences")
        .upsert(
          {
            user_id: userId,
            personality_weight: Math.max(0.6, Math.min(1.4, personalityWeight)),
            total_matches: stats.total,
            engaged_matches: stats.engaged,
            deep_matches: stats.deep,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      if (prefErr) console.error("Preference upsert error for", userId, prefErr);
    }

    return new Response(
      JSON.stringify({
        processed: recentMatches.length,
        engagementRows: engagementRows.length,
        usersUpdated: userOutcomes.size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("compute-engagement-scores error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
