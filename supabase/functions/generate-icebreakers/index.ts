import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get allowed origin from environment or default to wildcard for development
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid icebreaker categories
type IcebreakerCategory = 'funny' | 'deep' | 'activity' | 'compliment' | 'general';

const CATEGORY_PROMPTS: Record<IcebreakerCategory, string> = {
  funny: 'Skapa lättsamma, humoristiska och lekfulla isbrytare som får personen att le eller skratta.',
  deep: 'Skapa meningsfulla och tankeväckande frågor som leder till djupare samtal om livet, drömmar och värderingar.',
  activity: 'Föreslå aktiviteter att göra tillsammans baserat på gemensamma intressen, som "Ska vi testa X tillsammans?"',
  compliment: 'Skapa genuina, respektfulla komplimanger baserade på personens profil eller intressen (inte utseende).',
  general: 'Skapa en blandning av olika stilar - lite humor, lite djup, lite aktivitetsförslag.',
};

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  looking_for: string | null;
  work: string | null;
  education: string | null;
  hometown: string | null;
}

interface PersonalityData {
  archetype: string | null;
  category: string | null;
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

    const {
      matchId,
      userArchetype,
      matchedUserArchetype,
      userName,
      matchedUserName,
      matchedUserId,
      category = 'general',
      // Optional: pre-provided interests (from match data)
      userInterests = [],
      matchedUserInterests = [],
    } = await req.json();

    console.log('Generating icebreakers for match:', matchId, 'by user:', user.id);
    console.log('Category:', category);

    // Validate category
    const validCategory: IcebreakerCategory =
      ['funny', 'deep', 'activity', 'compliment', 'general'].includes(category)
        ? category
        : 'general';

    // Create service client to fetch profiles
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch both profiles for richer context
    let userProfile: ProfileData | null = null;
    let matchedProfile: ProfileData | null = null;
    let userPersonality: PersonalityData | null = null;
    let matchedPersonality: PersonalityData | null = null;

    // Fetch user's profile and personality
    const [userProfileRes, userPersonalityRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio, looking_for, work, education, hometown')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('personality_results')
        .select('archetype, category')
        .eq('user_id', user.id)
        .single(),
    ]);

    if (userProfileRes.data) userProfile = userProfileRes.data;
    if (userPersonalityRes.data) userPersonality = userPersonalityRes.data;

    // Fetch matched user's profile and personality if we have their ID
    if (matchedUserId) {
      const [matchedProfileRes, matchedPersonalityRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, bio, looking_for, work, education, hometown')
          .eq('user_id', matchedUserId)
          .single(),
        supabase
          .from('personality_results')
          .select('archetype, category')
          .eq('user_id', matchedUserId)
          .single(),
      ]);

      if (matchedProfileRes.data) matchedProfile = matchedProfileRes.data;
      if (matchedPersonalityRes.data) matchedPersonality = matchedPersonalityRes.data;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build rich context for the AI prompt
    const userDisplayName = userName || userProfile?.display_name || 'Användare';
    const matchedDisplayName = matchedUserName || matchedProfile?.display_name || 'Match';
    const userArch = userArchetype || userPersonality?.archetype || 'Okänd';
    const matchedArch = matchedUserArchetype || matchedPersonality?.archetype || 'Okänd';

    // Find common interests
    const commonInterests = userInterests.filter((i: string) =>
      matchedUserInterests.some((mi: string) => mi.toLowerCase() === i.toLowerCase())
    );

    // Build profile context sections
    const buildProfileContext = (
      name: string,
      archetype: string,
      profile: ProfileData | null,
      interests: string[]
    ): string => {
      const lines = [`${name} (${archetype})`];

      if (interests.length > 0) {
        lines.push(`- Intressen: ${interests.join(', ')}`);
      }
      if (profile?.bio) {
        // Truncate bio to first 100 chars
        const bioPreview = profile.bio.length > 100
          ? profile.bio.substring(0, 100) + '...'
          : profile.bio;
        lines.push(`- Om sig själv: "${bioPreview}"`);
      }
      if (profile?.looking_for) {
        lines.push(`- Söker: ${profile.looking_for}`);
      }
      if (profile?.work) {
        lines.push(`- Jobb: ${profile.work}`);
      }
      if (profile?.hometown) {
        lines.push(`- Från: ${profile.hometown}`);
      }

      return lines.join('\n');
    };

    const userContext = buildProfileContext(userDisplayName, userArch, userProfile, userInterests);
    const matchedContext = buildProfileContext(matchedDisplayName, matchedArch, matchedProfile, matchedUserInterests);

    // Build the enhanced prompt
    let prompt = `Du är en expert på dejting och personlighetstyper. Generera 3 kreativa, personliga och engagerande konversationsstartare för en match mellan två personer på en dejtingapp.

**Person 1:**
${userContext}

**Person 2:**
${matchedContext}
`;

    // Add common interests if any
    if (commonInterests.length > 0) {
      prompt += `\n**Gemensamma intressen:** ${commonInterests.join(', ')}\n`;
    }

    // Add category-specific instructions
    prompt += `\n**Stil:** ${CATEGORY_PROMPTS[validCategory]}

Skapa tre unika isbrytare som:
1. Är vänliga och respektfulla
2. Uppmuntrar till djupare konversation
3. Tar hänsyn till båda personernas profiler och intressen
4. Är på svenska
5. Refererar till specifika detaljer från profilerna när möjligt

Svara ENDAST med ett JSON-array med exakt 3 strängar, inget annat:
["icebreaker 1", "icebreaker 2", "icebreaker 3"]`;

    console.log('Enhanced prompt with profile context');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du är en hjälpsam assistent som genererar konversationsstartare för en svensk dejtingapp. Svara alltid på svenska. Var kreativ och personlig baserat på profilinformationen.' },
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
      // Fallback icebreakers based on category
      icebreakers = getFallbackIcebreakers(validCategory, commonInterests);
    }

    // Store icebreakers in database with category
    const icebreakerInserts = icebreakers.slice(0, 3).map((text, index) => ({
      match_id: matchId,
      icebreaker_text: text,
      display_order: index,
      category: validCategory,
    }));

    const { error: insertError } = await supabase
      .from('icebreakers')
      .insert(icebreakerInserts);

    if (insertError) {
      console.error('Failed to insert icebreakers:', insertError);
    }

    return new Response(JSON.stringify({
      icebreakers,
      category: validCategory,
    }), {
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

// Fallback icebreakers by category
function getFallbackIcebreakers(category: IcebreakerCategory, commonInterests: string[]): string[] {
  const interestMention = commonInterests.length > 0
    ? ` Jag såg att vi båda gillar ${commonInterests[0]}!`
    : '';

  switch (category) {
    case 'funny':
      return [
        `Hej!${interestMention} Om du vore en pizza-topping, vilken skulle du vara och varför? 🍕`,
        `Berätta om din mest pinsamma men roliga historia - jag lovar att inte döma! 😄`,
        `Hej där! Vad är det konstigaste du har googlat den här veckan?`,
      ];
    case 'deep':
      return [
        `Hej!${interestMention} Vad är något du brinner för som de flesta inte vet om dig?`,
        `Om du kunde skicka ett meddelande till dig själv för 10 år sedan, vad skulle det vara?`,
        `Vad är den viktigaste lärdomen livet har lärt dig hittills?`,
      ];
    case 'activity':
      return [
        `Hej!${interestMention} Skulle du vilja ta en fika någon gång?`,
        `Har du testat något nytt intressant på sistone som du skulle vilja dela med dig av?`,
        `Vad sägs om att utforska en ny restaurang tillsammans?`,
      ];
    case 'compliment':
      return [
        `Hej! Jag blev nyfiken på dig -${interestMention} din profil verkade genuint intressant!`,
        `Du verkar ha en spännande livshistoria - skulle gärna höra mer!`,
        `Jag gillade det du skrev om dig själv - känns som du vet vad du vill!`,
      ];
    default:
      return [
        `Hej! Jag såg att vi matchade -${interestMention} vad gör du helst på en ledig dag?`,
        `Hej där! Berätta om det senaste som fick dig att skratta?`,
        `Hej! Vad är det bästa med att vara du?`,
      ];
  }
}
