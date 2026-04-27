/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { timingSafeEqual } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") || "https://maakapp.se",
  "Access-Control-Allow-Headers": "authorization, x-revenuecat-signature, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * RevenueCat webhook event.
 * See https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */
interface RevenueCatEvent {
  id?: string;
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

/** Valid state transitions: current status → allowed next statuses. */
const VALID_TRANSITIONS: Record<string, Set<string>> = {
  active: new Set(["active", "cancelled", "expired"]),
  cancelled: new Set(["active", "cancelled", "expired"]),
  expired: new Set(["active", "expired"]),
};

/** Max webhook calls per 60-second window (per source IP). */
const RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW_SECONDS = 60;

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

/**
 * Verify RevenueCat webhook signature (HMAC-SHA256).
 * RevenueCat sends X-RevenueCat-Signature header containing the HMAC of the raw body.
 * See: https://www.revenuecat.com/docs/integrations/webhooks#signature-verification
 */
async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  // RevenueCat signature format: "v1=<hex_hmac>"
  const match = signatureHeader.match(/^v1=([a-f0-9]+)$/i);
  if (!match) return false;
  const receivedHmac = match[1].toLowerCase();

  const key = await crypto.subtle.importKey(
    "raw",
    utf8Buf(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, utf8Buf(rawBody));
  const expectedHmac = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison of hex strings
  return timingSafeEqualUtf8(receivedHmac, expectedHmac);
}

/** Get the start of the current rate-limit window. */
function getRateLimitWindowStart(): string {
  const now = new Date();
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  return windowStart.toISOString();
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // -------------------------------------------------------------------------
  // AUTH: Bearer token (constant-time comparison)
  // -------------------------------------------------------------------------
  const expectedAuth = (Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? "").trim();
  if (!expectedAuth || expectedAuth.length < 32) {
    console.error("REVENUECAT_WEBHOOK_AUTH is not configured");
    return jsonResponse({ error: "Webhook not configured" }, 503);
  }

  const provided = extractBearer(req.headers.get("authorization"));
  if (!provided || !timingSafeEqualUtf8(provided, expectedAuth)) {
    return jsonResponse({ error: "Invalid webhook authorization" }, 401);
  }

  // -------------------------------------------------------------------------
  // SIGNATURE VERIFICATION (defense-in-depth)
  // -------------------------------------------------------------------------
  const webhookSigningSecret = (Deno.env.get("REVENUECAT_WEBHOOK_SIGNING_SECRET") ?? "").trim();
  const rawBody = await req.text();

  if (webhookSigningSecret) {
    const signatureHeader = req.headers.get("x-revenuecat-signature");
    const valid = await verifySignature(rawBody, signatureHeader, webhookSigningSecret);
    if (!valid) {
      console.error("revenuecat-webhook: signature verification failed");
      return jsonResponse({ error: "Invalid signature" }, 401);
    }
  }

  // -------------------------------------------------------------------------
  // PARSE BODY
  // -------------------------------------------------------------------------
  let body: RevenueCatWebhookBody;
  try {
    body = JSON.parse(rawBody || "{}") as RevenueCatWebhookBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const event = body.event;
  if (!event || typeof event.type !== "string") {
    return jsonResponse({ error: "Missing event" }, 400);
  }

  // -------------------------------------------------------------------------
  // SUPABASE CLIENT
  // -------------------------------------------------------------------------
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase configuration missing");
    return jsonResponse({ error: "Supabase not configured" }, 503);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // -------------------------------------------------------------------------
  // RATE LIMITING: use existing try_consume_rate_limit RPC
  // -------------------------------------------------------------------------
  const rateLimitKey = "webhook:revenuecat";
  const windowStart = getRateLimitWindowStart();
  const { data: rlData } = await supabase.rpc("try_consume_rate_limit", {
    p_key: rateLimitKey,
    p_window_start: windowStart,
    p_max: RATE_LIMIT_MAX,
  });
  if (rlData && typeof rlData === "object" && "allowed" in rlData && !rlData.allowed) {
    console.error("revenuecat-webhook: rate limit exceeded", { count: rlData.count });
    return jsonResponse({ error: "Rate limit exceeded" }, 429);
  }

  // -------------------------------------------------------------------------
  // EVENT DEDUPLICATION
  // -------------------------------------------------------------------------
  const eventId = event.id ?? `${event.type}_${event.app_user_id ?? "anon"}_${Date.now()}`;

  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingEvent) {
    return jsonResponse({ ok: true, skipped: "duplicate_event", event_id: eventId }, 200);
  }

  // -------------------------------------------------------------------------
  // RESOLVE USER ID
  // -------------------------------------------------------------------------
  const rawUserId = event.original_app_user_id ?? event.app_user_id ?? "";
  if (!isUuid(rawUserId)) {
    console.warn("revenuecat-webhook: non-UUID app_user_id; skipping", {
      type: event.type,
      rawUserId,
    });
    // Log to audit table
    await supabase.from("webhook_events").insert({
      event_id: eventId,
      event_type: event.type,
      user_id: null,
      payload: body,
      status: "skipped",
      error_message: "non_uuid_user",
    });
    return jsonResponse({ ok: true, skipped: "non_uuid_user" }, 200);
  }
  const userId = rawUserId;

  // -------------------------------------------------------------------------
  // ENTITLEMENT CHECK
  // -------------------------------------------------------------------------
  const entitlements = event.entitlement_ids ?? [];
  const isManaged =
    entitlements.length === 0 ||
    entitlements.some((id) => MANAGED_ENTITLEMENTS.has(id));
  if (!isManaged) {
    await supabase.from("webhook_events").insert({
      event_id: eventId,
      event_type: event.type,
      user_id: userId,
      payload: body,
      status: "skipped",
      error_message: "other_entitlement",
    });
    return jsonResponse({ ok: true, skipped: "other_entitlement" }, 200);
  }

  // Premium beats basic if both are somehow active in the same event.
  const hasPremium = entitlements.includes(PREMIUM_ENTITLEMENT_ID);
  const hasBasic = entitlements.includes(BASIC_ENTITLEMENT_ID);
  const activePlan: "premium" | "basic" = hasPremium
    ? "premium"
    : hasBasic
      ? "basic"
      : "basic";

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
    await supabase.from("webhook_events").insert({
      event_id: eventId,
      event_type: event.type,
      user_id: userId,
      payload: body,
      status: "skipped",
      error_message: `unhandled_event_${event.type}`,
    });
    return jsonResponse({ ok: true, skipped: `event_${event.type}` }, 200);
  }

  // -------------------------------------------------------------------------
  // STATE TRANSITION VALIDATION
  // -------------------------------------------------------------------------
  const { data: currentSub } = await supabase
    .from("subscriptions")
    .select("status, plan_type, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (currentSub) {
    const currentStatus = currentSub.status as string;
    const allowedNext = VALID_TRANSITIONS[currentStatus];

    if (allowedNext && !allowedNext.has(nextRow.status)) {
      console.warn("revenuecat-webhook: invalid state transition", {
        userId,
        from: currentStatus,
        to: nextRow.status,
        event: event.type,
      });
      await supabase.from("webhook_events").insert({
        event_id: eventId,
        event_type: event.type,
        user_id: userId,
        payload: body,
        status: "error",
        error_message: `invalid_transition:${currentStatus}->${nextRow.status}`,
      });
      // Still return 200 so RevenueCat doesn't retry
      return jsonResponse({
        ok: false,
        error: "invalid_state_transition",
        from: currentStatus,
        to: nextRow.status,
      }, 200);
    }

    // Don't downgrade premium → basic via an out-of-order event
    if (
      currentSub.plan_type === "premium" &&
      nextRow.plan_type === "basic" &&
      nextRow.status === "active" &&
      currentSub.status === "active"
    ) {
      // Keep premium — don't downgrade
      nextRow.plan_type = "premium";
    }
  }

  // -------------------------------------------------------------------------
  // UPSERT SUBSCRIPTION
  // -------------------------------------------------------------------------
  const { error: upsertError } = await supabase
    .from("subscriptions")
    .upsert(nextRow, { onConflict: "user_id" });

  if (upsertError) {
    console.error("subscriptions upsert error:", upsertError);
    await supabase.from("webhook_events").insert({
      event_id: eventId,
      event_type: event.type,
      user_id: userId,
      payload: body,
      status: "error",
      error_message: upsertError.message,
    });
    return jsonResponse({ error: "Failed to upsert subscription" }, 500);
  }

  // -------------------------------------------------------------------------
  // AUDIT LOG: record successful event
  // -------------------------------------------------------------------------
  await supabase.from("webhook_events").insert({
    event_id: eventId,
    event_type: event.type,
    user_id: userId,
    payload: body,
    status: "processed",
  });

  return jsonResponse(
    {
      ok: true,
      user_id: userId,
      event_type: event.type,
      plan_type: nextRow.plan_type,
      status: nextRow.status,
      expires_at: nextRow.expires_at,
    },
    200,
  );
});
