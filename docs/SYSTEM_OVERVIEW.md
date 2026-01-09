# MÄÄK - System Overview & Architecture

**Last Updated**: 2026-01-09  
**Version**: MVP v1.0  
**Status**: Production-Ready (Backend Complete, Frontend Pending)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      MÄÄK Dating App                         │
│                    (PWA - React + Vite)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                          │
├─────────────────────────────────────────────────────────────┤
│  Auth: Phone OTP (Swedish numbers)                          │
│  Database: PostgreSQL with RLS                              │
│  Storage: Profile photos                                    │
│  Edge Functions: Match delivery + status                    │
│  Realtime: Chat messages                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MATCHING ALGORITHM (Batch-Based)                │
├─────────────────────────────────────────────────────────────┤
│  1. Admin sets global batch size (3-10)                     │
│  2. Algorithm generates personal pool per user              │
│  3. Scoring: 40% personality + 30% archetype + 30% interest│
│  4. Split: 60% similar + 40% complementary                  │
│  5. Delivery: Free (max 5) | Plus (uncapped)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema (14 Tables)

### Core User Data
```
profiles
├─ id (UUID, FK to auth.users)
├─ display_name, bio, location
├─ onboarding_completed (boolean)
├─ onboarding_completed_at (timestamptz) ← 24-hour wait enforcement
├─ subscription_tier (text: 'free' | 'plus' | 'premium')
└─ created_at, updated_at

personality_results
├─ id, user_id
├─ archetype (text: 'Upptäcktsresande', 'Författare', etc.)
├─ dimension_scores (jsonb: {O, C, E, A, N})
└─ created_at

profile_photos
├─ id, user_id
├─ storage_path (text)
├─ display_order (integer)
└─ created_at
```

### Matching System
```
daily_match_batches
├─ id, date (DATE, UNIQUE)
├─ batch_size (integer, CHECK 3-10)
├─ candidate_profiles (jsonb)
└─ generated_at

user_daily_match_pool
├─ id, user_id, date
├─ candidates (jsonb) ← Pre-ranked personal pool
└─ expires_at (null in MVP)

matches
├─ id, user_id, matched_user_id
├─ match_type ('similar' | 'complementary')
├─ match_score, match_date
├─ status ('pending' | 'accepted' | 'rejected')
├─ dimension_breakdown (jsonb)
├─ icebreakers (text[3]) ← Always exactly 3
└─ created_at

last_daily_matches
├─ id, user_id, date
├─ match_ids (UUID[]) ← For repeat prevention
└─ created_at
```

### Communication
```
messages
├─ id, room_id, sender_id
├─ content (text)
├─ read (boolean)
└─ created_at

icebreakers
├─ id, match_id
├─ icebreaker_text (text)
├─ display_order (integer)
├─ used (boolean)
└─ created_at
```

### GDPR & Privacy
```
consents
├─ id, user_id
├─ consent_type ('terms_of_service', 'privacy_policy', 'marketing', 'data_processing')
├─ consented (boolean)
├─ consented_at, withdrawn_at (timestamptz)
├─ ip_address (inet), user_agent (text) ← Audit trail
└─ UNIQUE(user_id, consent_type)

privacy_settings
├─ id, user_id (UNIQUE)
├─ profile_visible, show_age, show_location
├─ discoverable (boolean) ← Can appear in match pools
├─ allow_messages_from ('matches' | 'everyone' | 'none')
├─ read_receipts_enabled, typing_indicators_enabled
├─ email_notifications, match_notifications
└─ created_at, updated_at
```

### Gamification
```
achievements
├─ id, code (UNIQUE)
├─ title, description
├─ badge_icon (text)
└─ created_at

user_achievements
├─ id, user_id, achievement_id
├─ unlocked_at (timestamptz)
└─ UNIQUE(user_id, achievement_id)
```

---

## 🔄 User Journey Flow

### Phase 1: Onboarding (Required)
```
1. Phone Auth (Swedish number + OTP)
   ↓
2. Age Verification (18+ check)
   ↓
3. Personality Test (30 questions, 1-5 Likert)
   ↓
4. Background Info (location, interests)
   ↓
5. Photo Upload (min 3 required)
   ↓
6. Privacy Consent (terms, privacy policy, GDPR)
   ↓
✅ onboarding_completed = true
✅ onboarding_completed_at = NOW()
```

### Phase 2: WAITING (24 Hours)
```
User State: Onboarding complete, but < 24 hours
API Response (match-daily): HTTP 202
{
  "journey_phase": "WAITING",
  "message": "Din första matchning kommer snart!",
  "time_remaining": "18h 42m",
  "next_match_available": "2026-01-10T00:00:00+01:00"
}

Frontend:
- Show mascot idle animation
- Display countdown timer
- Encourage profile completion (bio, more photos)
- Show tips carousel
```

### Phase 3: READY (First Matches Available)
```
User State: >= 24 hours since onboarding, no matches delivered today
API Response (match-status): HTTP 200
{
  "journey_phase": "READY",
  "time_remaining": "12h 15m",
  "delivered_today": 0,
  "next_reset_time": "2026-01-10T00:00:00+01:00"
}

Frontend:
- Show mascot bounce animation
- Display "Your matches are ready!" message
- Button: "View Matches"
```

### Phase 4: FIRST_MATCH (Celebration)
```
User State: First match ever being delivered
API Response (match-daily): HTTP 200
{
  "matches": [{
    "is_first_day_match": true,
    "special_effects": ["confetti", "celebration"],
    ...
  }],
  "special_event_message": "🎉 Dina första matchningar är här!"
}

Frontend:
- Trigger confetti animation
- Show mascot celebration
- Display special message
- Auto-dismiss after 5 seconds
```

### Phase 5: ACTIVE (Daily Matching)
```
User State: Regular daily matches
Flow:
- User logs in at 09:00 CET
- Calls match-daily API
- Receives matches (Free: max 5, Plus: uncapped)
- Can start chatting with matches
- Daily reset at 00:00 CET

Repeat Prevention:
- Yesterday's matches stored in last_daily_matches
- Algorithm filters out recent matches
- Fallback: If all candidates are repeats, re-match anyway
```

---

## 🎯 Matching Algorithm Details

### Dealbreaker Filters (Pre-Scoring)
```typescript
passesDealbreakers(user, candidate) {
  1. ✅ Onboarding completed
  2. ✅ Age within user's interval (e.g., 20-30)
  3. ✅ Gender matches preference (if set)
  4. ✅ Not matched yesterday (if alternatives exist)
}
```

### Scoring Signals (Must Total 100%)
```typescript
SCORE_SIGNALS = {
  PERSONALITY_SIMILARITY: 0.40,  // 40 points max
  ARCHETYPE_ALIGNMENT: 0.30,     // 30 points max
  INTEREST_OVERLAP: 0.30         // 30 points max
}

Composite Score Range: 0-100
```

### 60/40 Split Logic
```typescript
Admin sets: batch_size = 10
Algorithm generates:
- 6 similar matches (highest similarity scores)
- 4 complementary matches (highest complementary scores)

Free Users:
- Receive: min(5, total_matches)
- Cap applied AFTER scoring

Plus Users:
- Receive: all 10 matches (uncapped)
```

### Tie-Breaker (When Scores Equal)
```typescript
Sort Priority:
1. Primary: composite_score
2. Tie-breaker 1: interest_overlap_score
3. Tie-breaker 2: archetype_alignment_score
```

---

## 🔌 API Endpoints

### POST /match-daily
**Purpose**: Deliver today's matches to user

**Request**:
```json
{
  "user_id": "uuid"
}
```

**Response (Success - HTTP 200)**:
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
      "archetype": "Upptäcktsresande",
      "compatibility_percentage": 87,
      "dimension_score_breakdown": [...],
      "ai_icebreakers": ["Q1", "Q2", "Q3"],
      "is_first_day_match": true,
      "special_effects": ["confetti", "celebration"],
      "expires_at": null
    }
  ],
  "special_event_message": "🎉 Dina första matchningar är här!"
}
```

**Response (Waiting - HTTP 202)**:
```json
{
  "journey_phase": "WAITING",
  "message": "Din första matchning kommer snart!",
  "time_remaining": "18h 42m",
  "next_match_available": "2026-01-10T00:00:00+01:00"
}
```

---

### GET /match-status
**Purpose**: Check user's match journey phase and timing

**Request**: `?user_id=uuid`

**Response**:
```json
{
  "journey_phase": "READY",
  "time_remaining": "12h 15m",
  "delivered_today": 0,
  "next_reset_time": "2026-01-10T00:00:00+01:00"
}
```

**Journey Phases**:
- `WAITING`: User completed onboarding < 24 hours ago
- `READY`: Matches available but not yet delivered today
- `FIRST_MATCH`: User receiving first match ever
- `ACTIVE`: User has matches and is actively using app (implied, not returned)

---

## 📦 Tech Stack

### Frontend
```
Framework: React 18 + TypeScript
Build Tool: Vite
UI Library: shadcn/ui (Radix + Tailwind)
State Management: React Context + hooks
Routing: React Router
Animation: Framer Motion (mascot)
PWA: Vite PWA plugin
```

### Backend
```
Platform: Supabase
Auth: Phone OTP (Twilio/Supabase Auth)
Database: PostgreSQL 15
Storage: Supabase Storage (profile photos)
Edge Functions: Deno (match-daily, match-status)
Realtime: Supabase Realtime (chat)
```

### DevOps
```
Hosting: Vercel (PWA)
CI/CD: GitHub Actions
Monitoring: Supabase Dashboard
Analytics: PostHog (planned)
```

---

## 🎨 Design System

### Colors
```css
Primary: hsl(var(--primary)) /* Pink/Purple accent */
Background: hsl(var(--background)) /* White */
Card: hsl(var(--card)) /* Light gray */
Muted: hsl(var(--muted)) /* Subtle gray */
```

### Typography
```css
Font Family: Inter, system-ui, sans-serif
Heading: font-semibold, text-2xl
Body: font-normal, text-base
Caption: font-normal, text-sm, text-muted-foreground
```

### Mascot
```
Character: Friendly, playful mascot
States:
- Idle: Subtle breathing animation
- Bounce: Excited jump (first match)
- Thinking: Tilted head (waiting phase)
- Celebration: Confetti + happy face
```

---

## 🔒 Security & Privacy

### Row Level Security (RLS)
```sql
All tables have RLS enabled:
- Users can only SELECT their own data
- Users can only INSERT/UPDATE/DELETE their own data
- Admins have elevated permissions

Example:
CREATE POLICY "Users view own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id);
```

### GDPR Compliance
```
✅ Consent tracking (4 types)
✅ Privacy settings (granular controls)
✅ Data export (Supabase API)
✅ Data deletion (CASCADE on user delete)
✅ Audit trail (IP + user agent on consent)
```

### Content Moderation (Future)
```
- AI photo screening (planned)
- Profanity filter in messages (planned)
- User reporting system (planned)
- Admin moderation dashboard (planned)
```

---

## 📈 Success Metrics (MVP)

### Engagement
```
First batch open rate: Target 60%+
Icebreaker usage rate: Target 35%+
Message response rate: Target 50%+
```

### Matching Quality
```
Repeat avoidance success: Target 98%+
Compatibility → conversation: Target 25%+
Conversation → real date: Target 15%+
```

### Retention
```
Day 7 retention: Target 40%+
MAU retention: Target 30%+
Plus upgrade rate: Target 5%+
```

### User Satisfaction
```
App rating (iOS): Target 4.5+
NPS score: Target 40+
Support tickets: Target < 5% of users
```

---

## 🚀 Deployment Checklist

### Phase 1: Backend ✅
- [x] Database migrations applied
- [x] Edge functions deployed
- [x] RLS policies tested
- [x] GDPR tables seeded
- [x] API contracts validated

### Phase 2: Frontend ⚠️
- [ ] WaitingPhase component built
- [ ] FirstMatchCelebration component built
- [ ] Journey phase routing implemented
- [ ] Confetti animation added
- [ ] Privacy settings UI created

### Phase 3: Testing 🔵
- [ ] End-to-end user journey tested
- [ ] 24-hour wait period validated
- [ ] First match celebration tested
- [ ] Free vs Plus cap verified
- [ ] Repeat prevention tested

### Phase 4: Launch 🔵
- [ ] PWA deployed to Vercel
- [ ] Domain configured (maak.se)
- [ ] Analytics tracking enabled
- [ ] User documentation published
- [ ] Support channels ready

---

## 📞 Support & Resources

**Documentation**: `/docs/`
- `MATCHING_ALGORITHM_MVP.md` - Complete algorithm spec
- `FREE_VS_PLUS_FEATURE_GATE.md` - Subscription tiers
- `EDGE_CASE_MITIGATION.md` - Risk matrix
- `PRP_COMPLIANCE_AUDIT.md` - Full audit report

**Contact**:
- Technical Issues: GitHub Issues
- Product Questions: Product Team
- Legal/GDPR: Legal Team

**Next Review**: 2026-01-17

---

*This overview is maintained by the Backend Team and updated with each major architecture change.*
