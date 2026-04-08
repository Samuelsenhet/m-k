import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/env.ts";
import { enforceAiRateLimits } from "../_shared/rate_limit_db.ts";
import { resolveMatchedPeerId } from "../_shared/match_peer.ts";

// Get allowed origin from environment or default to wildcard for development
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://maakapp.se";

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Valid icebreaker categories
type IcebreakerCategory = 'funny' | 'deep' | 'activity' | 'compliment' | 'general';

const CATEGORY_PROMPTS: Record<string, Record<IcebreakerCategory, string>> = {
  sv: {
    funny: 'Skapa lättsamma, humoristiska och lekfulla isbrytare som får personen att le eller skratta.',
    deep: 'Skapa meningsfulla och tankeväckande frågor som leder till djupare samtal om livet, drömmar och värderingar.',
    activity: 'Föreslå aktiviteter att göra tillsammans baserat på gemensamma intressen, som "Ska vi testa X tillsammans?"',
    compliment: 'Skapa genuina, respektfulla komplimanger baserade på personens profil eller intressen (inte utseende).',
    general: 'Skapa en blandning av olika stilar - lite humor, lite djup, lite aktivitetsförslag.',
  },
  en: {
    funny: 'Create lighthearted, humorous and playful icebreakers that make the person smile or laugh.',
    deep: 'Create meaningful and thought-provoking questions that lead to deeper conversations about life, dreams and values.',
    activity: 'Suggest activities to do together based on shared interests, like "Want to try X together?"',
    compliment: 'Create genuine, respectful compliments based on the person\'s profile or interests (not appearance).',
    general: 'Create a mix of different styles - some humor, some depth, some activity suggestions.',
  },
};

// Optional situation context for when icebreakers are used
type IcebreakerSituation = 'default' | 'after_video' | 'before_date';

const SITUATION_PROMPTS: Record<string, Record<IcebreakerSituation, string>> = {
  sv: {
    default: '',
    after_video: '\n**Situation:** Användaren har precis avslutat ett kort videomöte (Kemi-Check) med sin match. Isbrytarna ska vara lämpliga för att fortsätta konversationen i chatt – referera gärna till något från videomötet eller föreslå ämnen att fördjupa.',
    before_date: '\n**Situation:** Användaren ska snart träffas på en dejt. Isbrytarna ska vara lämpliga för att bekräfta planer, visa entusiasm eller föreslå konkreta aktiviteter/platser inför träffan.',
  },
  en: {
    default: '',
    after_video: '\n**Situation:** The user just finished a short video call (Chemistry Check) with their match. The icebreakers should be suitable for continuing the conversation in chat – reference the video call or suggest topics to explore.',
    before_date: '\n**Situation:** The user is about to meet their match on a date. The icebreakers should confirm plans, show enthusiasm or suggest specific activities/places for the meetup.',
  },
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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const userId = await verifySupabaseJWT(req.headers.get('Authorization') || '');
    if (!userId) {
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
      situation = 'default',
      userInterests = [],
      matchedUserInterests = [],
      language = 'sv',
    } = await req.json().catch(() => ({}));

    const lang = language === 'en' ? 'en' : 'sv';

    if (!matchId || typeof matchId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'matchId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating icebreakers for match:', matchId, 'by user:', userId);
    console.log('Category:', category, 'Situation:', situation);

    const validCategory: IcebreakerCategory =
      ['funny', 'deep', 'activity', 'compliment', 'general'].includes(category)
        ? category
        : 'general';

    const validSituation: IcebreakerSituation =
      ['default', 'after_video', 'before_date'].includes(situation) ? situation : 'default';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const peerId = await resolveMatchedPeerId(supabase, userId, matchedUserId, matchId);
    if (!peerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rateBlock = await enforceAiRateLimits(supabase, req, userId, 'generate_icebreakers');
    if (rateBlock) {
      const blocked = rateBlock.clone();
      const h = new Headers(blocked.headers);
      h.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
      h.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
      h.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
      return new Response(blocked.body, { status: blocked.status, headers: h });
    }

    let userProfile: ProfileData | null = null;
    let matchedProfile: ProfileData | null = null;
    let userPersonality: PersonalityData | null = null;
    let matchedPersonality: PersonalityData | null = null;

    const [userProfileRes, userPersonalityRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio, looking_for, work, education, hometown')
        .eq('id', userId)
        .single(),
      supabase
        .from('personality_results')
        .select('archetype, category')
        .eq('user_id', userId)
        .single(),
    ]);

    if (userProfileRes.data) userProfile = userProfileRes.data;
    if (userPersonalityRes.data) userPersonality = userPersonalityRes.data;

    const [matchedProfileRes, matchedPersonalityRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio, looking_for, work, education, hometown')
        .eq('id', peerId)
        .single(),
      supabase
        .from('personality_results')
        .select('archetype, category')
        .eq('user_id', peerId)
        .single(),
    ]);

    if (matchedProfileRes.data) matchedProfile = matchedProfileRes.data;
    if (matchedPersonalityRes.data) matchedPersonality = matchedPersonalityRes.data;

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

    // Deeper likhet/motsats explanation for every user (why they are similar or complementary)
    const CATEGORY_TITLES: Record<string, string> = {
      DIPLOMAT: 'Diplomaten',
      STRATEGER: 'Strategen',
      BYGGARE: 'Byggaren',
      UPPTÄCKARE: 'Upptäckaren',
    };
    const CATEGORY_SHORT: Record<string, string> = {
      DIPLOMAT: 'empatisk och värdesätter djupa relationer och harmoni',
      STRATEGER: 'analytisk och målinriktad med förmåga att se helheten',
      BYGGARE: 'praktisk och pålitlig med stark känsla för ansvar och lojalitet',
      UPPTÄCKARE: 'spontan och äventyrlig med passion för nya upplevelser',
    };
    // Why this pair complements each other (user category -> matched category -> insight)
    const COMPLEMENTARY_INSIGHT: Record<string, Record<string, string>> = {
      DIPLOMAT: {
        STRATEGER: 'Din empati och värme kan mjuka upp deras analytiska sida, medan deras tydlighet kan hjälpa dig att sätta gränser.',
        BYGGARE: 'Din känslighet för relationer och deras stabilitet skapar en trygg bas – ni kan ge varandra både djup och tillförlitlighet.',
        UPPTÄCKARE: 'Du bidrar med djup och närhet medan de bidrar med energi och nya perspektiv – tillsammans får ni både ro och äventyr.',
      },
      STRATEGER: {
        DIPLOMAT: 'Din analytiska förmåga och deras empati kompletterar varandra – ni kan ge varandra både struktur och känslomässig förståelse.',
        BYGGARE: 'Ni kombinerar vision med praktik: du ser helheten medan de gör saker verklighet – ett starkt team för att nå mål.',
        UPPTÄCKARE: 'Din strategiska tänkande och deras spontanitet kan balansera varandra – planering möter äventyr.',
      },
      BYGGARE: {
        DIPLOMAT: 'Din stabilitet ger trygghet medan de ger relationen djup och värme – ni skapar en balans mellan ordning och känsla.',
        STRATEGER: 'Du gör saker till verklighet medan de ser helheten – tillsammans kan ni nå långsiktiga mål med förankring i vardagen.',
        UPPTÄCKARE: 'Din pålitlighet och deras spontanitet – du ger grunden, de ger glädjen och de nya impulserna.',
      },
      UPPTÄCKARE: {
        DIPLOMAT: 'Din energi och deras djup – ni kan ge varandra både äventyr och meningsfulla samtal.',
        STRATEGER: 'Din spontanitet och deras strategiska sinne – ni kan inspirera varandra att både planera och leva i nuet.',
        BYGGARE: 'Du bidrar med fart och nyfikethet medan de ger stabilitet och trygghet – en balans mellan äventyr och hem.',
      },
    };
    const userCategory = userPersonality?.category ?? null;
    const matchedCategory = matchedPersonality?.category ?? null;
    const matchType: 'similar' | 'complementary' =
      userCategory && matchedCategory && userCategory === matchedCategory ? 'similar' : 'complementary';
    const userCategoryTitle = userCategory ? CATEGORY_TITLES[userCategory] ?? userCategory : 'samma stil';
    const matchedCategoryTitle = matchedCategory ? CATEGORY_TITLES[matchedCategory] ?? matchedCategory : 'samma stil';
    const userShort = userCategory ? CATEGORY_SHORT[userCategory] ?? '' : '';
    const matchedShort = matchedCategory ? CATEGORY_SHORT[matchedCategory] ?? '' : '';

    let matchTypeExplanation: string;
    if (matchType === 'similar') {
      if (userCategory && userShort) {
        matchTypeExplanation =
          `Du och ${matchedDisplayName} är båda ${userCategoryTitle} – ni är ${userShort}. ` +
          `Som likhetsmatch delar ni samma personlighetskategori, vilket ofta gör det lättare att förstå varandras behov och värdesätta samma saker i en relation.`;
      } else {
        matchTypeExplanation =
          `Ni är en likhetsmatch – ni delar liknande personlighetsdrag och värderingar, vilket ofta gör det lättare att känna samhörighet i en relation.`;
      }
    } else {
      const pairInsight =
        userCategory && matchedCategory && COMPLEMENTARY_INSIGHT[userCategory]?.[matchedCategory]
          ? COMPLEMENTARY_INSIGHT[userCategory][matchedCategory]
          : 'Era olika styrkor kan komplettera varandra och ge nya perspektiv i förhållandet.';
      if (userCategory && matchedCategory && userShort && matchedShort) {
        matchTypeExplanation =
          `Du är ${userCategoryTitle} – du är ${userShort}. ${matchedDisplayName} är ${matchedCategoryTitle} – hen är ${matchedShort}. ` +
          `Som motsatsmatch kompletterar ni varandra: ${pairInsight}`;
      } else {
        matchTypeExplanation =
          `Ni är en motsatsmatch – era personligheter kompletterar varandra. ${pairInsight}`;
      }
    }

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
    const categoryPrompt = CATEGORY_PROMPTS[lang]?.[validCategory] ?? CATEGORY_PROMPTS.sv[validCategory];
    const situationPrompt = SITUATION_PROMPTS[lang]?.[validSituation] ?? SITUATION_PROMPTS.sv[validSituation];

    if (lang === 'en') {
      prompt += `\n**Style:** ${categoryPrompt}${situationPrompt}

Create three unique icebreakers that:
1. Are friendly and respectful
2. Encourage deeper conversation
3. Consider both people's profiles and interests
4. Are in English
5. Reference specific details from the profiles when possible

Reply ONLY with a JSON array of exactly 3 strings, nothing else:
["icebreaker 1", "icebreaker 2", "icebreaker 3"]`;
    } else {
      prompt += `\n**Stil:** ${categoryPrompt}${situationPrompt}

Skapa tre unika isbrytare som:
1. Är vänliga och respektfulla
2. Uppmuntrar till djupare konversation
3. Tar hänsyn till båda personernas profiler och intressen
4. Är på svenska
5. Refererar till specifika detaljer från profilerna när möjligt

Svara ENDAST med ett JSON-array med exakt 3 strängar, inget annat:
["icebreaker 1", "icebreaker 2", "icebreaker 3"]`;
    }

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
          { role: 'system', content: lang === 'en'
            ? 'You are a helpful assistant generating conversation starters for a dating app. Always reply in English. Be creative and personal based on the profile information.'
            : 'Du är en hjälpsam assistent som genererar konversationsstartare för en svensk dejtingapp. Svara alltid på svenska. Var kreativ och personlig baserat på profilinformationen.'
          },
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
      icebreakers = getFallbackIcebreakers(validCategory, commonInterests, lang);
    }

    // Store icebreakers in database with category (replace any previous set for this match)
    await supabase.from('icebreakers').delete().eq('match_id', matchId);

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

    // Save AI explanation as a comment on this matching (so it shows on every match card/profile)
    if (matchId && matchTypeExplanation) {
      const { error: updateErr } = await supabase
        .from('matches')
        .update({ personality_insight: matchTypeExplanation })
        .eq('id', matchId);
      if (updateErr) {
        console.error('Failed to save match type explanation:', updateErr);
      }
    }

    return new Response(JSON.stringify({
      icebreakers,
      category: validCategory,
      situation: validSituation,
      matchType,
      matchTypeExplanation,
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

// Fallback icebreakers by category and language
function getFallbackIcebreakers(category: IcebreakerCategory, commonInterests: string[], lang = 'sv'): string[] {
  if (lang === 'en') {
    const mention = commonInterests.length > 0
      ? ` I noticed we both like ${commonInterests[0]}!`
      : '';
    switch (category) {
      case 'funny':
        return [
          `Hey!${mention} If you were a pizza topping, which one would you be and why? 🍕`,
          `Tell me your most embarrassing but funny story - I promise not to judge! 😄`,
          `Hey there! What's the weirdest thing you've googled this week?`,
        ];
      case 'deep':
        return [
          `Hey!${mention} What's something you're passionate about that most people don't know?`,
          `If you could send a message to yourself 10 years ago, what would it be?`,
          `What's the most important lesson life has taught you so far?`,
        ];
      case 'activity':
        return [
          `Hey!${mention} Would you like to grab a coffee sometime?`,
          `Have you tried anything new and interesting lately that you'd like to share?`,
          `How about exploring a new restaurant together?`,
        ];
      case 'compliment':
        return [
          `Hey! I got curious about you -${mention} your profile seemed genuinely interesting!`,
          `You seem to have a fascinating life story - I'd love to hear more!`,
          `I liked what you wrote about yourself - feels like you know what you want!`,
        ];
      default:
        return [
          `Hey! I saw that we matched -${mention} what do you like to do on a day off?`,
          `Hey there! Tell me about the last thing that made you laugh?`,
          `Hey! What's the best thing about being you?`,
        ];
    }
  }

  const mention = commonInterests.length > 0
    ? ` Jag såg att vi båda gillar ${commonInterests[0]}!`
    : '';
  switch (category) {
    case 'funny':
      return [
        `Hej!${mention} Om du vore en pizza-topping, vilken skulle du vara och varför? 🍕`,
        `Berätta om din mest pinsamma men roliga historia - jag lovar att inte döma! 😄`,
        `Hej där! Vad är det konstigaste du har googlat den här veckan?`,
      ];
    case 'deep':
      return [
        `Hej!${mention} Vad är något du brinner för som de flesta inte vet om dig?`,
        `Om du kunde skicka ett meddelande till dig själv för 10 år sedan, vad skulle det vara?`,
        `Vad är den viktigaste lärdomen livet har lärt dig hittills?`,
      ];
    case 'activity':
      return [
        `Hej!${mention} Skulle du vilja ta en fika någon gång?`,
        `Har du testat något nytt intressant på sistone som du skulle vilja dela med dig av?`,
        `Vad sägs om att utforska en ny restaurang tillsammans?`,
      ];
    case 'compliment':
      return [
        `Hej! Jag blev nyfiken på dig -${mention} din profil verkade genuint intressant!`,
        `Du verkar ha en spännande livshistoria - skulle gärna höra mer!`,
        `Jag gillade det du skrev om dig själv - känns som du vet vad du vill!`,
      ];
    default:
      return [
        `Hej! Jag såg att vi matchade -${mention} vad gör du helst på en ledig dag?`,
        `Hej där! Berätta om det senaste som fick dig att skratta?`,
        `Hej! Vad är det bästa med att vara du?`,
      ];
  }
}
