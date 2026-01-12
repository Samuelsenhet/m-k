/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Get allowed origin from environment or default to wildcard for development
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type MatchType = 'similar' | 'complementary'

interface DimensionBreakdown {
  dimension: string
  score: number
  alignment: 'high' | 'medium' | 'low'
  description: string
}

interface CandidateUser {
  userId: string
  displayName: string
  avatarUrl?: string
  age?: number
  archetype?: string
  photos?: string[]
  bio?: string
}

interface MatchPoolCandidate {
  user: CandidateUser
  matchType: MatchType
  matchScore: number
  dimensionBreakdown?: DimensionBreakdown[]
  archetypeScore?: number
  anxietyScore?: number
  icebreakers?: string[]
  personalityInsight?: string
  commonInterests?: string[]
}

interface ProfileRelation {
  display_name?: string | null
  avatar_url?: string | null
}

interface ExistingMatchRowDetailed {
  id: string
  matched_user_id: string
  match_type: MatchType
  match_score: number | null
  match_age: number | null
  match_archetype: string | null
  dimension_breakdown?: DimensionBreakdown[] | null
  archetype_score?: number | null
  anxiety_reduction_score?: number | null
  icebreakers?: string[] | null
  personality_insight?: string | null
  photo_urls?: string[] | null
  bio_preview?: string | null
  common_interests?: string[] | null
  profiles?: ProfileRelation | null
}

interface InsertedMatchRow {
  id: string
  matched_user_id: string
  match_type: MatchType
  match_score: number | null
  match_age?: number | null
  match_archetype?: string | null
  dimension_breakdown?: DimensionBreakdown[] | null
  archetype_score?: number | null
  anxiety_reduction_score?: number | null
  icebreakers?: string[] | null
  personality_insight?: string | null
  photo_urls?: string[] | null
  bio_preview?: string | null
  common_interests?: string[] | null
}

interface MatchIdRow {
  matched_user_id: string
}

interface MatchRecordId {
  id: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from auth
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { user_id } = await req.json()
    const requestUserId = user_id || user.id

    // Verify user matches
    if (requestUserId !== user.id) {
      throw new Error('Unauthorized')
    }

    // Use CET timezone for date (Europe/Stockholm)
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' })

    // 1. Check if user has completed onboarding (required for matching)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('onboarding_completed, onboarding_completed_at, subscription_tier')
      .eq('id', requestUserId)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    if (!profile.onboarding_completed) {
      return new Response(
        JSON.stringify({ 
          error: 'Onboarding not completed',
          message: 'Complete onboarding to receive matches',
          journey_phase: 'WAITING'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }

    // 2. Enforce 24-hour waiting period after onboarding (PRP requirement)
    if (profile.onboarding_completed_at) {
      const onboardingTime = new Date(profile.onboarding_completed_at)
      const now = new Date()
      const hoursSinceOnboarding = (now.getTime() - onboardingTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceOnboarding < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceOnboarding)
        const minutesRemaining = Math.round((24 - hoursSinceOnboarding - Math.floor(24 - hoursSinceOnboarding)) * 60)
        
        return new Response(
          JSON.stringify({
            journey_phase: 'WAITING',
            message: 'Din första matchning kommer snart! Vi förbereder dina personliga matchningar.',
            time_remaining: `${hoursRemaining}h ${minutesRemaining}m`,
            next_match_available: new Date(onboardingTime.getTime() + 24 * 60 * 60 * 1000).toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 202 // Accepted but not ready
          }
        )
      }
    }

    // 3. Get or create today's match pool for user
    const { data: matchPool, error: poolError } = await supabaseClient
      .from('user_daily_match_pool')
      .select('*')
      .eq('user_id', requestUserId)
      .eq('date', today)
      .maybeSingle()

    if (poolError) {
      console.error('Pool fetch error:', poolError)
      throw poolError
    }

    // If no pool exists, it means batch hasn't been generated yet
    if (!matchPool) {
      return new Response(
        JSON.stringify({
          date: today,
          batch_size: 0,
          user_limit: profile.subscription_tier === 'plus' || profile.subscription_tier === 'premium' ? null : 5,
          matches: [],
          message: 'Match pool not yet generated for today. Please check back later.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const candidates: MatchPoolCandidate[] = Array.isArray(matchPool.candidates)
      ? matchPool.candidates as MatchPoolCandidate[]
      : []
    
    // 3. Determine delivery count based on subscription tier
    // Free users: capped at 5 (not guaranteed, just max limit)
    // Plus users: uncapped, receive full batch size
    const isPlus = profile.subscription_tier === 'plus' || profile.subscription_tier === 'premium'
    const userLimit = isPlus ? null : 5
    const deliveryCount = isPlus ? candidates.length : Math.min(5, candidates.length)
    
    // If pool has fewer than 5, deliver what's available (no error)
    // Algorithm has already ranked and split 60/40 similar vs complementary

    // 4. Slice the matches based on delivery count
    const matchesToDeliver = candidates.slice(0, deliveryCount)

    // 5. Check if these are already delivered
    const { data: existingMatches } = await supabaseClient
      .from('matches')
      .select('matched_user_id')
      .eq('user_id', requestUserId)
      .eq('match_date', today)

    const existingMatchRows: MatchIdRow[] = (existingMatches ?? []) as MatchIdRow[]
    const alreadyDeliveredIds = new Set(existingMatchRows.map((m) => m.matched_user_id))

    // Filter out already delivered
    const newMatchesToDeliver = matchesToDeliver.filter(
      (match) => !alreadyDeliveredIds.has(match.user.userId)
    )

    // 6. If already delivered, return existing
    if (newMatchesToDeliver.length === 0) {
      // Fetch existing matches and format as MatchOutput
      const { data: existingMatchData, error: existingError } = await supabaseClient
        .from('matches')
        .select('*, profiles!matches_matched_user_id_fkey(display_name, avatar_url)')
        .eq('user_id', requestUserId)
        .eq('match_date', today)

      if (existingError) throw existingError

      const existingDetailedRows: ExistingMatchRowDetailed[] = (existingMatchData ?? []) as ExistingMatchRowDetailed[]

      const formattedMatches = existingDetailedRows.map((m, index) => ({
        match_id: m.id,
        profile_id: m.matched_user_id,
        display_name: m.profiles?.display_name || 'Anonym',
        age: m.match_age || 25,
        archetype: m.match_archetype || 'INFJ',
        compatibility_percentage: m.match_score || 85,
        dimension_score_breakdown: m.dimension_breakdown || [],
        archetype_alignment_score: m.archetype_score || 80,
        conversation_anxiety_reduction_score: m.anxiety_reduction_score || 75,
        ai_icebreakers: (m.icebreakers || ['Hej!', 'Hur mår du?', 'Vad gör du?']).slice(0, 3),
        personality_insight: m.personality_insight || 'Ni delar liknande värderingar',
        match_reason: m.match_type === 'similar' ? '60% liknande värderingar' : '40% kompletterande energi',
        is_first_day_match: index === 0,
        expires_at: null,
        photo_urls: m.photo_urls || [],
        bio_preview: m.bio_preview || '',
        common_interests: m.common_interests || []
      }))

      return new Response(
        JSON.stringify({
          date: today,
          batch_size: deliveryCount,
          user_limit: userLimit,
          matches: formattedMatches
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // 7. Insert new matches into database
    const matchInserts = newMatchesToDeliver.map((match) => ({
      user_id: requestUserId,
      matched_user_id: match.user.userId,
      match_type: match.matchType,
      match_score: match.matchScore,
      match_date: today,
      status: 'pending',
      dimension_breakdown: match.dimensionBreakdown || [],
      archetype_score: match.archetypeScore || 80,
      anxiety_reduction_score: match.anxietyScore || 75,
      icebreakers: match.icebreakers?.slice(0, 3) || ['Hej!', 'Hur mår du?', 'Vad gör du?'], // Always exactly 3
      personality_insight: match.personalityInsight || 'Match insight',
      match_age: match.user.age || 25,
      match_archetype: match.user.archetype || 'INFJ',
      photo_urls: match.user.photos || [],
      bio_preview: match.user.bio || '',
      common_interests: match.commonInterests || []
    }))

    const { data: insertedMatches, error: insertError } = await supabaseClient
      .from('matches')
      .insert(matchInserts)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    // 8. Update last_daily_matches for repeat prevention
    const insertedMatchRows: InsertedMatchRow[] = (insertedMatches ?? []) as InsertedMatchRow[]
    const matchIds = insertedMatchRows.map((m) => m.id)
    await supabaseClient
      .from('last_daily_matches')
      .upsert({
        user_id: requestUserId,
        date: today,
        match_ids: matchIds
      })

    // 10. Check if this is user's first match ever (for celebration)
    const { data: allUserMatches } = await supabaseClient
      .from('matches')
      .select('id')
      .eq('user_id', requestUserId)
      .order('created_at', { ascending: true })
      .limit(10) // Get first 10 to check

    const userMatchRows: MatchRecordId[] = (allUserMatches ?? []) as MatchRecordId[]
    const isFirstMatchEver = userMatchRows.length === insertedMatchRows.length

    // 11. Format response as MatchOutput[]
    const formattedMatches = insertedMatchRows.map((m, index) => ({
      match_id: m.id,
      profile_id: m.matched_user_id,
      display_name: newMatchesToDeliver[index]?.user?.displayName || 'Anonym',
      age: m.match_age || 25,
      archetype: m.match_archetype || 'INFJ',
      compatibility_percentage: m.match_score || 85,
      dimension_score_breakdown: m.dimension_breakdown || [],
      archetype_alignment_score: m.archetype_score || 80,
      conversation_anxiety_reduction_score: m.anxiety_reduction_score || 75,
      ai_icebreakers: (m.icebreakers || ['Hej!', 'Hur mår du?', 'Vad gör du?']).slice(0, 3),
      personality_insight: m.personality_insight || 'Ni delar liknande värderingar',
      match_reason: m.match_type === 'similar' ? '60% liknande värderingar' : '40% kompletterande energi',
      is_first_day_match: index === 0 && isFirstMatchEver,
      expires_at: null,
      special_effects: index === 0 && isFirstMatchEver ? ['confetti', 'celebration'] : null,
      photo_urls: m.photo_urls || [],
      bio_preview: m.bio_preview || '',
      common_interests: m.common_interests || []
    }))
    
    // Determine special event message
    let specialEventMessage: string | null = null
    if (isFirstMatchEver && formattedMatches.length > 0) {
      specialEventMessage = '🎉 Dina första matchningar är här! Lycka till!'
    }

    return new Response(
      JSON.stringify({
        date: today,
        batch_size: deliveryCount,
        user_limit: userLimit,
        matches: formattedMatches,
        special_event_message: specialEventMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
