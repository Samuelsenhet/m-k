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

  const envResult = getSupabaseEnv(req);
  if (envResult instanceof Response) return envResult;
  const { supabaseUrl, supabaseAnonKey } = envResult;

  const authHeader = req.headers.get("Authorization") ?? "";
  const userId = await verifySupabaseJWT(authHeader, supabaseUrl, supabaseAnonKey);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401,
    });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 },
    );
  }

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

  // LAUNCH MODE
  //
  // Real ID verification (Onfido / Jumio / Persona) is not yet integrated.
  // Until a provider is wired up we have two modes:
  //
  //   VERIFICATION_LAUNCH_AUTO_APPROVE=true  (default for v1 launch)
  //     → store the selfie and set status directly to 'approved'.
  //       The verified badge is shown, users aren't stuck in a queue.
  //       Trade-off: trust signal is weaker until a real provider lands.
  //
  //   VERIFICATION_LAUNCH_AUTO_APPROVE=false (post-launch, once Onfido is live)
  //     → store the selfie and set status to 'pending'.
  //       id-verification-webhook finalises the status.
  //
  // Flip the secret with `supabase secrets set` to change modes without
  // redeploying code.
  const autoApprove =
    (Deno.env.get("VERIFICATION_LAUNCH_AUTO_APPROVE") ?? "true").toLowerCase() !==
    "false";
  const newStatus = autoApprove ? "approved" : "pending";

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      selfie_path: selfiePath,
      id_verification_status: newStatus,
      ...(autoApprove ? { id_verified_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateErr) {
    console.error("initiate-verification: update failed", updateErr);
    return new Response(JSON.stringify({ error: "Failed to update profile" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }

  // --- POST-LAUNCH TODO: integrate real ID verification ---
  //
  // To move off launch-mode auto-approve, integrate one of:
  //   - Onfido (https://documentation.onfido.com/)
  //   - Jumio (https://docs.jumio.com/)
  //   - Persona (https://docs.withpersona.com/)
  //
  // Steps:
  //   1. Set ONFIDO_API_TOKEN (or equivalent) as a Supabase secret
  //   2. Create an applicant via POST /v3.6/applicants with the selfie
  //   3. Create a check with document + selfie reports
  //   4. Return the SDK token to the client for native capture
  //   5. Handle the webhook callback in id-verification-webhook to set
  //      status to 'approved' or 'rejected'
  //   6. supabase secrets set VERIFICATION_LAUNCH_AUTO_APPROVE=false
  // ---

  return new Response(
    JSON.stringify({
      status: newStatus,
      message: autoApprove
        ? "Verification approved."
        : "Verification initiated — pending review",
      auto_approved: autoApprove,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
