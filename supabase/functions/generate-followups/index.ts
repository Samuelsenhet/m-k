import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get allowed origin from environment or default to wildcard for development
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Max follow-up requests per match per day
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // Create client with user's auth token to verify identity
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') || '' },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { matchId, messageCount = 10 } = await req.json();

    if (!matchId) {
      return new Response(
        JSON.stringify({ error: 'matchId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating follow-ups for match:', matchId, 'by user:', user.id);

    // Create service client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is part of this match
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('id, user_id, matched_user_id')
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      return new Response(
        JSON.stringify({ error: 'Match not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is part of this match
    if (matchData.user_id !== user.id && matchData.matched_user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized to access this match' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine the match partner's ID
    const matchedUserId = matchData.user_id === user.id
      ? matchData.matched_user_id
      : matchData.user_id;

    // Rate limiting: Check how many follow-up requests today for this match
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayCount, error: countError } = await supabase
      .from('icebreaker_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .eq('category', 'followup')
      .gte('created_at', todayStart.toISOString());

    if (countError) {
      console.error('Error checking rate limit:', countError);
    }

    if ((todayCount || 0) >= MAX_FOLLOWUPS_PER_DAY) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Du har använt alla förslag för idag. Försök igen imorgon.',
          remainingToday: 0,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch last N messages from conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(Math.min(messageCount, 20)); // Cap at 20 messages

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw new Error('Failed to fetch conversation history');
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No messages found',
          message: 'Starta en konversation först innan du ber om förslag.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reverse to get chronological order
    const chronologicalMessages = (messages as Message[]).reverse();

    // Fetch both users' profiles and personalities
    const [userProfileRes, userPersonalityRes, matchedProfileRes, matchedPersonalityRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('personality_results')
        .select('archetype')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('profiles')
        .select('display_name, bio')
        .eq('user_id', matchedUserId)
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
        const senderName = msg.sender_id === user.id ? userName : matchedName;
        return `${senderName}: ${msg.content}`;
      })
      .join('\n');

    // Determine conversation context
    const lastMessage = chronologicalMessages[chronologicalMessages.length - 1];
    const lastSenderIsUser = lastMessage?.sender_id === user.id;

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

    // Track this follow-up request in analytics (for rate limiting)
    const { error: insertError } = await supabase
      .from('icebreaker_analytics')
      .insert({
        match_id: matchId,
        user_id: user.id,
        icebreaker_text: followups.slice(0, 3).join(' | '),
        category: 'followup',
        was_used: false,
      });

    if (insertError) {
      console.error('Failed to track follow-up usage:', insertError);
    }

    const remainingToday = MAX_FOLLOWUPS_PER_DAY - ((todayCount || 0) + 1);

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
