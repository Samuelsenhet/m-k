import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get allowed origin from environment or default to wildcard for development
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  type: "matching" | "profile" | "icebreakers" | "all";
  matchedUserId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    // Create client with user's auth token to verify identity
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id; // Use authenticated user's ID, not from request body
    const { type, matchedUserId } = await req.json() as RequestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase service role configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Could not fetch user profile");
    }

    // Fetch user's personality result
    const { data: personalityResult } = await supabase
      .from("personality_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch user's matches
    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch matched user profile if specified
    let matchedProfile = null;
    let matchedPersonality = null;
    if (matchedUserId) {
      const { data: mp } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", matchedUserId)
        .single();
      matchedProfile = mp;

      const { data: mpr } = await supabase
        .from("personality_results")
        .select("*")
        .eq("user_id", matchedUserId)
        .single();
      matchedPersonality = mpr;
    }

    // Build context for AI
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
      personality: personalityResult ? {
        archetype: personalityResult.archetype,
        category: personalityResult.category,
        scores: personalityResult.scores,
      } : null,
      matchCount: matches?.length || 0,
      matchedUser: matchedProfile ? {
        name: matchedProfile.display_name,
        bio: matchedProfile.bio,
        hometown: matchedProfile.hometown,
        work: matchedProfile.work,
        education: matchedProfile.education,
        personality: matchedPersonality ? {
          archetype: matchedPersonality.archetype,
          category: matchedPersonality.category,
        } : null,
      } : null,
    };

    // Build system prompt based on type
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar, vänta en stund och försök igen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-tjänsten är inte tillgänglig just nu." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log(`AI Assistant response generated successfully for type: ${type}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestion: content,
        type 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Ett fel uppstod" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
