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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonError("Method Not Allowed", 405);
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return jsonError("Missing phone or code", 400);
    }

    // Validate E.164 format
    if (!phone.startsWith("+") || phone.length < 8) {
      return jsonError("Invalid phone format", 400);
    }

    // Validate Twilio configuration
    if (!TWILIO_VERIFY_SERVICE_SID || !TWILIO_VERIFY_SERVICE_SID.startsWith("VA")) {
      console.error("Invalid TWILIO_VERIFY_SERVICE_SID:", TWILIO_VERIFY_SERVICE_SID);
      return jsonError("Server configuration error: Invalid Verify Service SID", 500);
    }

    /* ---------- TWILIO VERIFY ---------- */
    // FIX: Correct endpoint is VerificationChecks (plural)
    const twilioRes = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationChecks`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Code: code }),
      }
    );

    const twilioData = await twilioRes.json();
    console.log("Twilio response:", JSON.stringify(twilioData));

    // Check for HTTP-level errors from Twilio
    if (!twilioRes.ok || twilioData.code || twilioData.message) {
      const errorMessage = twilioData.message || "Twilio verification failed";
      console.error("Twilio API error:", errorMessage);
      return jsonError(errorMessage, 502);
    }

    if (twilioData.status !== "approved") {
      const message =
        twilioData.status === "pending" ? "Fel kod" : "Koden har utgått";
      return jsonError(message, 401);
    }

    /* ---------- SUPABASE ---------- */
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // FIX: Use getUserByPhone instead of listUsers (no pagination issues, O(1) lookup)
    const { data: existingUser, error: getUserError } =
      await supabase.auth.admin.getUserByPhone(phone);

    // Handle getUserByPhone errors (excluding "not found" which returns null data)
    if (getUserError && !getUserError.message?.includes("not found")) {
      console.error("Error fetching user by phone:", getUserError);
      return jsonError("Failed to lookup user", 500);
    }

    let user = existingUser?.user;
    let isNewUser = false;

    if (!user) {
      isNewUser = true;

      // FIX: Use phone_confirmed (not phone_confirm)
      const { data: newUser, error: createErr } =
        await supabase.auth.admin.createUser({
          phone,
          phone_confirmed: true,
        });

      if (createErr || !newUser.user) {
        console.error("Create user error:", createErr);

        // Handle case where user already exists (race condition or phone format mismatch)
        if (createErr?.message?.includes("already") || createErr?.message?.includes("duplicate")) {
          // Try to fetch user again with the exact phone
          const { data: retryUser } = await supabase.auth.admin.getUserByPhone(phone);
          if (retryUser?.user) {
            user = retryUser.user;
            isNewUser = false;
          } else {
            // Also try listing users as fallback
            const { data: listData } = await supabase.auth.admin.listUsers({
              page: 1,
              perPage: 1000,
            });
            const foundUser = listData?.users?.find((u) => u.phone === phone);
            if (foundUser) {
              user = foundUser;
              isNewUser = false;
            } else {
              return jsonError("Failed to create user account", 500);
            }
          }
        } else {
          return jsonError("Failed to create user account", 500);
        }
      } else {
        user = newUser.user;
      }

      // Only create profile for truly new users
      if (isNewUser) {
        // FIX: Handle profile insert errors
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          phone,
          phone_verified_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Profile insert error:", profileError);
          // Check if profile already exists (race condition)
          if (!profileError.message?.includes("duplicate") && !profileError.message?.includes("already exists")) {
            // Clean up orphaned auth user to maintain consistency
            const { error: deleteErr } = await supabase.auth.admin.deleteUser(
              user.id
            );
            if (deleteErr) {
              console.error("Failed to cleanup orphaned user:", deleteErr);
            }
            return jsonError("Failed to create profile", 500);
          }
          // Profile already exists, that's fine
          console.log("Profile already exists, continuing");
        }
      }
    }

    /* ---------- CREATE SESSION ---------- */
    // Since we verified OTP via Twilio (not Supabase's built-in OTP),
    // we need to generate a session using the admin API.
    // We use generateLink to create a magic link token, then exchange it for a session.

    // First, ensure user has an email (required for generateLink)
    // We'll use a placeholder email based on phone
    const placeholderEmail = `${phone.replace('+', '')}@phone.maak.app`;

    // Update user with placeholder email if not set
    const { error: updateError } = await supabase.auth.admin.updateUser(user.id, {
      email: placeholderEmail,
      email_confirm: true,
    });

    if (updateError) {
      console.error("Update user error:", updateError);
      // Non-fatal - user might already have email
    }

    // Generate a magic link for the user
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: placeholderEmail,
    });

    if (linkError || !linkData) {
      console.error("Generate link error:", linkError);
      return jsonError("Failed to create session", 500);
    }

    // Extract the token from the generated link
    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) {
      console.error("No token hash in link data");
      return jsonError("Failed to create session", 500);
    }

    // Verify the magic link token to get a session
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });

    if (sessionError || !sessionData.session) {
      console.error("Session creation error:", sessionError);
      return jsonError("Failed to create session", 500);
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
    return jsonError("Server error", 500);
  }
});

/* ---------- Helper ---------- */
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
