# PRD: Enhanced AI Icebreakers

## Introduction

Upgrade MÄÄK's AI icebreaker system from basic personality-based suggestions to a context-aware, categorized, and learning system. Currently, icebreakers only consider personality archetypes. This enhancement will use interests, hobbies, and profile data to generate more relevant conversation starters, offer category-based options, provide follow-up suggestions during conversations, and track which icebreakers lead to successful conversations.

## Goals

- Generate icebreakers using full profile context (interests, hobbies, photos, profile prompts)
- Offer categorized icebreakers (funny, deep, activity-based, compliment-based)
- Provide AI-powered follow-up suggestions based on conversation history
- Track icebreaker performance to improve future suggestions
- Increase conversation initiation rate by 30%
- Reduce "conversation stall" (matches that never message) by 25%

## User Stories

### US-001: Add icebreaker_analytics table

**Description:** As a product owner, I want to track icebreaker usage and outcomes so that we can learn which types work best.

**Acceptance Criteria:**
- [ ] Create migration `20260118_add_icebreaker_analytics.sql`
- [ ] Table `icebreaker_analytics` with columns:
  - `id` (uuid, primary key)
  - `match_id` (uuid, references matches)
  - `user_id` (uuid, references profiles)
  - `icebreaker_text` (text)
  - `category` (text, nullable)
  - `was_used` (boolean, default false)
  - `led_to_response` (boolean, nullable)
  - `response_time_seconds` (integer, nullable)
  - `created_at` (timestamptz)
- [ ] Add RLS policy: users can only see their own analytics
- [ ] Add index on `match_id` and `user_id`
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-002: Add icebreaker category enum

**Description:** As a developer, I want a standardized category system for icebreakers so that users can choose their preferred style.

**Acceptance Criteria:**
- [ ] Create migration `20260118_add_icebreaker_category.sql`
- [ ] Add `category` column to `icebreakers` table (text, nullable)
- [ ] Valid categories: `funny`, `deep`, `activity`, `compliment`, `general`
- [ ] Add TypeScript type `IcebreakerCategory` in `src/types/api.ts`
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-003: Update generate-icebreakers for profile context

**Description:** As a MÄÄK user, I want icebreakers that reference my match's actual interests so that conversations feel more personal and relevant.

**Acceptance Criteria:**
- [x] Fetch both users' profiles (interests, bio, looking_for) in edge function
- [x] Include interests array in AI prompt
- [x] Include any shared interests as "connection points"
- [x] AI prompt updated to reference specific hobbies/interests
- [x] Fallback to personality-only if no interests available
- [x] Edge function returns 200 with enhanced icebreakers
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Test Edge Function locally or via Supabase dashboard

---

### US-004: Add category selection to icebreaker generation

**Description:** As a MÄÄK user, I want to choose the style of icebreaker (funny, deep, activity-based) so that I can match my mood and personality.

**Acceptance Criteria:**
- [x] Add `category` parameter to `generate-icebreakers` function
- [x] Update AI prompt with category-specific instructions:
  - `funny`: Light, humorous, playful
  - `deep`: Thoughtful, meaningful questions
  - `activity`: Suggest doing something together
  - `compliment`: Genuine, non-creepy compliments
  - `general`: Mix of styles (default)
- [x] Return `category` field in response
- [x] Store `category` in icebreakers table
- [x] Edge function returns 200 with categorized icebreakers
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Test Edge Function locally or via Supabase dashboard

---

### US-005: Create generate-followups edge function

**Description:** As a MÄÄK user, I want AI to suggest follow-up messages when a conversation stalls so that I can keep the conversation going.

**Acceptance Criteria:**
- [ ] Create `supabase/functions/generate-followups/index.ts`
- [ ] Accept `matchId` and `messageCount` (how many recent messages to analyze)
- [ ] Fetch last N messages from conversation
- [ ] Generate 2-3 follow-up suggestions based on:
  - Last message content
  - Conversation tone/topic
  - Both users' personalities
- [ ] Return array of follow-up suggestions
- [ ] Add rate limiting (max 5 calls per match per day)
- [ ] Edge function returns 200 with suggestions
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Test Edge Function locally or via Supabase dashboard

---

### US-006: Regenerate Supabase types

**Description:** As a developer, I need updated TypeScript types reflecting the new schema.

**Acceptance Criteria:**
- [ ] Run `supabase gen types typescript --local > src/integrations/supabase/types.ts`
- [ ] Types include `icebreaker_analytics` table
- [ ] Types include `category` column on `icebreakers`
- [ ] No TypeScript errors in codebase
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-007: Create useIcebreakerAnalytics hook

**Description:** As a developer, I need a hook to track icebreaker usage and outcomes for analytics.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useIcebreakerAnalytics.ts`
- [ ] Export `trackIcebreakerShown(matchId, icebreaker, category)` function
- [ ] Export `trackIcebreakerUsed(matchId, icebreakerText)` function
- [ ] Export `trackIcebreakerResponse(matchId, responseTimeSeconds)` function
- [ ] Use TanStack Query mutation for writes
- [ ] Handle errors gracefully (don't break chat)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-008: Add category picker UI to chat

**Description:** As a MÄÄK user, I want to select an icebreaker category before generating so that I get suggestions matching my mood.

**Acceptance Criteria:**
- [ ] Add category tabs/chips above icebreaker list in ChatWindow
- [ ] Categories: Roligt (funny), Djupt (deep), Aktivitet (activity), Komplimang (compliment)
- [ ] Default to "Blandad" (general/mixed)
- [ ] Pass selected category to generate function
- [ ] Show category icon next to each icebreaker
- [ ] Framer Motion transition when switching categories
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Verify changes work in browser at localhost:8080

---

### US-009: Add follow-up suggestions UI

**Description:** As a MÄÄK user, I want to see follow-up suggestions when conversation slows so that I can re-engage my match.

**Acceptance Criteria:**
- [ ] Add "Conversation Help" button that appears after 3+ messages
- [ ] Button only shows if last message was from match (user's turn)
- [ ] Opens sheet with 2-3 AI-generated follow-ups
- [ ] Click follow-up to send as message
- [ ] Loading state while generating
- [ ] Disable if already used 5x today for this match
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Verify changes work in browser at localhost:8080

---

### US-010: Track icebreaker usage analytics

**Description:** As a MÄÄK user, I want my icebreaker choices tracked so that the system can learn what works.

**Acceptance Criteria:**
- [ ] Call `trackIcebreakerShown` when icebreakers are displayed
- [ ] Call `trackIcebreakerUsed` when user clicks an icebreaker
- [ ] Call `trackIcebreakerResponse` when match replies (within 24h)
- [ ] Calculate response_time_seconds from message timestamps
- [ ] All tracking is non-blocking (fire-and-forget)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-011: Add Swedish translations for icebreaker categories

**Description:** As a Swedish user, I want all new icebreaker features in Swedish.

**Acceptance Criteria:**
- [ ] Add to `src/i18n/locales/sv.json`:
  - `chat.icebreaker_categories`: "Välj stil"
  - `chat.category_funny`: "Roligt"
  - `chat.category_deep`: "Djupt"
  - `chat.category_activity`: "Aktivitet"
  - `chat.category_compliment`: "Komplimang"
  - `chat.category_general`: "Blandad"
  - `chat.followup_help`: "Behöver du hjälp?"
  - `chat.followup_suggestions`: "Förslag på svar"
  - `chat.followup_limit`: "Du har använt alla förslag för idag"
- [ ] Add matching keys to `src/i18n/locales/en.json`
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

## Non-Goals

- No premium-gating of icebreaker features (all users get full access)
- No machine learning model training (just data collection for now)
- No A/B testing framework (manual analysis only)
- No icebreaker rating system (thumbs up/down)
- No icebreaker sharing or favorites
- No integration with external APIs (weather, events, etc.)

## Technical Considerations

### Existing Code to Extend
- `supabase/functions/generate-icebreakers/index.ts` - Add profile fetching and categories
- `src/components/chat/ChatWindow.tsx` - Add category picker and follow-up UI
- `src/i18n/locales/sv.json` and `en.json` - New translation keys

### New Files to Create
- `supabase/migrations/20260118_add_icebreaker_analytics.sql`
- `supabase/migrations/20260118_add_icebreaker_category.sql`
- `supabase/functions/generate-followups/index.ts`
- `src/hooks/useIcebreakerAnalytics.ts`

### shadcn/ui Components to Use
- `Tabs` or `ToggleGroup` for category selection
- `Sheet` for follow-up suggestions panel
- `Button` with icons for category chips

### RLS Policies Needed
- `icebreaker_analytics`: Users can INSERT/SELECT their own rows only

### AI Prompt Structure
The enhanced prompt should include:
```
User A: {name} ({archetype})
- Intressen: {interests array}
- Bio: {bio excerpt}

User B: {name} ({archetype})
- Intressen: {interests array}
- Bio: {bio excerpt}

Gemensamma intressen: {shared interests}

Generera 3 {category} isbrytare på svenska...
```

### Rate Limiting
- `generate-followups`: Max 5 calls per match per day
- Track via `icebreaker_analytics` table count

---

## Story Dependency Graph

```
US-001 (analytics table)
US-002 (category column)
    ↓
US-003 (profile context) ─────┐
US-004 (categories)           │
US-005 (followups function)   │
    ↓                         │
US-006 (regen types) ←────────┘
    ↓
US-007 (analytics hook)
    ↓
US-008 (category UI)
US-009 (followup UI)
US-010 (track analytics)
    ↓
US-011 (translations)
```

Execute in order: US-001 → US-002 → US-003 → US-004 → US-005 → US-006 → US-007 → US-008 → US-009 → US-010 → US-011
