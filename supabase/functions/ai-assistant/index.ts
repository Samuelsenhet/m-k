import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/env.ts";
import { enforceAiRateLimits } from "../_shared/rate_limit_db.ts";
import { resolveMatchedPeerId } from "../_shared/match_peer.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://maakapp.se";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  type: "matching" | "profile" | "icebreakers" | "all" | "after_video";
  matchedUserId?: string;
  matchId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userId = await verifySupabaseJWT(authHeader);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const allowedTypes = new Set<RequestBody["type"]>([
      "matching",
      "profile",
      "icebreakers",
      "all",
      "after_video",
    ]);
    const type = body?.type;
    if (typeof type !== "string" || !allowedTypes.has(type as RequestBody["type"])) {
      return new Response(
        JSON.stringify({
          error: "Invalid or missing type",
          allowed: ["matching", "profile", "icebreakers", "all", "after_video"],
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { matchedUserId, matchId } = body;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    const AI_MODEL = "claude-haiku-4-5-20251001";
    const AI_PROVIDER = "anthropic";
    const FUNCTION_NAME = "ai_assistant";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const rateBlock = await enforceAiRateLimits(supabase, req, userId, "ai_assistant");
    if (rateBlock) {
      const blocked = rateBlock.clone();
      const h = new Headers(blocked.headers);
      h.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      h.set("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"]);
      h.set("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]);
      return new Response(blocked.body, { status: blocked.status, headers: h });
    }

    let peerId: string | null = null;
    if (body.type === "icebreakers" || body.type === "after_video") {
      peerId = await resolveMatchedPeerId(supabase, userId, matchedUserId, matchId);
      if (!peerId) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Could not fetch user profile");
    }

    const { data: personalityResult } = await supabase
      .from("personality_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(10);

    let matchedProfile = null;
    let matchedPersonality = null;
    if (peerId) {
      const { data: mp } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", peerId)
        .single();
      matchedProfile = mp;

      const { data: mpr } = await supabase
        .from("personality_results")
        .select("*")
        .eq("user_id", peerId)
        .single();
      matchedPersonality = mpr;
    }

    const context = {
      userProfile: {
        name: userProfile.display_name,
        gender: userProfile.gender,
        sexuality: userProfile.sexuality,
        lookingFor: userProfile.looking_for,
        bio: userProfile.bio,
        hometown: userProfile.hometown,
        work: userProfile.work,
        education: userProfile.education,
        religion: userProfile.religion,
        politics: userProfile.politics,
        alcohol: userProfile.alcohol,
        smoking: userProfile.smoking,
        profileCompletion: userProfile.profile_completion,
      },
      personality: personalityResult
        ? {
          archetype: personalityResult.archetype,
          category: personalityResult.category,
          scores: personalityResult.scores,
        }
        : null,
      matchCount: matches?.length || 0,
      matchedUser: matchedProfile
        ? {
          name: matchedProfile.display_name,
          bio: matchedProfile.bio,
          hometown: matchedProfile.hometown,
          work: matchedProfile.work,
          education: matchedProfile.education,
          personality: matchedPersonality
            ? {
              archetype: matchedPersonality.archetype,
              category: matchedPersonality.category,
            }
            : null,
        }
        : null,
    };

    const systemPrompt = `Du är MÄÄK AI-assistent, en hjälpsam och varm dejtingcoach som hjälper användare att hitta kärleken. 
Du har tillgång till användarens profildata och personlighetsanalys. Ge konkreta, personliga och uppmuntrande råd på svenska.
Var kortfattad men hjälpsam. Använd emoji sparsamt.`;

    let userPrompt = "";

    switch (type) {
      case "matching":
        userPrompt = `Analysera denna användares profil och personlighet:
${JSON.stringify(context.userProfile, null, 2)}
Personlighet: ${JSON.stringify(context.personality, null, 2)}

Ge 3 konkreta tips på vilka personlighetstyper och egenskaper som skulle passa bra för denna användare i en relation. 
Förklara kort varför baserat på deras personlighetstyp.`;
        break;

      case "profile":
        userPrompt = `Analysera denna användares profil:
${JSON.stringify(context.userProfile, null, 2)}
Profilkomplettering: ${context.userProfile.profileCompletion}%

Ge 3-5 konkreta och specifika förslag på hur användaren kan förbättra sin profil för att få fler matchningar.
Fokusera på vad som saknas eller kan förbättras.`;
        break;

      case "icebreakers":
        if (!context.matchedUser) {
          throw new Error("Matched user ID required for icebreakers");
        }
        userPrompt = `Användare 1:
${JSON.stringify(context.userProfile, null, 2)}
Personlighet: ${context.personality?.archetype || "Okänd"}

Användare 2 (matchning):
${JSON.stringify(context.matchedUser, null, 2)}

Generera 3 unika och personliga konversationsstartare som användare 1 kan använda för att inleda en konversation med användare 2.
Basera förslagen på gemensamma intressen, personligheter eller intressanta skillnader.
Gör dem lättsamma och engagerande.`;
        break;

      case "after_video":
        if (!context.matchedUser) {
          throw new Error("Matched user ID required for after_video");
        }
        userPrompt = `Användaren har precis avslutat ett kort videomöte (Kemi-Check) med sin match.

Användare 1 (du):
${JSON.stringify(context.userProfile, null, 2)}
Personlighet: ${context.personality?.archetype || "Okänd"}

Användare 2 (match):
${JSON.stringify(context.matchedUser, null, 2)}

Ge:
1. En kort sammanfattning (1–2 meningar) om vad som kan funka bra mellan er.
2. 2–3 konkreta ämnen eller frågor ni kan ta upp i chatt efter videomötet. Exempel: "Ni båda gillar resor – fråga om senaste resan!"
Var kort, personlig och på svenska.`;
        break;

      case "all":
        userPrompt = `Analysera denna användares profil och ge en komplett analys:

Profil:
${JSON.stringify(context.userProfile, null, 2)}

Personlighet:
${JSON.stringify(context.personality, null, 2)}

Antal matchningar: ${context.matchCount}

Ge en sammanfattning som inkluderar:
1. **Matchningsinsikter**: Vilka personlighetstyper passar bäst för denna användare?
2. **Profilförbättringar**: 2-3 konkreta sätt att förbättra profilen
3. **Dejtingtips**: 2 personliga tips baserat på deras personlighet

Håll det kortfattat och uppmuntrande.`;
        break;
    }

    console.log(`AI Assistant request - Type: ${type}, User: ${userId}`);

    const aiStartedAt = Date.now();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });
    const latencyMs = Date.now() - aiStartedAt;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);

      try {
        const { error: usageErr } = await supabase.from("ai_usage").insert({
          user_id: userId,
          function_name: FUNCTION_NAME,
          provider: AI_PROVIDER,
          model: AI_MODEL,
          latency_ms: latencyMs,
          status: "error",
          error_message: `anthropic_${response.status}: ${errorText.slice(0, 200)}`,
        });
        if (usageErr) console.warn("[ai_usage] insert failed:", usageErr.message);
      } catch (e) {
        console.warn("[ai_usage] insert crashed:", e);
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar, vänta en stund och försök igen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error("Anthropic API error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.content?.[0]?.text;
    const usage = (aiResponse.usage ?? {}) as { input_tokens?: number; output_tokens?: number };

    try {
      const { error: usageErr } = await supabase.from("ai_usage").insert({
        user_id: userId,
        function_name: FUNCTION_NAME,
        provider: AI_PROVIDER,
        model: AI_MODEL,
        prompt_tokens: usage.input_tokens ?? null,
        completion_tokens: usage.output_tokens ?? null,
        total_tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0) || null,
        latency_ms: latencyMs,
        status: "ok",
      });
      if (usageErr) console.warn("[ai_usage] insert failed:", usageErr.message);
    } catch (e) {
      console.warn("[ai_usage] insert crashed:", e);
    }

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log(`AI Assistant response generated successfully for type: ${type}`);

    return new Response(
      JSON.stringify({
        success: true,
        suggestion: content,
        type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Ett fel uppstod",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
