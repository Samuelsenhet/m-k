/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-onfido-signature, x-jumio-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type VerificationStatus = "approved" | "rejected";

/** Generic webhook body: provider can send user_id directly or applicant_id (we look up user_id). */
interface WebhookBody {
  user_id?: string;
  applicant_id?: string;
  status: VerificationStatus;
  provider?: "onfido" | "jumio" | "generic";
}

/** Onfido webhook payload (see https://documentation.onfido.com/#webhooks) */
interface OnfidoPayload {
  payload?: {
    resource_type?: string;
    action?: string;
    object?: {
      id?: string;
      status?: string;
      applicant_id?: string;
      result?: string;
    };
  };
}

/** Jumio webhook payload (see https://docs.jumio.com/) */
interface JumioPayload {
  scanReference?: string;
  verificationStatus?: string;
  userId?: string;
}

function getStatusFromOnfido(obj: OnfidoPayload["payload"]): VerificationStatus | null {
  if (!obj?.object) return null;
  const status = (obj.object.result ?? obj.object.status ?? "").toLowerCase();
  if (status === "clear" || status === "approved") return "approved";
  if (status === "consider" || status === "rejected") return "rejected";
  return null;
}

function getStatusFromJumio(p: JumioPayload): VerificationStatus | null {
  const s = (p.verificationStatus ?? "").toLowerCase();
  if (s === "approved" || s === "passed") return "approved";
  if (s === "rejected" || s === "failed") return "rejected";
  return null;
}

function utf8Buf(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** Constant-time UTF-8 string compare: pad to equal length so length does not short-circuit. */
function timingSafeEqualUtf8(a: string, b: string): boolean {
  const A = utf8Buf(a);
  const B = utf8Buf(b);
  const maxLen = Math.max(A.length, B.length);
  const padA = Buffer.alloc(maxLen, 0);
  const padB = Buffer.alloc(maxLen, 0);
  padA.set(A, 0);
  padB.set(B, 0);
  return timingSafeEqual(padA, padB);
}

function stripSigPrefix(v: string): string {
  const t = v.trim();
  const eq = t.indexOf("=");
  if (eq >= 0) return t.slice(eq + 1).trim();
  return t;
}

function hexToBuf(hex: string): Buffer | null {
  const clean = stripSigPrefix(hex).replace(/^0x/i, "").replace(/\s/g, "").toLowerCase();
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) return null;
  try {
    return Buffer.from(clean, "hex");
  } catch {
    return null;
  }
}

function hmacSha256Hex(secret: string, rawBody: string): string {
  return createHmac("sha256", Buffer.from(secret, "utf8"))
    .update(rawBody, "utf8")
    .digest("hex");
}

/** Compare provider signature header to expected HMAC-SHA256 hex digest. */
function timingSafeEqualHmacHex(headerVal: string, expectedHex: string): boolean {
  const exp = hexToBuf(expectedHex);
  const got = hexToBuf(stripSigPrefix(headerVal));
  if (!exp || !got || exp.length !== got.length) return false;
  return timingSafeEqual(got, exp);
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

  const webhookSecret = (Deno.env.get("ID_VERIFICATION_WEBHOOK_SECRET") ?? "").trim();
  if (!webhookSecret) {
    console.error("ID_VERIFICATION_WEBHOOK_SECRET is not configured");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 503,
    });
  }

  const rawBody = await req.text();

  const hWebhook = req.headers.get("x-webhook-secret");
  const hOnfido = req.headers.get("x-onfido-signature");
  const hJumio = req.headers.get("x-jumio-signature");

  let authOk = false;
  if (hWebhook != null && hWebhook.length > 0) {
    authOk = timingSafeEqualUtf8(hWebhook.trim(), webhookSecret);
  } else if (hOnfido != null && hOnfido.length > 0) {
    const expected = hmacSha256Hex(webhookSecret, rawBody);
    authOk = timingSafeEqualHmacHex(hOnfido, expected);
  } else if (hJumio != null && hJumio.length > 0) {
    const expected = hmacSha256Hex(webhookSecret, rawBody);
    authOk = timingSafeEqualHmacHex(hJumio, expected);
  }

  if (!authOk) {
    return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  let userId: string | null = null;
  let status: VerificationStatus | null = null;
  let provider = "generic";

  // Parsed body; fields are augmented below (applicant_id, etc.)
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(rawBody || "{}") as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  try {

    // Generic format: { user_id?, applicant_id?, status: 'approved'|'rejected' }
    const st0 = doc.status;
    if (typeof st0 === "string" && ["approved", "rejected"].includes(st0)) {
      status = st0 as VerificationStatus;
      if (typeof doc.user_id === "string") userId = doc.user_id;
      if (doc.applicant_id && !userId) {
        provider = typeof doc.provider === "string" ? doc.provider : "generic";
        // Look up user_id from id_verification_applicants below
      }
    }

    // Onfido format
    const onfido = doc as unknown as OnfidoPayload;
    if (onfido?.payload?.object?.applicant_id != null || onfido?.payload?.resource_type === "check") {
      const st = getStatusFromOnfido(onfido.payload);
      if (st) {
        status = st;
        provider = "onfido";
        const applicantId = onfido.payload?.object?.applicant_id ?? onfido.payload?.object?.id;
        if (applicantId) doc.applicant_id = applicantId;
      }
    }

    // Jumio format (simplified)
    const jumio = doc as unknown as JumioPayload;
    if (jumio?.verificationStatus != null || jumio?.userId != null) {
      const st = getStatusFromJumio(jumio);
      if (st) {
        status = st;
        provider = "jumio";
        if (jumio.userId) userId = jumio.userId;
        if (jumio.scanReference && !userId) doc.applicant_id = jumio.scanReference;
      }
    }

    if (!status) {
      return new Response(JSON.stringify({ error: "Could not determine verification status from payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const payloadObj = doc.payload as { object?: { applicant_id?: string } } | undefined;
    const applicantId = doc.applicant_id ?? payloadObj?.object?.applicant_id;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!userId && applicantId) {
      const { data: row, error: lookupError } = await supabase
        .from("id_verification_applicants")
        .select("user_id")
        .eq("provider", provider)
        .eq("applicant_id", String(applicantId))
        .maybeSingle();

      if (lookupError) {
        console.error("Lookup id_verification_applicants error:", lookupError);
        return new Response(JSON.stringify({ error: "Applicant not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      if (row?.user_id) userId = row.user_id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id or applicant_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        id_verification_status: status,
        updated_at: new Date().toISOString(),
      })
      .or(`user_id.eq.${userId},id.eq.${userId}`);

    if (updateError) {
      console.error("Update profiles error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("id-verification-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
