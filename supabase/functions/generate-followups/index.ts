import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/env.ts";
import {
  enforceAiRateLimits,
  stockholmDayKey,
  stockholmDayStartIso,
} from "../_shared/rate_limit_db.ts";

// Get allowed origin from environment or default to wildcard for development
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FOLLOWUPS_PER_DAY = 5;

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ProfileData {
  display_name: string | null;
  bio: string | null;
}

interface PersonalityData {
  archetype: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration is missing");
    }

    const uid = await verifySupabaseJWT(req.headers.get("Authorization") || "");
    if (!uid) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { matchId, messageCount = 10 } = await req.json();

    if (!matchId) {
      return new Response(
        JSON.stringify({ error: "matchId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Generating follow-ups for match:", matchId, "by user:", uid);

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("id, user_id, matched_user_id")
      .eq("id", matchId)
      .single();

    if (matchError || !matchData) {
      return new Response(
        JSON.stringify({ error: "Match not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (matchData.user_id !== uid && matchData.matched_user_id !== uid) {
      return new Response(
        JSON.stringify({ error: "Unauthorized to access this match" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const matchedUserId = matchData.user_id === uid
      ? matchData.matched_user_id
      : matchData.user_id;

    const rateBlock = await enforceAiRateLimits(supabase, req, uid, "generate_followups");
    if (rateBlock) {
      const h = new Headers(rateBlock.headers);
      h.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      h.set("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"]);
      h.set("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]);
      return new Response(rateBlock.body, { status: rateBlock.status, headers: h });
    }

    // Fetch last N messages from conversation (before consuming follow-up slot)
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(Math.min(messageCount, 20));

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      throw new Error("Failed to fetch conversation history");
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No messages found",
          message: "Starta en konversation först innan du ber om förslag.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dayKey = stockholmDayKey();
    const dayStart = stockholmDayStartIso(dayKey);
    const followupBucketKey = `followup:${uid}:${matchId}:sthlm_day`;
    const { data: consumeRow, error: consumeErr } = await supabase.rpc("try_consume_rate_limit", {
      p_key: followupBucketKey,
      p_window_start: dayStart,
      p_max: MAX_FOLLOWUPS_PER_DAY,
    });
    if (consumeErr) {
      console.error("[generate-followups] try_consume_rate_limit:", consumeErr);
      return new Response(
        JSON.stringify({ error: "Rate limit check failed" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const consumeResult = consumeRow as { allowed?: boolean; count?: number } | null;
    if (consumeResult?.allowed === false) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Du har använt alla förslag för idag. Försök igen imorgon.",
          remainingToday: 0,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const usedToday = consumeResult?.count ?? 0;

    const chronologicalMessages = (messages as Message[]).reverse();

    const [userProfileRes, userPersonalityRes, matchedProfileRes, matchedPersonalityRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, bio")
        .eq("id", uid)
        .single(),
      supabase
        .from("personality_results")
        .select("archetype")
        .eq("user_id", uid)
        .single(),
      supabase
        .from('profiles')
        .select('display_name, bio')
        .eq('id', matchedUserId)
        .single(),
      supabase
        .from('personality_results')
        .select('archetype')
        .eq('user_id', matchedUserId)
        .single(),
    ]);

    const userProfile: ProfileData | null = userProfileRes.data;
    const userPersonality: PersonalityData | null = userPersonalityRes.data;
    const matchedProfile: ProfileData | null = matchedProfileRes.data;
    const matchedPersonality: PersonalityData | null = matchedPersonalityRes.data;

    const userName = userProfile?.display_name || 'Du';
    const matchedName = matchedProfile?.display_name || 'Din match';
    const userArch = userPersonality?.archetype || 'Okänd';
    const matchedArch = matchedPersonality?.archetype || 'Okänd';

    // Build conversation history for prompt
    const conversationHistory = chronologicalMessages
      .map((msg) => {
        const senderName = msg.sender_id === userId ? userName : matchedName;
        return `${senderName}: ${msg.content}`;
      })
      .join('\n');

    // Determine conversation context
    const lastMessage = chronologicalMessages[chronologicalMessages.length - 1];
    const lastSenderIsUser = lastMessage?.sender_id === userId;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the AI prompt
    const prompt = `Du är en expert på dejting och konversationer. Hjälp till att föreslå uppföljningsmeddelanden för en konversation som kanske behöver lite inspiration.

**Din profil:**
- Namn: ${userName}
- Personlighet: ${userArch}

**Matchens profil:**
- Namn: ${matchedName}
- Personlighet: ${matchedArch}

**Konversationshistorik (senaste meddelanden):**
${conversationHistory}

**Situation:** ${lastSenderIsUser ? `Du skickade det senaste meddelandet. Föreslå sätt att följa upp om ${matchedName} inte svarat.` : `${matchedName} skickade det senaste meddelandet. Föreslå bra svar som håller konversationen igång.`}

Generera 3 uppföljningsförslag som:
1. Är naturliga och passar in i konversationens ton
2. Visar intresse och engagemang
3. Ställer frågor eller delar något personligt
4. Är på svenska
5. Är korta och kärnfulla (1-2 meningar)

Svara ENDAST med ett JSON-array med exakt 3 strängar, inget annat:
["förslag 1", "förslag 2", "förslag 3"]`;

    console.log('Sending follow-up request to AI');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Du är en hjälpsam assistent som genererar konversationsförslag för en svensk dejtingapp. Svara alltid på svenska. Var kreativ och naturlig.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    console.log('AI response:', content);

    // Parse the JSON array from the response
    let followups: string[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        followups = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse followups:', parseError);
      // Fallback suggestions
      followups = getFallbackFollowups(lastSenderIsUser);
    }

    const { error: usageErr } = await supabase.from("ai_function_calls").insert({
      user_id: uid,
      function_name: "generate_followups",
      match_id: matchId,
    });
    if (usageErr) {
      console.error("Failed to record ai_function_calls:", usageErr);
    }

    const { error: insertError } = await supabase
      .from("icebreaker_analytics")
      .insert({
        match_id: matchId,
        user_id: uid,
        icebreaker_text: followups.slice(0, 3).join(" | "),
        category: "followup",
        was_used: false,
      });

    if (insertError) {
      console.error("Failed to track follow-up analytics:", insertError);
    }

    const remainingToday = Math.max(0, MAX_FOLLOWUPS_PER_DAY - usedToday);

    return new Response(JSON.stringify({
      followups: followups.slice(0, 3),
      remainingToday,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-followups:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Fallback follow-up suggestions
function getFallbackFollowups(waitingForReply: boolean): string[] {
  if (waitingForReply) {
    // User sent last message, match hasn't replied
    return [
      'Förresten, hur har din vecka varit? Jag hoppas allt är bra!',
      'Jag tänkte på det du sa tidigare - vill du berätta mer?',
      'Har du några spännande planer för helgen?',
    ];
  } else {
    // Match sent last message, user should reply
    return [
      'Det låter verkligen intressant! Berätta mer om det.',
      'Jag håller med! Har du upplevt något liknande förut?',
      'Spännande! Vad fick dig att börja med det?',
    ];
  }
}
