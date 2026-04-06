/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { timingSafeEqual } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") || "https://maakapp.se",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * RevenueCat webhook event.
 * See https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */
interface RevenueCatEvent {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  purchased_at_ms?: number | null;
  period_type?: string;
  environment?: "SANDBOX" | "PRODUCTION";
}

interface RevenueCatWebhookBody {
  api_version?: string;
  event: RevenueCatEvent;
}

const BASIC_ENTITLEMENT_ID = "basic";
const PREMIUM_ENTITLEMENT_ID = "premium";
const MANAGED_ENTITLEMENTS = new Set([BASIC_ENTITLEMENT_ID, PREMIUM_ENTITLEMENT_ID]);

/** Event types that grant / keep Plus active. */
const ACTIVATING_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
]);

/** Event types that end / refund the subscription. */
const EXPIRING_EVENTS = new Set([
  "EXPIRATION",
  "REFUND",
  "SUBSCRIPTION_PAUSED",
]);

/** CANCELLATION means user turned off auto-renew; they still have access until EXPIRATION. */
const CANCEL_NOTICE_EVENTS = new Set(["CANCELLATION"]);

function utf8Buf(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** Constant-time UTF-8 string compare. */
function timingSafeEqualUtf8(a: string, b: string): boolean {
  const A = utf8Buf(a);
  const B = utf8Buf(b);
  const maxLen = Math.max(A.length, B.length);
  const padA = new Uint8Array(maxLen);
  const padB = new Uint8Array(maxLen);
  padA.set(A, 0);
  padB.set(B, 0);
  return timingSafeEqual(padA, padB);
}

/** RevenueCat sends `Authorization: Bearer <secret>` where <secret> is configured in the dashboard. */
function extractBearer(header: string | null): string {
  if (!header) return "";
  const trimmed = header.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

function isUuid(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  );
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  // Security: Bearer token validated with constant-time comparison.
  // Ensure REVENUECAT_WEBHOOK_AUTH is >= 32 chars for brute-force resistance.
  const expectedAuth = (Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? "").trim();
  if (!expectedAuth || expectedAuth.length < 32) {
    console.error("REVENUECAT_WEBHOOK_AUTH is not configured");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 503,
    });
  }

  const provided = extractBearer(req.headers.get("authorization"));
  if (!provided || !timingSafeEqualUtf8(provided, expectedAuth)) {
    return new Response(JSON.stringify({ error: "Invalid webhook authorization" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const rawBody = await req.text();
  let body: RevenueCatWebhookBody;
  try {
    body = JSON.parse(rawBody || "{}") as RevenueCatWebhookBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const event = body.event;
  if (!event || typeof event.type !== "string") {
    return new Response(JSON.stringify({ error: "Missing event" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Prefer original_app_user_id so alias chains resolve to the same Supabase user.
  const rawUserId = event.original_app_user_id ?? event.app_user_id ?? "";
  if (!isUuid(rawUserId)) {
    console.warn("revenuecat-webhook: non-UUID app_user_id; skipping", {
      type: event.type,
      rawUserId,
    });
    // Anonymous RC user: ack so RC stops retrying — nothing to sync until user logs in.
    return new Response(JSON.stringify({ ok: true, skipped: "non_uuid_user" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
  const userId = rawUserId;

  // Only react to events that concern our managed entitlements (basic/premium).
  const entitlements = event.entitlement_ids ?? [];
  const isManaged =
    entitlements.length === 0 /* some event types omit entitlement field */ ||
    entitlements.some((id) => MANAGED_ENTITLEMENTS.has(id));
  if (!isManaged) {
    return new Response(JSON.stringify({ ok: true, skipped: "other_entitlement" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Premium beats basic if both are somehow active in the same event.
  const hasPremium = entitlements.includes(PREMIUM_ENTITLEMENT_ID);
  const hasBasic = entitlements.includes(BASIC_ENTITLEMENT_ID);
  const activePlan: "premium" | "basic" = hasPremium
    ? "premium"
    : hasBasic
      ? "basic"
      : "basic"; /* fallback when entitlement_ids is empty */

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase configuration missing");
    return new Response(JSON.stringify({ error: "Supabase not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 503,
    });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const nowIso = new Date().toISOString();
  const expiresAtIso = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  type SubRow = {
    user_id: string;
    plan_type: "free" | "basic" | "premium";
    status: "active" | "cancelled" | "expired";
    started_at?: string;
    expires_at: string | null;
    updated_at: string;
  };

  let nextRow: SubRow | null = null;

  if (ACTIVATING_EVENTS.has(event.type)) {
    nextRow = {
      user_id: userId,
      plan_type: activePlan,
      status: "active",
      expires_at: expiresAtIso,
      updated_at: nowIso,
    };
    if (event.purchased_at_ms) {
      nextRow.started_at = new Date(event.purchased_at_ms).toISOString();
    }
  } else if (CANCEL_NOTICE_EVENTS.has(event.type)) {
    // Keep the paid tier until expiration; just mark cancelled.
    nextRow = {
      user_id: userId,
      plan_type: activePlan,
      status: "cancelled",
      expires_at: expiresAtIso,
      updated_at: nowIso,
    };
  } else if (EXPIRING_EVENTS.has(event.type)) {
    nextRow = {
      user_id: userId,
      plan_type: "free",
      status: "expired",
      expires_at: expiresAtIso,
      updated_at: nowIso,
    };
  } else {
    // BILLING_ISSUE / TRANSFER / TEST / etc. — ack but do nothing.
    return new Response(JSON.stringify({ ok: true, skipped: `event_${event.type}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const { error: upsertError } = await supabase
    .from("subscriptions")
    .upsert(nextRow, { onConflict: "user_id" });

  if (upsertError) {
    console.error("subscriptions upsert error:", upsertError);
    return new Response(JSON.stringify({ error: "Failed to upsert subscription" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      user_id: userId,
      event_type: event.type,
      plan_type: nextRow.plan_type,
      status: nextRow.status,
      expires_at: nextRow.expires_at,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    },
  );
});
