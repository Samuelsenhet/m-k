// Supabase Edge Function: Send OTP via Twilio Verify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit } from "../_shared/ratelimit.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

// FIXED: More restrictive CORS for production
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { phone } = await req.json();
  if (!phone) {
    return new Response(JSON.stringify({ error: "Missing phone" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // FIXED: Validate all Twilio configuration
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    console.error("Missing Twilio configuration:", {
      hasAccountSid: !!TWILIO_ACCOUNT_SID,
      hasAuthToken: !!TWILIO_AUTH_TOKEN,
      hasServiceSid: !!TWILIO_VERIFY_SERVICE_SID,
    });
    return new Response(
      JSON.stringify({ error: "Server configuration error: Missing Twilio credentials" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!TWILIO_VERIFY_SERVICE_SID.startsWith("VA")) {
    console.error("Invalid TWILIO_VERIFY_SERVICE_SID format:", TWILIO_VERIFY_SERVICE_SID);
    return new Response(
      JSON.stringify({ error: "Server configuration error: Invalid Verify Service SID format" }),
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

  // FIXED: Twilio Verify API: Send OTP with better error handling
  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
  const body = new URLSearchParams({ To: phone, Channel: "sms" });
  
  try {
    const twilioRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await twilioRes.json().catch(() => ({}));
    
    if (!twilioRes.ok) {
      const errorMessage = data.message || data.error || `Twilio API error: ${twilioRes.status}`;
      console.error("Twilio send OTP error:", errorMessage, data);
      
      // Handle specific Twilio error codes
      if (data.code === 60200) {
        return new Response(JSON.stringify({ 
          error: "Ogiltigt telefonnummer. Kontrollera numret och försök igen." 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      if (data.code === 60203) {
        return new Response(JSON.stringify({ 
          error: "För många försök. Vänta en stund och försök igen." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: twilioRes.status >= 400 && twilioRes.status < 500 ? twilioRes.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Unexpected error sending OTP:", err);
    return new Response(JSON.stringify({ 
      error: "Ett oväntat fel uppstod. Försök igen senare." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
