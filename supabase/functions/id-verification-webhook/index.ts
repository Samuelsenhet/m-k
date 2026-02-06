/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const webhookSecret = Deno.env.get("ID_VERIFICATION_WEBHOOK_SECRET");
  if (webhookSecret) {
    const secret = req.headers.get("x-webhook-secret") ?? req.headers.get("x-onfido-signature") ?? req.headers.get("x-jumio-signature");
    if (secret !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
  }

  let userId: string | null = null;
  let status: VerificationStatus | null = null;
  let provider = "generic";

  try {
    const raw = await req.json();

    // Generic format: { user_id?, applicant_id?, status: 'approved'|'rejected' }
    if (typeof raw?.status === "string" && ["approved", "rejected"].includes(raw.status)) {
      status = raw.status as VerificationStatus;
      if (raw.user_id) userId = raw.user_id;
      if (raw.applicant_id && !userId) {
        provider = raw.provider ?? "generic";
        // Look up user_id from id_verification_applicants below
      }
    }

    // Onfido format
    const onfido = raw as OnfidoPayload;
    if (onfido?.payload?.object?.applicant_id != null || onfido?.payload?.resource_type === "check") {
      const st = getStatusFromOnfido(onfido.payload);
      if (st) {
        status = st;
        provider = "onfido";
        const applicantId = onfido.payload?.object?.applicant_id ?? onfido.payload?.object?.id;
        if (applicantId) raw.applicant_id = applicantId;
      }
    }

    // Jumio format (simplified)
    const jumio = raw as JumioPayload;
    if (jumio?.verificationStatus != null || jumio?.userId != null) {
      const st = getStatusFromJumio(jumio);
      if (st) {
        status = st;
        provider = "jumio";
        if (jumio.userId) userId = jumio.userId;
        if (jumio.scanReference && !userId) raw.applicant_id = jumio.scanReference;
      }
    }

    if (!status) {
      return new Response(JSON.stringify({ error: "Could not determine verification status from payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const applicantId = raw?.applicant_id ?? raw?.payload?.object?.applicant_id;

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
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
