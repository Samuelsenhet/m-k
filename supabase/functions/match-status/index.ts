/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const url = new URL(req.url)
    const user_id = url.searchParams.get('user_id') || user.id

    // Verify user matches
    if (user_id !== user.id) {
      throw new Error('Unauthorized')
    }

    // Use CET timezone for date (Europe/Stockholm)
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' })
    const now = new Date()

    // 1. Check user's onboarding status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', user_id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    // Determine journey phase
    let journey_phase: 'WAITING' | 'READY' | 'FIRST_MATCH' = 'WAITING'
    
    if (!profile.onboarding_completed) {
      journey_phase = 'WAITING'
    } else {
      // Check if matches exist for today
      const { data: todayMatches, error: matchError } = await supabaseClient
        .from('matches')
        .select('id, created_at')
        .eq('user_id', user_id)
        .eq('match_date', today)
        .limit(1)

      if (matchError) throw matchError

      if (todayMatches && todayMatches.length > 0) {
        // Check if this is the first match ever
        const { data: allMatches, error: allMatchError } = await supabaseClient
          .from('matches')
          .select('id')
          .eq('user_id', user_id)
          .order('created_at', { ascending: true })
          .limit(1)

        if (allMatchError) throw allMatchError

        if (allMatches && allMatches.length > 0 && allMatches[0].id === todayMatches[0].id) {
          journey_phase = 'FIRST_MATCH'
        } else {
          journey_phase = 'READY'
        }
      } else {
        // Check if pool exists (means matches are ready to be delivered)
        const { data: matchPool } = await supabaseClient
          .from('user_daily_match_pool')
          .select('id')
          .eq('user_id', user_id)
          .eq('date', today)
          .maybeSingle()

        journey_phase = matchPool ? 'READY' : 'WAITING'
      }
    }

    // 2. Count delivered matches today
    const { data: deliveredMatches, error: deliveredError } = await supabaseClient
      .from('matches')
      .select('id')
      .eq('user_id', user_id)
      .eq('match_date', today)

    if (deliveredError) throw deliveredError

    const delivered_today = deliveredMatches?.length || 0

    // 3. Calculate time remaining until next reset (midnight CET/Europe/Stockholm)
    // Daily reset happens at 00:00 CET
    const tomorrow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }))
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const timeRemainingMs = tomorrow.getTime() - now.getTime()
    const hoursRemaining = Math.floor(timeRemainingMs / (1000 * 60 * 60))
    const minutesRemaining = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60))

    const time_remaining = `${hoursRemaining}h ${minutesRemaining}m`
    const next_reset_time = tomorrow.toISOString()

    return new Response(
      JSON.stringify({
        journey_phase,
        time_remaining,
        delivered_today,
        next_reset_time
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
