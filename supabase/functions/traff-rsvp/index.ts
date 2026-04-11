/// <reference types="https://deno.land/x/types/index.d.ts" />
/**
 * träff-rsvp — RSVP handling for Värdar (Hosts) program Träffar.
 *
 * The user RSVPs to a träff. When the RSVP count hits min_confirm_attendees,
 * the träff auto-flips from 'open' to 'confirmed'. Also supports un-RSVPing
 * via `{ action: "cancel" }` in the body.
 *
 * Why one function for both verbs: keeping them together means the mobile
 * client has one endpoint and cancel can reuse the same validation + count
 * path. A classic REST DELETE wouldn't buy us much here.
 *
 * Request:
 *   POST /functions/v1/träff-rsvp
 *   Authorization: Bearer <user JWT>
 *   Body: { träff_id: string, action?: "rsvp" | "cancel" }  // default "rsvp"
 *
 * Response codes:
 *   200 ok — { status, rsvp_count, träff_status }
 *   400   — missing/invalid träff_id, träff already started/done, träff full
 *   401   — not authenticated
 *   404   — träff not found (or not visible to this user per RLS)
 *   405   — wrong method
 *   409   — already rsvped (on rsvp) / not rsvped (on cancel)
 *   500   — unexpected DB error
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";
import { verifySupabaseJWT } from "../_shared/env.ts";

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
  const userId = await verifySupabaseJWT(req.headers.get("Authorization") ?? "");
  if (!userId) return json({ error: "Unauthorized" }, 401, corsHeaders);

  // 2. Parse body
  const body = await req.json().catch(() => ({}));
  const träffId = typeof body?.träff_id === "string" ? body.träff_id : "";
  const action: "rsvp" | "cancel" = body?.action === "cancel" ? "cancel" : "rsvp";
  if (!UUID_RE.test(träffId)) {
    return json({ error: "träff_id required" }, 400, corsHeaders);
  }

  // 3. Service-role client — bypasses RLS so we can load the träff row even
  // before the user RSVPs (RLS policy requires open/confirmed + future start).
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 4. Load the träff
  const { data: träff, error: loadError } = await supabase
    .from("träffar")
    .select(
      "id, host_user_id, status, starts_at, max_attendees, min_confirm_attendees",
    )
    .eq("id", träffId)
    .maybeSingle();

  if (loadError) {
    console.error("[träff-rsvp] load error:", loadError);
    return json({ error: "Failed to load träff" }, 500, corsHeaders);
  }
  if (!träff) return json({ error: "Träff not found" }, 404, corsHeaders);

  // Gate: can't join past or cancelled/done/draft träffar
  if (träff.status !== "open" && träff.status !== "confirmed") {
    return json(
      { error: `Träff is ${träff.status}, cannot RSVP` },
      400,
      corsHeaders,
    );
  }
  if (new Date(träff.starts_at).getTime() <= Date.now()) {
    return json({ error: "Träff has already started" }, 400, corsHeaders);
  }

  // ── CANCEL path ─────────────────────────────────────────────────────────
  if (action === "cancel") {
    const { error: delError, count } = await supabase
      .from("träff_rsvps")
      .delete({ count: "exact" })
      .eq("träff_id", träffId)
      .eq("user_id", userId);
    if (delError) {
      console.error("[träff-rsvp] delete error:", delError);
      return json({ error: "Failed to cancel RSVP" }, 500, corsHeaders);
    }
    if (!count) {
      return json({ error: "Not RSVPed" }, 409, corsHeaders);
    }

    const rsvpCount = await countRsvps(supabase, träffId);
    return json(
      { status: "cancelled", rsvp_count: rsvpCount, träff_status: träff.status },
      200,
      corsHeaders,
    );
  }

  // ── RSVP path ───────────────────────────────────────────────────────────
  // Capacity check (RLS can't enforce count < max, so we do it here).
  const currentCount = await countRsvps(supabase, träffId);
  if (currentCount >= träff.max_attendees) {
    return json({ error: "Träff is full" }, 400, corsHeaders);
  }

  const { error: insertError } = await supabase
    .from("träff_rsvps")
    .insert({ träff_id: träffId, user_id: userId });

  if (insertError) {
    // Unique violation → already rsvped
    // PostgREST error for PK/unique duplicate has code '23505'.
    const code = (insertError as { code?: string }).code;
    if (code === "23505") {
      return json({ error: "Already RSVPed" }, 409, corsHeaders);
    }
    console.error("[träff-rsvp] insert error:", insertError);
    return json({ error: "Failed to RSVP" }, 500, corsHeaders);
  }

  const newCount = currentCount + 1;
  let newStatus: string = träff.status;

  // If we just reached the min confirm threshold and träff is still open,
  // flip it to confirmed so the host and other RSVPers know it's a go.
  if (träff.status === "open" && newCount >= träff.min_confirm_attendees) {
    const { error: updateError } = await supabase
      .from("träffar")
      .update({ status: "confirmed" })
      .eq("id", träffId)
      .eq("status", "open"); // conditional update — race-safe
    if (updateError) {
      console.error("[träff-rsvp] confirm update error:", updateError);
      // Not fatal — the RSVP still succeeded. Return status without flip.
    } else {
      newStatus = "confirmed";
    }
  }

  return json(
    {
      status: newStatus === "confirmed" && träff.status === "open"
        ? "confirmed"
        : "rsvped",
      rsvp_count: newCount,
      träff_status: newStatus,
    },
    200,
    corsHeaders,
  );
});

async function countRsvps(
  supabase: ReturnType<typeof createClient>,
  träffId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("träff_rsvps")
    .select("*", { count: "exact", head: true })
    .eq("träff_id", träffId);
  if (error) {
    console.error("[träff-rsvp] count error:", error);
    return 0;
  }
  return count ?? 0;
}
