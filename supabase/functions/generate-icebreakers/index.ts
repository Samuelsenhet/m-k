import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get allowed origin from environment or default to wildcard for development
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { matchId, userArchetype, matchedUserArchetype, userName, matchedUserName } = await req.json();
    
    console.log('Generating icebreakers for match:', matchId, 'by user:', user.id);
    console.log('User archetype:', userArchetype, 'Matched archetype:', matchedUserArchetype);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Du är en expert på dejting och personlighetstyper. Generera 3 kreativa, personliga och engagerande konversationsstartare för en match mellan två personer på en dejtingapp.

Person 1: ${userName || 'Användare'} (${userArchetype})
Person 2: ${matchedUserName || 'Match'} (${matchedUserArchetype})

Baserat på deras personlighetstyper, skapa tre unika icebreakers som:
1. Är vänliga och respektfulla
2. Uppmuntrar till djupare konversation
3. Tar hänsyn till båda personernas personlighetstyper
4. Är på svenska

Svara ENDAST med ett JSON-array med exakt 3 strängar, inget annat:
["icebreaker 1", "icebreaker 2", "icebreaker 3"]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du är en hjälpsam assistent som genererar konversationsstartare för en svensk dejtingapp. Svara alltid på svenska.' },
          { role: 'user', content: prompt }
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
    let icebreakers: string[];
    try {
      // Extract JSON array from response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        icebreakers = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse icebreakers:', parseError);
      // Fallback icebreakers
      icebreakers = [
        `Hej! Jag såg att vi matchade - vad gör du helst på en ledig dag?`,
        `Hej där! Berätta om det senaste som fick dig att skratta?`,
        `Hej! Vad är det bästa med att vara du?`,
      ];
    }

    // Store icebreakers in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const icebreakerInserts = icebreakers.slice(0, 3).map((text, index) => ({
      match_id: matchId,
      icebreaker_text: text,
      display_order: index,
    }));

    const { error: insertError } = await supabase
      .from('icebreakers')
      .insert(icebreakerInserts);

    if (insertError) {
      console.error('Failed to insert icebreakers:', insertError);
    }

    return new Response(JSON.stringify({ icebreakers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-icebreakers:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
