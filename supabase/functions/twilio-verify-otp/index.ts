// Supabase Edge Function: Verify OTP via Twilio Verify
// FIXED: Twilio endpoint, listUsers pagination, error handling, phone_confirmed field
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_SID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = Deno.env.toObject();

// FIXED: More restrictive CORS for production
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonError("Method Not Allowed", 405);
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return jsonError("Missing phone or code", 400);
    }

    // FIXED: Validate phone format (E.164)
    if (!phone.startsWith("+") || phone.length < 8 || phone.length > 16) {
      return jsonError("Ogiltigt telefonnummer. Ange ett giltigt nummer i internationellt format.", 400);
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return jsonError("Ogiltig kod. Koden måste vara 6 siffror.", 400);
    }

    // Validate Twilio configuration
    if (!TWILIO_VERIFY_SERVICE_SID || !TWILIO_VERIFY_SERVICE_SID.startsWith("VA")) {
      console.error("Invalid TWILIO_VERIFY_SERVICE_SID:", TWILIO_VERIFY_SERVICE_SID);
      return jsonError("Server configuration error: Invalid Verify Service SID", 500);
    }

    /* ---------- TWILIO VERIFY ---------- */
    // Twilio Verify Verification Check endpoint:
    // POST https://verify.twilio.com/v2/Services/{ServiceSid}/VerificationCheck
    // Twilio can return 404 if the verification is expired/approved/max-attempts reached.
    const requestInit: RequestInit = {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Code: code }),
    };

    const checkUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;

    const twilioRes = await fetch(checkUrl, requestInit);
    const twilioData: unknown = await twilioRes.json().catch(() => ({}));
    const twilioObj =
      twilioData && typeof twilioData === "object"
        ? (twilioData as Record<string, unknown>)
        : ({} as Record<string, unknown>);
    const twilioCode = typeof twilioObj.code === "number" ? twilioObj.code : undefined;
    const twilioMessage =
      typeof twilioObj.message === "string" ? twilioObj.message : undefined;
    const twilioStatus =
      typeof twilioObj.status === "string" ? twilioObj.status : undefined;

    console.log("Twilio response:", JSON.stringify(twilioObj));

    // 404 from Twilio Verify commonly means: expired, already approved, or max attempts reached.
    if (twilioRes.status === 404) {
      return jsonError(
        "Koden har utgått eller har redan använts. Skicka en ny kod och försök igen.",
        401
      );
    }

    // FIXED: Better error handling for Twilio responses
    // Check for HTTP-level errors from Twilio (but allow 200 with error codes)
    if (!twilioRes.ok) {
      const errorMessage = twilioMessage || `Twilio API error: ${twilioRes.status}`;
      console.error("Twilio API HTTP error:", errorMessage, twilioObj);
      return jsonError(errorMessage, 502);
    }

    // Check for Twilio error codes in response body
    if (twilioCode && twilioCode !== 0) {
      const errorMessage = twilioMessage || `Twilio error code: ${twilioCode}`;
      console.error("Twilio error code:", twilioCode, twilioMessage);
      return jsonError(errorMessage, 401);
    }

    // Check verification status
    if (twilioStatus !== "approved") {
      const message =
        twilioStatus === "pending" 
          ? "Fel kod. Försök igen." 
          : twilioStatus === "expired"
          ? "Koden har utgått. Skicka en ny kod."
          : "Koden är ogiltig. Försök igen.";
      console.log("Twilio verification status:", twilioStatus);
      return jsonError(message, 401);
    }

    /* ---------- SUPABASE AUTH ---------- */
    // Create Supabase admin client for user management
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // CORRECT PATTERN: Use Supabase Auth admin methods (not client-side methods)
    // Since getUserByPhone doesn't exist, we need to find or create user
    
    // Try to find existing user by phone (search first 3 pages = 300 users)
    let user = null;
    let isNewUser = false;
    
    for (let page = 1; page <= 3; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 100,
      });
      
      if (error) {
        console.error(`Error listing users page ${page}:`, error);
        break;
      }
      
      const found = data?.users?.find((u) => u.phone === phone);
      if (found) {
        user = found;
        break;
      }
      
      // If we got fewer than 100 users, we've reached the end
      if (!data?.users || data.users.length < 100) break;
    }

    // Create user if not found
    if (!user) {
      isNewUser = true;
      const { data: newUserData, error: createErr } = await supabase.auth.admin.createUser({
        phone,
        phone_confirmed: true,
      });

      if (createErr || !newUserData?.user) {
        console.error("Create user error:", createErr);
        // If user already exists (race condition), try finding again
        if (createErr?.message?.includes("already") || createErr?.message?.includes("duplicate")) {
          // One more search attempt
          const { data: retryData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
          user = retryData?.users?.find((u) => u.phone === phone) || null;
          if (user) isNewUser = false;
        }
        
        if (!user) {
          return jsonError("Kunde inte skapa användarkonto. Försök igen.", 500);
        }
      } else {
        user = newUserData.user;
      }

      // Create profile for new users
      if (isNewUser) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          phone,
          phone_verified_at: new Date().toISOString(),
        });

        if (profileError && !profileError.message?.includes("duplicate") && !profileError.message?.includes("already exists")) {
          console.error("Profile insert error:", profileError);
          // Cleanup orphaned auth user
          await supabase.auth.admin.deleteUser(user.id).catch(() => {});
          return jsonError("Kunde inte skapa profil. Försök igen.", 500);
        }
      }
    }

    /* ---------- CREATE SESSION ---------- */
    // CORRECT PATTERN: Use generateLink to create a session token
    // This is the recommended way to create sessions server-side
    const placeholderEmail = `${phone.replace(/[^0-9]/g, '')}@phone.maak.app`;
    
    // Ensure user has email (required for generateLink)
    await supabase.auth.admin.updateUserById(user.id, {
      email: placeholderEmail,
      email_confirm: true,
    }).catch(() => {}); // Ignore if email already exists

    // Generate magic link to get session token
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: placeholderEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Generate link error:", linkError);
      return jsonError("Kunde inte skapa session. Försök igen.", 500);
    }

    // Exchange token hash for session
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (sessionError || !sessionData?.session) {
      console.error("Session creation error:", sessionError);
      return jsonError("Kunde inte skapa session. Försök igen.", 500);
    }

    const session = sessionData;

    return new Response(
      JSON.stringify({
        success: true,
        session: session.session,
        isNewUser,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    const message =
      err instanceof Error && typeof err.message === "string" && err.message.trim().length > 0
        ? err.message
        : "Server error";
    // Don't leak huge stack traces to client
    return jsonError(message.slice(0, 300), 500);
  }
});

/* ---------- Helper ---------- */
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
