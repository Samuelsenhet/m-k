/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { getSupabaseEnv, verifySupabaseJWT } from "../_shared/env.ts";

/**
 * Moderator-only endpoint for approving/rejecting pending identity
 * verifications. Used by the AdminVerificationsRN screen.
 *
 * Caller auth: JWT (verified internally via GoTrue) + membership in
 * public.moderator_roles. Writes go through service_role so we can
 * keep profiles-UPDATE RLS tight (only self-updates allowed from user
 * sessions), with this edge function as the only moderator write path.
 *
 * Audit trail: each decision is inserted into public.webhook_events
 * with event_type='moderation_verification' so the moderation log is
 * visible in one place next to RevenueCat webhooks.
 */
serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const envResult = getSupabaseEnv(req);
  if (envResult instanceof Response) return envResult;
  const { supabaseUrl, supabaseAnonKey } = envResult;

  const authHeader = req.headers.get("Authorization") ?? "";
  const callerId = await verifySupabaseJWT(authHeader, supabaseUrl, supabaseAnonKey);
  if (!callerId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 },
    );
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Moderator check — must have a row in public.moderator_roles.
  const { data: modRow } = await supabase
    .from("moderator_roles")
    .select("user_id")
    .eq("user_id", callerId)
    .maybeSingle();
  if (!modRow) {
    return new Response(JSON.stringify({ error: "Not a moderator" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  // Parse body.
  let targetUserId: string | undefined;
  let decision: "approved" | "rejected" | undefined;
  let notes: string | undefined;
  try {
    const body = await req.json();
    targetUserId = typeof body?.targetUserId === "string" ? body.targetUserId : undefined;
    decision = body?.decision === "approved" || body?.decision === "rejected"
      ? body.decision
      : undefined;
    notes = typeof body?.notes === "string" ? body.notes : undefined;
  } catch { /* ignore */ }

  if (!targetUserId || !decision) {
    return new Response(
      JSON.stringify({ error: "targetUserId and decision ('approved'|'rejected') required" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }

  // Update profile. Match on id OR user_id — the schema has both keys and
  // different rows use different conventions.
  const nowIso = new Date().toISOString();
  const updatePatch: Record<string, string | null> = {
    id_verification_status: decision,
    updated_at: nowIso,
  };
  if (decision === "approved") {
    updatePatch.id_verified_at = nowIso;
  } else {
    updatePatch.id_verified_at = null;
  }

  const { data: updated, error: updateErr } = await supabase
    .from("profiles")
    .update(updatePatch)
    .or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`)
    .select("id, id_verification_status, id_verified_at");

  if (updateErr) {
    console.error("moderate-verification: update failed", updateErr);
    return new Response(
      JSON.stringify({ error: "Failed to update profile", detail: updateErr.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
  if (!updated || updated.length === 0) {
    return new Response(
      JSON.stringify({ error: "Target profile not found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
    );
  }

  // Audit trail — record the decision in webhook_events.
  await supabase.from("webhook_events").insert({
    event_id: `moderation:${callerId}:${targetUserId}:${nowIso}`,
    event_type: "moderation_verification",
    user_id: callerId,
    payload: {
      target_user_id: targetUserId,
      decision,
      notes: notes ?? null,
    },
    status: "processed",
  });

  return new Response(
    JSON.stringify({
      status: decision,
      target_user_id: targetUserId,
      moderator_id: callerId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
