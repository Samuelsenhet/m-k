---
name: MÄÄK Database Schema
description: Supabase PostgreSQL schema and RLS policies
---

## Overview
The database uses Supabase PostgreSQL with Row-Level Security (RLS) for data protection.

## Core Tables

### profiles
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  date_of_birth DATE NOT NULL,
  phone TEXT UNIQUE,
  phone_verified_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  category TEXT,  -- DIPLOMAT, STRATEGER, BYGGARE, UPPTÄCKARE
  archetype TEXT, -- INFJ, INTJ, etc.
  bio TEXT,
  location TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### matches
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  matched_user_id UUID REFERENCES profiles(user_id),
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure only one match per user pair (prevents duplicate/bidirectional records)
  CONSTRAINT unique_match_pair UNIQUE (
    LEAST(user_id, matched_user_id),
    GREATEST(user_id, matched_user_id)
  )
);
```

### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  sender_id UUID REFERENCES profiles(user_id),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft-delete timestamp
);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for messages table
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### personality_scores
```sql
CREATE TABLE personality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  dimension TEXT NOT NULL, -- ei, sn, tf, jp, at
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS Policies

### profiles Table
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = user_id);
```

### matches Table
```sql
-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can view their matches
CREATE POLICY "Users can view own matches"
ON matches FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- Users can update match status
CREATE POLICY "Users can update match status"
ON matches FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- Users can create matches (enforce business rules)
CREATE POLICY "Users can create matches"
ON matches FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND user_id != matched_user_id
);

-- Users can delete their own matches
CREATE POLICY "Users can delete own matches"
ON matches FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = matched_user_id);
```

### messages Table
```sql
-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their matches (exclude soft-deleted)
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
  )
);

-- Users can send messages in their matches
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = match_id
    AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
  )
);

-- Update policy to implement soft-delete (sets deleted_at instead of hard delete)
CREATE POLICY "Users can soft-delete own messages"
ON messages FOR UPDATE
USING (auth.uid() = sender_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = sender_id);

-- Prevent hard deletes in production
CREATE POLICY "Prevent hard deletes"
ON messages FOR DELETE
USING (false);
```

## Supabase Client Usage

### Soft-Delete Messages
```typescript
// Soft-delete a message (sets deleted_at timestamp)
const { error } = await supabase
  .from('messages')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', messageId)
  .eq('sender_id', currentUserId);
```

### Query Profile
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

### Update Profile
```typescript
const { error } = await supabase
  .from('profiles')
  .update({ display_name: 'New Name' })
  .eq('user_id', user.id);
```

### Realtime Subscription
```typescript
const subscription = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `match_id=eq.${matchId}`
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();
```

## Edge Functions

Location: `supabase/functions/`

### ai-assistant
AI-powered chat assistant for dating advice and conversation help.

### generate-icebreakers
Generates personalized conversation starters based on personality compatibility.

### send-notification
Sends push notifications for new matches and messages.

## Migrations

Located in `supabase/migrations/`

### Creating Migrations
```bash
# Create new migration
supabase migration new add_new_feature

# Apply migrations locally
supabase db reset

# Push to production
supabase db push
```

### Migration Best Practices
1. Always test migrations locally first
2. Use transactions for complex changes
3. Include rollback procedures in comments
4. Never modify existing migrations after deployment
5. Use descriptive names for migrations
