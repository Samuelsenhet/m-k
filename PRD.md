# PRD: Enhanced AI Icebreakers

## Introduction

Upgrade MÄÄK's AI icebreaker system from basic personality-based suggestions to a context-aware, categorized, and learning system. Currently, icebreakers only consider personality archetypes. This enhancement will use interests, hobbies, and profile data to generate more relevant conversation starters, offer category-based options, provide follow-up suggestions during conversations, and track which icebreakers lead to successful conversations.

## Goals

- fixing the errors in usePhoneAuth both with twillio and supabase
- The frontend and backend
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

- [x] Create migration `20260118_add_icebreaker_analytics.sql`
- [x] Table `icebreaker_analytics` with columns:
  - `id` (uuid, primary key)
  - `match_id` (uuid, references matches)
  - `user_id` (uuid, references profiles)
  - `icebreaker_text` (text)
  - `category` (text, nullable)
  - `was_used` (boolean, default false)
  - `led_to_response` (boolean, nullable)
  - `response_time_seconds` (integer, nullable)
  - `created_at` (timestamptz)
- [x] Add RLS policy: users can only see their own analytics
- [x] Add index on `match_id` and `user_id`
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-002: Add icebreaker category enum

**Description:** As a developer, I want a standardized category system for icebreakers so that users can choose their preferred style.

**Acceptance Criteria:**

- [x] Create migration `20260118_add_icebreaker_category.sql`
- [x] Add `category` column to `icebreakers` table (text, nullable)
- [x] Valid categories: `funny`, `deep`, `activity`, `compliment`, `general`
- [x] Add TypeScript type `IcebreakerCategory` in `src/types/api.ts`
- [x] `npm run build` passes
- [x] `npm run lint` passes

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

- [x] Create `supabase/functions/generate-followups/index.ts`
- [x] Accept `matchId` and `messageCount` (how many recent messages to analyze)
- [x] Fetch last N messages from conversation
- [x] Generate 2-3 follow-up suggestions based on:
  - Last message content
  - Conversation tone/topic
  - Both users' personalities
- [x] Return array of follow-up suggestions
- [x] Add rate limiting (max 5 calls per match per day)
- [x] Edge function returns 200 with suggestions
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Test Edge Function locally or via Supabase dashboard

---

### US-006: Regenerate Supabase types

**Description:** As a developer, I need updated TypeScript types reflecting the new schema.

**Acceptance Criteria:**

- [x] Run `supabase gen types typescript --local > src/integrations/supabase/types.ts` (manually added types since Docker wasn't running)
- [x] Types include `icebreaker_analytics` table
- [x] Types include `category` column on `icebreakers`
- [x] No TypeScript errors in codebase
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-007: Create useIcebreakerAnalytics hook

**Description:** As a developer, I need a hook to track icebreaker usage and outcomes for analytics.

**Acceptance Criteria:**

- [x] Create `src/hooks/useIcebreakerAnalytics.ts`
- [x] Export `trackIcebreakerShown(matchId, icebreaker, category)` function
- [x] Export `trackIcebreakerUsed(matchId, icebreakerText)` function
- [x] Export `trackIcebreakerResponse(matchId, responseTimeSeconds)` function
- [x] Use TanStack Query mutation for writes
- [x] Handle errors gracefully (don't break chat)
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-008: Add category picker UI to chat

**Description:** As a MÄÄK user, I want to select an icebreaker category before generating so that I get suggestions matching my mood.

**Acceptance Criteria:**

- [x] Add category tabs/chips above icebreaker list in ChatWindow
- [x] Categories: Roligt (funny), Djupt (deep), Aktivitet (activity), Komplimang (compliment)
- [x] Default to "Blandad" (general/mixed)
- [x] Pass selected category to generate function
- [x] Show category icon next to each icebreaker
- [x] Framer Motion transition when switching categories
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Verify changes work in browser at localhost:8080

---

### US-009: Add follow-up suggestions UI

**Description:** As a MÄÄK user, I want to see follow-up suggestions when conversation slows so that I can re-engage my match.

**Acceptance Criteria:**

- [x] Add "Conversation Help" button that appears after 3+ messages
- [x] Button only shows if last message was from match (user's turn)
- [x] Opens sheet with 2-3 AI-generated follow-ups
- [x] Click follow-up to send as message
- [x] Loading state while generating
- [x] Disable if already used 5x today for this match
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Verify changes work in browser at localhost:8080

---

### US-010: Track icebreaker usage analytics

**Description:** As a MÄÄK user, I want my icebreaker choices tracked so that the system can learn what works.

**Acceptance Criteria:**

- [x] Call `trackIcebreakerShown` when icebreakers are displayed
- [x] Call `trackIcebreakerUsed` when user clicks an icebreaker
- [x] Call `trackIcebreakerResponse` when match replies (within 24h)
- [x] Calculate response_time_seconds from message timestamps
- [x] All tracking is non-blocking (fire-and-forget)
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-011: Add Swedish translations for icebreaker categories

**Description:** As a Swedish user, I want all new icebreaker features in Swedish.

**Acceptance Criteria:**

- [x] Add to `src/i18n/locales/sv.json`:
  - `chat.icebreaker_categories`: "Välj stil"
  - `chat.category_funny`: "Roligt"
  - `chat.category_deep`: "Djupt"
  - `chat.category_activity`: "Aktivitet"
  - `chat.category_compliment`: "Komplimang"
  - `chat.category_general`: "Blandad"
  - `chat.followup_help`: "Behöver du hjälp?"
  - `chat.followup_suggestions`: "Förslag på svar"
  - `chat.followup_limit`: "Du har använt alla förslag för idag"
- [x] Add matching keys to `src/i18n/locales/en.json`
- [x] `npm run build` passes
- [x] `npm run lint` passes

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

---

# PRD: Profile Photo Management

## Introduction

Enhance MÄÄK's profile photo system to allow users to upload, reorder, and delete photos with a premium mobile-first interface. Currently, users can upload photos but cannot easily manage them. This feature will provide drag-to-reorder, photo deletion, and better upload UX with progress indicators.

## Goals

- Allow users to upload up to 6 profile photos
- Enable drag-to-reorder photos (primary photo is first)
- Allow photo deletion with confirmation
- Show upload progress with premium UI
- Validate image size and format before upload
- Optimize images for mobile viewing
- Use premium design system (glassmorphism, gradients)

## User Stories

### US-012: Add photo reordering functionality

**Description:** As a MÄÄK user, I want to reorder my photos by dragging so that I can choose which photo appears first.

**Acceptance Criteria:**

- [x] Add `display_order` column to `profile_photos` table (if not exists)
- [x] Create migration `20260126_add_photo_reordering.sql`
- [x] Add `updatePhotoOrder` function in Supabase (or edge function)
- [x] Implement drag-and-drop in ProfileEditor using `@dnd-kit/core`
- [x] Show visual feedback during drag (premium card styling)
- [x] Update `display_order` for all photos when reordered
- [x] Primary photo (first in order) is marked visually
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Verify changes work in browser at localhost:8080

---

### US-013: Add photo deletion with confirmation

**Description:** As a MÄÄK user, I want to delete photos I don't like so that my profile shows only my best photos.

**Acceptance Criteria:**

- [x] Add delete button (trash icon) to each photo in ProfileEditor
- [x] Show confirmation dialog before deletion (use shadcn/ui AlertDialog)
- [x] Delete photo from Supabase storage bucket
- [x] Delete photo record from `profile_photos` table
- [x] Reorder remaining photos to fill gaps
- [x] Show success toast after deletion
- [x] Handle errors gracefully (show error toast)
- [x] Prevent deletion if only one photo remains
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Verify changes work in browser at localhost:8080

---

### US-014: Enhance photo upload with progress indicator

**Description:** As a MÄÄK user, I want to see upload progress so that I know my photos are uploading correctly.

**Acceptance Criteria:**

- [x] Add upload progress bar (premium gradient styling)
- [x] Show percentage and file name during upload
- [x] Validate file size (max 5MB per photo)
- [x] Validate file type (jpg, jpeg, png, webp only)
- [x] Show error message for invalid files
- [x] Allow multiple file selection
- [x] Queue uploads (max 2 concurrent)
- [x] Show success animation when upload completes
- [x] Use premium ShimmerButton for upload trigger
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Verify changes work in browser at localhost:8080

---

### US-015: Add photo count indicator and limits

**Description:** As a MÄÄK user, I want to know how many photos I can upload so that I can plan my profile.

**Acceptance Criteria:**

- [x] Show "X/6 photos" indicator in ProfileEditor
- [x] Disable upload button when at max (6 photos)
- [x] Show premium badge when at max photos
- [x] Add tooltip explaining photo limit
- [x] Show warning if user tries to upload when at limit
- [x] Use premium card styling for photo grid
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Verify changes work in browser at localhost:8080

---

### US-016: Add Swedish translations for photo management

**Description:** As a Swedish user, I want all photo management features in Swedish.

**Acceptance Criteria:**

- [x] Add to `src/i18n/locales/sv.json`:
  - `profile.photos.title`: "Dina foton"
  - `profile.photos.upload`: "Ladda upp foto"
  - `profile.photos.delete_confirm`: "Ta bort detta foto?"
  - `profile.photos.max_reached`: "Du har laddat upp max antal foton"
  - `profile.photos.reorder_hint`: "Dra för att ändra ordning"
  - `profile.photos.uploading`: "Laddar upp..."
- [x] Add matching keys to `src/i18n/locales/en.json`
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

## Story Dependency Graph

```
US-012 (reordering)
US-013 (deletion)
US-014 (upload progress)
US-015 (photo limits)
    ↓
US-016 (translations)
```

Execute in order: US-012 → US-013 → US-014 → US-015 → US-016

---

# PRD: App Completion & Polish

## Introduction

Complete all remaining work to make MÄÄK production-ready, including verification of completed features, translations, testing, and code quality improvements.

## Goals

- Complete all incomplete user stories
- Verify all features work end-to-end
- Ensure consistent mobile app design
- Fix any remaining bugs
- Improve error handling
- Optimize performance
- Complete i18n translations

---

### US-017: Verify photo upload progress works in browser

**Description:** As a developer, I need to verify that photo upload progress displays correctly.

**Acceptance Criteria:**

- [x] Navigate to Profile → Edit Profile → Photos section
- [x] Click "Ladda upp foton" button
- [x] Select a photo file
- [x] Verify progress bar appears with percentage
- [x] Verify file name displays during upload
- [x] Verify progress updates smoothly (0% → 100%)
- [x] Verify success animation appears when complete
- [x] Test with multiple photos (verify queue works)
- [x] Test with invalid file type (verify error message)
- [x] Test with file > 5MB (verify error message)
- [x] Test on mobile viewport (Chrome DevTools)
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-018: Verify photo count limits work correctly

**Description:** As a developer, I need to verify photo count limits function properly.

**Acceptance Criteria:**

- [x] Navigate to Profile → Edit Profile → Photos section
- [x] Verify "X/6 photos" indicator displays
- [x] Upload photos until reaching 6 photos
- [x] Verify upload button disables at 6 photos
- [x] Verify tooltip shows when hovering disabled button
- [x] Verify "Komplett" badge with sparkle icon appears at max
- [x] Verify toast error if trying to upload at limit
- [x] Test on mobile viewport
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-019: Verify photo reordering works in browser

**Description:** As a developer, I need to verify drag-to-reorder photos works correctly.

**Acceptance Criteria:**

- [x] Navigate to Profile → Edit Profile → Photos section
- [x] Upload at least 3 photos
- [x] Drag a photo to a new position
- [x] Verify visual feedback during drag
- [x] Verify photo order updates after drop
- [x] Verify "Huvudfoto" badge appears on first photo
- [x] Verify order persists after page reload
- [x] Test on mobile viewport (touch drag)
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-020: Verify photo deletion works in browser

**Description:** As a developer, I need to verify photo deletion works correctly.

**Acceptance Criteria:**

- [x] Navigate to Profile → Edit Profile → Photos section
- [x] Upload at least 2 photos
- [x] Click delete button (trash icon) on a photo
- [x] Verify confirmation dialog appears
- [x] Click "Ta bort" in dialog
- [x] Verify photo is removed from UI
- [x] Verify remaining photos reorder correctly
- [x] Verify cannot delete last photo (shows error)
- [x] Test on mobile viewport
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-021: Verify phone authentication flow end-to-end

**Description:** As a developer, I need to ensure phone authentication works correctly.

**Acceptance Criteria:**

- [x] Test new user flow:
  - [x] Enter Swedish phone number (07X XXX XX XX)
  - [x] Receive OTP (or use demo code 123456 in dev)
  - [x] Enter OTP code
  - [x] Complete age verification
  - [x] Verify profile created in database
  - [x] Verify redirect to onboarding
- [x] Test returning user flow:
  - [x] Enter phone number
  - [x] Enter OTP
  - [x] Verify redirect to matches (if onboarding complete)
  - [x] Verify redirect to onboarding (if incomplete)
- [x] Test error cases:
  - [x] Invalid phone format (shows error)
  - [x] Wrong OTP code (shows error)
  - [x] Expired OTP (shows error)
- [x] Verify session persists after page reload
- [x] Verify no navigation loops
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-022: Verify match profile viewing works end-to-end

**Description:** As a developer, I need to ensure users can view match profiles correctly.

**Acceptance Criteria:**

- [x] Navigate to Matches page
- [x] Click on a match card
- [x] Verify MatchProfileView opens full-screen
- [x] Verify match's photos display
- [x] Verify info overlay shows (name, age, height, work, location)
- [x] Verify personality badge displays if available
- [x] Verify swipe navigation between photos works
- [x] Verify action buttons (like, pass, chat) are functional
- [x] Verify back button returns to matches
- [x] Test on mobile viewport
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-023: Verify user's own profile displays all information

**Description:** As a developer, I need to ensure the user's profile shows complete information.

**Acceptance Criteria:**

- [x] Navigate to Profile page
- [x] Verify full-screen photo displays
- [x] Verify user info overlay (name, age, height, work, location)
- [x] Click "Visa mer" button
- [x] Verify expandable section opens smoothly
- [x] Verify bio displays if available
- [x] Verify personality section displays:
  - [x] Archetype emoji and title
  - [x] Archetype description
  - [x] Strengths badges
  - [x] Love style information
- [x] Verify additional info grid (work, location, age, height)
- [x] Verify "Redigera profil" button works
- [x] Test on mobile viewport
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-024: Ensure consistent mobile app design across all pages

**Description:** As a developer, I need to ensure all pages follow modern mobile app design.

**Acceptance Criteria:**

- [x] Review all main pages for design consistency:
  - [x] LandingPage - mobile-first, premium design
  - [x] Matches - card-based, full-screen profile option
  - [x] Chat - mobile chat interface
  - [x] Profile - full-screen design
  - [x] Onboarding - mobile-optimized flow
- [x] Verify all pages use:
  - [x] Consistent color scheme (primary: rose/pink, accent: purple)
  - [x] Consistent typography (DM Sans body, Playfair Display headers)
  - [x] Consistent spacing and padding
  - [x] Touch targets min 44px
  - [x] Safe area handling
  - [x] Smooth animations
- [x] Verify BottomNav appears on all main pages
- [x] Test on mobile viewport
- [x] `npm run build` passes
- [x] `npm run lint` passes

---

### US-025: Fix TypeScript errors and improve type safety

**Description:** As a developer, I need to ensure zero TypeScript errors.

**Acceptance Criteria:**

- [ ] Run `npm run build` and fix all TypeScript errors
- [ ] Run `npm run lint` and fix all linting errors
- [ ] Replace all `any` types with proper types
- [ ] Ensure all imports use `@/` alias correctly
- [ ] Verify Supabase types are up-to-date
- [ ] Remove unused imports
- [ ] Wrap console.logs in DEV checks
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero errors

---

### US-026: Test complete user journey end-to-end

**Description:** As a QA, I need to verify the complete user journey works.

**Acceptance Criteria:**

- [ ] **New User Journey:**
  - [ ] Land on homepage
  - [ ] Click "Kom igång"
  - [ ] Complete phone auth
  - [ ] Complete age verification
  - [ ] Complete onboarding wizard
  - [ ] Take personality test
  - [ ] View personality results
  - [ ] Upload profile photos
  - [ ] Fill profile information
  - [ ] View matches
  - [ ] View match profile
  - [ ] Start chat
  - [ ] Use icebreakers
  - [ ] View own profile
- [ ] **Returning User Journey:**
  - [ ] Login with phone
  - [ ] Verify correct redirect
  - [ ] Verify data persists
- [ ] All flows work without errors
- [ ] No infinite loops
- [ ] `npm run build` passes

---

### US-027: Add error boundaries and improve error handling

**Description:** As a developer, I need graceful error handling throughout the app.

**Acceptance Criteria:**

- [ ] Create ErrorBoundary component with premium design
- [ ] Wrap main app routes in ErrorBoundary
- [ ] Add error fallback UI (Swedish text, retry button)
- [ ] Ensure all async operations have try/catch
- [ ] Verify all Supabase queries handle errors
- [ ] Verify all edge function calls handle errors
- [ ] Add user-friendly error messages (Swedish)
- [ ] Test error scenarios:
  - [ ] Network offline
  - [ ] Invalid API responses
  - [ ] Database errors
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### US-028: Optimize bundle size and performance

**Description:** As a developer, I need to ensure fast load times.

**Acceptance Criteria:**

- [ ] Run `npm run build` and check bundle sizes
- [ ] Verify main bundle < 600 KB (gzipped)
- [ ] Verify vendor chunks properly split
- [ ] Check for duplicate dependencies
- [ ] Verify images optimized
- [ ] Check Lighthouse scores:
  - [ ] Performance > 85
  - [ ] Accessibility > 90
  - [ ] Best Practices > 90
- [ ] Add lazy loading for heavy components
- [ ] `npm run build` passes

---

### US-029: Verify PWA functionality

**Description:** As a developer, I need to ensure PWA features work.

**Acceptance Criteria:**

- [ ] Verify service worker registers
- [ ] Verify app can be installed (Add to Home Screen)
- [ ] Verify offline fallback page
- [ ] Verify manifest.json is correct
- [ ] Verify icons generated (192x192, 512x512)
- [ ] Test on mobile device
- [ ] `npm run build` passes

---

## Updated Story Dependency Graph

```
US-012 (reordering) ──┐
US-013 (deletion)     │
US-014 (upload progress) ──┐
US-015 (photo limits)     │
    ↓                     │
US-016 (translations)     │
    ↓                     │
US-017 (verify upload)    │
US-018 (verify limits)    │
US-019 (verify reorder)   │
US-020 (verify delete)    │
    ↓                     │
US-021 (phone auth verify)│
US-022 (match profile verify)
US-023 (own profile verify)
    ↓
US-024 (design consistency)
US-025 (TypeScript cleanup)
    ↓
US-026 (end-to-end testing)
US-027 (error handling)
US-028 (performance)
US-029 (PWA verification)
```

Execute in order: US-016 → US-017 → US-018 → US-019 → US-020 → US-021 → US-022 → US-023 → US-024 → US-025 → US-026 → US-027 → US-028 → US-029
