// Supabase Edge Function: Send OTP via Twilio Verify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit } from "../_shared/ratelimit.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders
    });
  }

  const { phone } = await req.json();
  if (!phone) {
    return new Response(JSON.stringify({ error: "Missing phone" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Validate Twilio configuration
  if (!TWILIO_VERIFY_SERVICE_SID || !TWILIO_VERIFY_SERVICE_SID.startsWith("VA")) {
    console.error("Invalid TWILIO_VERIFY_SERVICE_SID:", TWILIO_VERIFY_SERVICE_SID);
    return new Response(
      JSON.stringify({ error: "Server configuration error: Invalid Verify Service SID" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Enhanced rate limiting by phone number (primary) and IP (secondary)
  // 3 OTP requests per hour per phone number
  const phoneRateLimitCheck = checkRateLimit(`otp-send-phone:${phone}`, {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!phoneRateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: "För många försök för detta nummer. Vänta en stund och försök igen.",
        retryAfter: phoneRateLimitCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(phoneRateLimitCheck.retryAfter),
        },
      }
    );
  }

  // Additional IP-based rate limiting: 10 requests per hour per IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ipRateLimitCheck = checkRateLimit(`otp-send-ip:${clientIp}`, {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  });

  if (!ipRateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: "För många försök. Vänta en stund och försök igen.",
        retryAfter: ipRateLimitCheck.retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(ipRateLimitCheck.retryAfter),
        },
      }
    );
  }

  // Twilio Verify API: Send OTP
  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
  const body = new URLSearchParams({ To: phone, Channel: "sms" });
  const twilioRes = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await twilioRes.json();
  if (!twilioRes.ok) {
    return new Response(JSON.stringify({ error: data.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
