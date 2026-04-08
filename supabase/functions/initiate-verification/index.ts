/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { getSupabaseEnv, verifySupabaseJWT } from "../_shared/env.ts";

/**
 * Initiate selfie verification.
 * - Saves selfie_path on the user's profile
 * - Sets id_verification_status = 'pending'
 * - In production: would create an applicant with Onfido/Jumio
 * - The existing id-verification-webhook handles the callback
 */
serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405,
    });
  }

  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv();
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  const payload = await verifySupabaseJWT(jwt);
  if (!payload?.sub) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
    });
  }
  const userId = payload.sub as string;

  let selfiePath: string | undefined;
  try {
    const body = await req.json();
    selfiePath = body?.selfiePath;
  } catch { /* ignore */ }

  if (!selfiePath) {
    return new Response(JSON.stringify({ error: "selfiePath required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Update profile with selfie path and set status to pending
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      selfie_path: selfiePath,
      id_verification_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateErr) {
    console.error("initiate-verification: update failed", updateErr);
    return new Response(JSON.stringify({ error: "Failed to update profile" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }

  // --- PRODUCTION ID VERIFICATION (not yet integrated) ---
  //
  // To enable real identity verification, integrate one of:
  //   - Onfido (https://documentation.onfido.com/)
  //   - Jumio (https://docs.jumio.com/)
  //   - Persona (https://docs.withpersona.com/)
  //
  // Steps:
  //   1. Set ONFIDO_API_TOKEN (or equivalent) as a Supabase secret
  //   2. Create an applicant via POST /v3.6/applicants
  //   3. Create a check with document + selfie reports
  //   4. Return the SDK token to the client for native capture
  //   5. Handle webhook callback in id-verification-webhook function
  //      to set id_verification_status = 'approved' | 'rejected'
  //
  // Until integrated, selfie is stored and status stays 'pending'
  // for manual review by moderators via admin panel.
  // ---

  return new Response(
    JSON.stringify({
      status: "pending",
      message: "Verification initiated — pending manual review",
      requires_integration: true,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
