# MÄÄK Matching Algorithm - MVP Implementation

## Overview
This document describes the complete matching algorithm flow as implemented in the MÄÄK dating app MVP.

## Core Principles

1. **Admin-Controlled Batch System**: Admin sets global daily batch size (3-10 matches)
2. **Age as Dealbreaker Only**: Age interval is a filter, NOT a scoring signal (all users 20+)
3. **60/40 Split**: Always 60% similar + 40% complementary personality matches
4. **Free User Cap**: Max 5 matches at delivery (not guaranteed, just capped)
5. **Plus Users**: Uncapped, receive up to full global batch size
6. **Repeat Prevention**: Same match cannot appear 2 days in a row if alternatives exist (repeats allowed if no alternatives)
7. **3 Icebreakers**: Every match must have exactly 3 AI-generated icebreakers
8. **CET Reset**: Daily reset at 00:00 CET (Europe/Stockholm timezone)

## Scoring Signals (Total: 100%)

| Signal | Weight | Purpose |
|--------|--------|---------|
| Personality Similarity | 40% | MBTI-based trait alignment |
| Archetype Alignment | 30% | Diplomat/Strategist/Builder/Explorer compatibility |
| Interest Overlap | 30% | Common hobbies and topics |

**Note**: Age and conversation anxiety are NOT scoring signals. Age is filtered as a dealbreaker before scoring begins.

## Daily Match Generation Flow

### 1. Admin Sets Global Batch (00:00 CET)
```
Admin Dashboard:
  - Set batch_size (3-10)
  - Store in daily_match_batches table
  - Fetch all onboarded profiles
```

### 2. Generate User-Specific Match Pools
```
FOR EACH user in onboarded_profiles:
  
  // STEP 1: Apply Dealbreaker Filters
  candidates = batch_candidates
    .filter(age >= user.min_age AND age <= user.max_age)  // Age interval dealbreaker
    .filter(gender matches user.interested_in)            // Gender preference
    .filter(completed onboarding)                         // Eligibility requirement
    .filter(not in last_daily_matches OR no alternatives) // Repeat prevention with fallback
  
  // STEP 2: Score Remaining Candidates
  scored_candidates = candidates.map(candidate => {
    personality_score = calculateSimilarityScore(user.scores, candidate.scores)
    archetype_score = calculateArchetypeAlignment(user.archetype, candidate.archetype)
    interest_score = calculateInterestOverlap(user.interests, candidate.interests)
    
    composite_score = (
      personality_score * 0.40 +
      archetype_score * 0.30 +
      interest_score * 0.30
    )
    
    return { candidate, composite_score, personality_score, ... }
  })
  
  // STEP 3: Split 60/40 Similar vs Complementary
  similar_count = ceil(batch_size * 0.6)
  complementary_count = batch_size - similar_count
  
  similar_matches = scored_candidates
    .sort_by(personality_similarity DESC)
    .take(similar_count)
  
  complementary_matches = scored_candidates
    .exclude(similar_matches)
    .sort_by(complementary_score DESC)
    .take(complementary_count)
  
  // STEP 4: Combine and Store
  user_pool = shuffle(similar_matches + complementary_matches)
  
  INSERT INTO user_daily_match_pool (user_id, date, candidates)
  VALUES (user.id, TODAY, user_pool)
```

### 3. Match Delivery (When User Opens App)
```
POST /match/daily

// Check user eligibility
if (!user.onboarding_completed):
  return ERROR "Complete onboarding first"

// Fetch user's pre-generated pool
pool = SELECT candidates FROM user_daily_match_pool 
       WHERE user_id = {user} AND date = TODAY (CET)

if (pool is empty):
  return {
    date: TODAY,
    batch_size: 0,
    user_limit: (user.tier === 'free' ? 5 : null),
    matches: [],
    message: "Match pool not yet generated"
  }

// FEATURE GATE: Free vs Plus
if (user.subscription_tier === 'free'):
  user_limit = 5
  delivery_count = min(5, pool.length) // Cap at 5, or deliver what's available
else if (user.subscription_tier === 'plus'):
  user_limit = null
  delivery_count = pool.length // Uncapped, deliver full batch

// Algorithm has already ranked and split 60/40
// Delivery layer just caps the count for free users
matches_to_deliver = pool.slice(0, delivery_count)

// Check if already delivered
existing_matches = SELECT * FROM matches 
                   WHERE user_id = {user} AND match_date = TODAY

if (existing_matches.length > 0):
  return {
    date: TODAY,
    batch_size: existing_matches.length,
    user_limit,
    matches: existing_matches as MatchOutput[]
  }

// Insert new matches
INSERT INTO matches (user_id, matched_user_id, match_type, match_score, ...)
VALUES (...matches_to_deliver)

// Update repeat prevention tracker
INSERT INTO last_daily_matches (user_id, date, match_ids)
VALUES ({user}, TODAY, [match1.id, match2.id, ...])

// Format as MatchOutput
return {
  date: TODAY,
  batch_size: delivery_count,
  user_limit,
  matches: matches.map(m => ({
    match_id: m.id,
    compatibility_percentage: m.match_score,
    dimension_score_breakdown: [...],
    ai_icebreakers: [icebreaker1, icebreaker2, icebreaker3], // Always exactly 3
    personality_insight: "Ni delar liknande värderingar",
    is_first_day_match: (index === 0),
    expires_at: null, // Always null in MVP
    ...
  }))
}
```

### 4. Match Status Check
```
GET /match/status

// Determine journey phase
if (!user.onboarding_completed):
  journey_phase = 'WAITING'
else if (has_matches_today):
  if (first_match_ever):
    journey_phase = 'FIRST_MATCH'
  else:
    journey_phase = 'READY'
else if (pool_exists_today):
  journey_phase = 'READY'
else:
  journey_phase = 'WAITING'

// Calculate time remaining
next_reset = tomorrow_at_00_00_CET
time_remaining = next_reset - now

return {
  journey_phase,
  time_remaining,
  delivered_today,
  next_reset_time
}
```

## Mascot UX States

| State | Trigger | Animation | Action |
|-------|---------|-----------|--------|
| **WAITING** | No pool yet or onboarding incomplete | Idle + bubbles | Show countdown to next batch |
| **READY** | Pool exists but not delivered | Bounce + toast | CTA: "Visa matchningar" |
| **FIRST_MATCH** | First ever match delivered | Confetti + voice bubble | Celebration animation |

## Edge Cases Handled

### 1. No Alternatives for Repeat Prevention
```
If last_matched_candidate is still top ranked:
  - If other candidates exist → skip to next best
  - If NO other candidates → allow repeat
  - Never deliver 0 matches if any candidate exists
  - Free users still capped at min(5, available)
```

### 2. Insufficient Candidates in Pool
```
If eligible_candidates.length < batch_size:
  - Generate pool with available candidates
  - Free users get min(5, available) // Not guaranteed 5
  - Plus users get all available (uncapped)
  
Example:
  - Pool has 3 candidates
  - Free user receives: 3 matches (not error, just what's available)
  - Plus user receives: 3 matches
```

### 3. Already Delivered Today
```
If matches already exist for today:
  - Return existing matches with user_limit field
  - Do not regenerate
  - Maintain consistency
```

### 4. Daily Reset Timing
```
Reset happens at 00:00 CET (Europe/Stockholm timezone)
All date calculations use CET, not UTC
Ensures consistent reset time across DST changes
```

## Database Tables

### daily_match_batches
```sql
id UUID PRIMARY KEY
date DATE UNIQUE
batch_size INTEGER CHECK (3-10)
candidate_profiles JSONB
generated_at TIMESTAMPTZ
```

### user_daily_match_pool
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
date DATE
candidates JSONB -- Pre-scored and ranked matches
expires_at TIMESTAMPTZ -- NULL in MVP
UNIQUE(user_id, date)
```

### last_daily_matches
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
date DATE
match_ids UUID[] -- Track yesterday's matches
UNIQUE(user_id, date)
```

### icebreakers_used
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
match_id UUID REFERENCES matches
selected_icebreaker_text TEXT
used_at TIMESTAMPTZ
UNIQUE(user_id, match_id)
```

## API Contract

### POST /match/daily
**Request:**
```json
{
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "date": "2026-01-09",
  "batch_size": 5,
  "user_limit": 5,
  "matches": [
    {
      "match_id": "uuid",
      "profile_id": "uuid",
      "display_name": "Anna",
      "age": 28,
      "archetype": "INFJ",
      "compatibility_percentage": 87,
      "dimension_score_breakdown": [
        { "dimension": "personality", "score": 85, "alignment": "high" },
        { "dimension": "archetype", "score": 90, "alignment": "high" },
        { "dimension": "interests", "score": 75, "alignment": "high" }
      ],
      "archetype_alignment_score": 90,
      "conversation_anxiety_reduction_score": 0,
      "ai_icebreakers": [
        "Jag såg att du gillar hiking! Har du någon favoritrutt?",
        "Vilken typ av musik lyssnar du på?",
        "Vad gör du på en perfekt lördag?"
      ],
      "personality_insight": "Ni delar liknande värderingar och kommunikationsstil",
      "match_reason": "60% liknande värderingar",
      "is_first_day_match": true,
      "expires_at": null,
      "photo_urls": ["url1", "url2"],
      "bio_preview": "Älskar natur och musik...",
      "common_interests": ["hiking", "music", "reading"]
    }
  ]
}
```

**Note:** `user_limit` is `5` for free users, `null` for Plus users (uncapped).

**Response (Plus User):**
```json
{
  "date": "2026-01-09",
  "batch_size": 8,
  "user_limit": null,
  "matches": [...]
}
```

### GET /match/status
**Request:** `?user_id=uuid`

**Response:**
```json
{
  "journey_phase": "READY",
  "time_remaining": "23h 45m",
  "delivered_today": 5,
  "next_reset_time": "2026-01-10T00:00:00Z"
}
```

## Key Differences from Original Plan

| Original | MVP Implementation |
|----------|-------------------|
| Age as 20% scoring signal | Age as dealbreaker filter only |
| Conversation anxiety 15% | Removed from scoring |
| Engagement multipliers | Removed - fixed batch size |
| Individual match limits | Delivery cap only (not stored) |
| Variable match count per user | Fixed batch size for all |
| No repeat prevention fallback | Allow repeats if no alternatives |

## Testing Checklist

- [ ] Free user receives max 5 matches even if batch is 10
- [ ] Plus user receives full batch (e.g., 8 if batch_size = 8)
- [ ] If pool has 3 candidates, free user gets 3 (not error)
- [ ] If pool has 3 candidates, plus user gets 3
- [ ] `user_limit` field is 5 for free users
- [ ] `user_limit` field is null for plus users
- [ ] Age filter blocks candidates outside min_age-max_age
- [ ] 60% matches are marked as 'similar'
- [ ] 40% matches are marked as 'complementary'
- [ ] No repeat matches 2 days in a row (if alternatives exist)
- [ ] Repeats ARE allowed if no alternatives available
- [ ] Every match has exactly 3 icebreakers
- [ ] `expires_at` is always null
- [ ] FIRST_MATCH phase triggers on first ever match
- [ ] READY phase shows when pool exists
- [ ] WAITING phase shows when no pool yet
- [ ] Daily reset happens at 00:00 CET (Europe/Stockholm)
- [ ] Dates use CET timezone, not UTC

## Implementation Files

- `/src/lib/matching.ts` - Core algorithm
- `/supabase/migrations/20260109000001_create_batch_matching_system.sql` - Database schema
- `/supabase/functions/match-daily/index.ts` - Delivery API
- `/supabase/functions/match-status/index.ts` - Status API
