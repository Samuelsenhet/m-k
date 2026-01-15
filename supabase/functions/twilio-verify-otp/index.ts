// Supabase Edge Function: Verify OTP via Twilio Verify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/ratelimit.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate phone is in E.164 format
function validateE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

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

  let phone: string;
  let code: string;

  try {
    const body = await req.json();
    phone = body.phone;
    code = body.code;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if (!phone || !code) {
    return new Response(JSON.stringify({ error: "Missing phone or code" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Validate E.164 format - REQUIRED by Twilio
  if (!validateE164(phone)) {
    console.error("Invalid phone format:", phone);
    return new Response(JSON.stringify({ error: "Phone must be in E.164 format (e.g., +46701234567)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Rate limiting: 5 verification attempts per 5 minutes per phone
  const phoneRateLimitCheck = checkRateLimit(`otp-verify:${phone}`, {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
  });

  if (!phoneRateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: "För många felaktiga försök. Vänta en stund och försök igen.",
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

  // ============================================================
  // STEP 1: Verify OTP with Twilio
  // ============================================================
  const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
  const twilioBody = new URLSearchParams({ To: phone, Code: code });

  let twilioData: { status?: string; message?: string; valid?: boolean };

  try {
    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: twilioBody,
    });

    twilioData = await twilioRes.json();

    // Debug logging - check this in Supabase logs
    console.log("TWILIO VERIFY RESULT:", JSON.stringify({
      status: twilioData.status,
      valid: twilioData.valid,
      httpStatus: twilioRes.status,
      phone: phone,
    }));

    // CRITICAL: Must check status === "approved"
    if (twilioData.status !== "approved") {
      let errorMessage: string;

      switch (twilioData.status) {
        case "pending":
          errorMessage = "Fel kod. Kontrollera och försök igen.";
          break;
        case "canceled":
          errorMessage = "Koden har utgått. Begär en ny kod.";
          break;
        case "denied":
          errorMessage = "Koden har utgått. Begär en ny kod.";
          break;
        default:
          errorMessage = twilioData.message || "OTP not approved";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Twilio API error:", error);
    return new Response(JSON.stringify({ error: "Failed to verify code with Twilio" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // ============================================================
  // STEP 2: Create/Get Supabase User (phone-only, no password)
  // ============================================================
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  let userId: string;
  let isNewUser = false;

  // First, check if user already exists by phone
  // Using listUsers with a reasonable limit since there's no getUserByPhone
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = listData?.users?.find(u => u.phone === phone);

  if (existingUser) {
    // User exists
    userId = existingUser.id;
    console.log("Found existing user:", userId);
  } else {
    // Create new user - phone only, NO password, NO fake email
    isNewUser = true;

    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      phone,
      phone_confirmed: true,  // CORRECT field name
      user_metadata: { phone_verified: true }
    });

    if (createError) {
      console.error("Error creating user:", createError.message);

      // If user somehow already exists (race condition), try to find them
      if (createError.message?.includes("already") || createError.message?.includes("exists")) {
        const { data: retryList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const retryUser = retryList?.users?.find(u => u.phone === phone);

        if (retryUser) {
          userId = retryUser.id;
          isNewUser = false;
        } else {
          return new Response(JSON.stringify({ error: "User exists but could not be retrieved" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } else {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else if (newUserData?.user) {
      userId = newUserData.user.id;
      console.log("Created new user:", userId);

      // Create profile for new user
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          phone: phone,
          phone_verified_at: new Date().toISOString()
        });

      if (profileError) {
        console.error("Error creating profile:", profileError.message);
        // Don't fail - profile might be created by trigger
      }
    } else {
      return new Response(JSON.stringify({ error: "Failed to create user - no user returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  // ============================================================
  // STEP 3: Generate session for the user
  // ============================================================
  // Since Supabase doesn't have a direct "create session for user" API,
  // we use a temporary password approach with a complex random password

  const tempPassword = crypto.randomUUID() + "-" + crypto.randomUUID() + "-Zx9!@#$";

  // Set temporary password
  const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: tempPassword
  });

  if (pwError) {
    console.error("Error setting temp password:", pwError.message);
    return new Response(JSON.stringify({ error: "Failed to prepare authentication" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Sign in with temp password to get session tokens
  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    phone,
    password: tempPassword
  });

  if (signInError || !signInData.session) {
    console.error("Error signing in:", signInError?.message);
    return new Response(JSON.stringify({ error: signInError?.message || "Failed to create session" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log("Session created successfully for user:", userId);

  return new Response(
    JSON.stringify({
      success: true,
      session: signInData.session,
      isNewUser
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
});
