// Supabase Edge Function: Verify OTP via Twilio Verify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // JWT verification (Supabase)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Optionally: verify JWT here

  const { phone, code } = await req.json();
  if (!phone || !code) {
    return new Response(JSON.stringify({ error: "Missing phone or code" }), { status: 400 });
  }

  // Twilio Verify API: Check OTP
  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
  const body = new URLSearchParams({ To: phone, Code: code });
  const twilioRes = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await twilioRes.json();
  if (!twilioRes.ok || data.status !== "approved") {
    return new Response(JSON.stringify({ error: data.message || "OTP not approved" }), { status: 401 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
