// Supabase Edge Function: Verify OTP via Twilio Verify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "Missing phone or code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate E.164 format
    if (!phone.startsWith("+") || phone.length < 8) {
      return new Response(JSON.stringify({ error: "Invalid phone format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Step 1: Verify OTP with Twilio
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Code: code }),
    });

    const twilioData = await twilioRes.json();
    console.log("Twilio response:", JSON.stringify(twilioData));

    if (twilioData.status !== "approved") {
      return new Response(JSON.stringify({
        error: twilioData.status === "pending" ? "Fel kod" : "Koden har utgått"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Step 2: Create or get user
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if user exists
    const { data: users } = await supabase.auth.admin.listUsers();
    let user = users?.users?.find(u => u.phone === phone);
    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true,
      });

      if (createErr) {
        console.error("Create user error:", createErr);
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      user = newUser.user;

      // Create profile
      await supabase.from('profiles').insert({
        id: user.id,
        phone: phone,
        phone_verified_at: new Date().toISOString()
      });
    }

    // Step 3: Create session with temp password
    const tempPw = crypto.randomUUID() + "Aa1!";

    await supabase.auth.admin.updateUserById(user.id, { password: tempPw });

    const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
      phone,
      password: tempPw
    });

    if (signInErr || !session.session) {
      console.error("Sign in error:", signInErr);
      return new Response(JSON.stringify({ error: "Kunde inte skapa session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      session: session.session,
      isNewUser
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
