## Database Migrations Guide

### Overview
Best practices for creating, managing, and deploying database schema changes in MÄÄK.

## Migration Workflow

### Local Development

#### Create New Migration
```bash
# Generate migration file
supabase migration new add_feature_name

# Migration file created at:
# supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql
```

#### Write Migration
```sql
-- supabase/migrations/20260109120000_add_feature_name.sql

-- Add new column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_verified 
ON profiles(verified) WHERE verified = true;

-- Update RLS policy
CREATE POLICY "Verified users can view profiles"
ON profiles FOR SELECT
USING (verified = true OR auth.uid() = user_id);
```

#### Test Migration
```bash
# Reset database (applies all migrations)
supabase db reset

# Check database state
supabase db diff

# Verify in local app
npm run dev
```

### Production Deployment

#### Push to Production
```bash
# Link to production project
supabase link --project-ref zcikfntelmtkgoibtttc

# Push migrations
supabase db push

# Verify migrations applied
supabase migration list
```

## Migration Patterns

### Adding Columns

#### Add Column with Default
```sql
-- Safe: doesn't block writes
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- Update existing rows if needed
UPDATE profiles SET bio = '' WHERE bio IS NULL;
```

#### Add NOT NULL Column (Two-Step)
```sql
-- Step 1: Add nullable column with default
ALTER TABLE profiles 
ADD COLUMN display_name TEXT;

UPDATE profiles 
SET display_name = COALESCE(display_name, 'User');

-- Step 2: Add NOT NULL constraint
ALTER TABLE profiles 
ALTER COLUMN display_name SET NOT NULL;
```

### Removing Columns

#### Safe Column Removal
```sql
-- Step 1: Remove from application code first
-- Step 2: Drop column in migration
ALTER TABLE profiles 
DROP COLUMN IF EXISTS old_column;
```

### Renaming Columns

#### Rename Column
```sql
-- Rename column
ALTER TABLE profiles 
RENAME COLUMN old_name TO new_name;

-- Update dependent objects
-- Reindex if needed
REINDEX INDEX idx_profiles_old_name;
```

### Creating Tables

#### New Table with RLS
```sql
-- Create table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own achievements"
ON achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
ON achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Modifying Tables

#### Add Foreign Key
```sql
-- Add foreign key constraint
ALTER TABLE messages
ADD CONSTRAINT fk_messages_match_id
FOREIGN KEY (match_id) 
REFERENCES matches(id) 
ON DELETE CASCADE;
```

#### Add Check Constraint
```sql
-- Add constraint
ALTER TABLE personality_scores
ADD CONSTRAINT check_score_range
CHECK (score >= 0 AND score <= 100);
```

#### Add Unique Constraint
```sql
-- Add unique constraint
ALTER TABLE profiles
ADD CONSTRAINT unique_phone
UNIQUE (phone);

-- Or create unique index
CREATE UNIQUE INDEX idx_profiles_phone_unique 
ON profiles(phone) 
WHERE phone IS NOT NULL;
```

### Creating Indexes

#### Basic Index
```sql
-- Single column index
CREATE INDEX IF NOT EXISTS idx_matches_user_id 
ON matches(user_id);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_matches_user_status 
ON matches(user_id, status);

-- Partial index (filtered)
CREATE INDEX IF NOT EXISTS idx_matches_pending 
ON matches(user_id) 
WHERE status = 'pending';
```

#### Performance Indexes
```sql
-- For sorting
CREATE INDEX idx_messages_created_desc 
ON messages(match_id, created_at DESC);

-- For searching
CREATE INDEX idx_profiles_search 
ON profiles USING gin(to_tsvector('english', bio));

-- For JSON fields
CREATE INDEX idx_profiles_photos 
ON profiles USING gin(photos);
```

### Functions and Triggers

#### Create Function
```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Create Trigger
```sql
-- Attach trigger to table
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### RLS Policies

#### Select Policy
```sql
CREATE POLICY "Users can view matches"
ON matches FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = matched_user_id
);
```

#### Insert Policy
```sql
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Update Policy
```sql
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### Delete Policy
```sql
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (auth.uid() = sender_id);
```

## Data Migrations

### Backfill Data
```sql
-- Backfill missing data
UPDATE profiles
SET category = 'DIPLOMAT'
WHERE archetype IN ('INFJ', 'INFP', 'ENFJ', 'ENFP')
  AND category IS NULL;

-- Log progress
DO $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE profiles SET category = 'DIPLOMAT'
  WHERE archetype IN ('INFJ', 'INFP', 'ENFJ', 'ENFP')
    AND category IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % rows', updated_count;
END $$;
```

### Transform Data
```sql
-- Transform data format
UPDATE profiles
SET photos = array_remove(photos, '')
WHERE '' = ANY(photos);

-- Convert types
ALTER TABLE personality_scores
ALTER COLUMN score TYPE INTEGER
USING score::INTEGER;
```

## Rollback Procedures

### Rollback Migration
```sql
-- Include rollback in migration comments
-- Rollback: DROP TABLE achievements;

-- Or create separate down migration
-- supabase/migrations/20260109120001_rollback_achievements.sql
DROP TABLE IF EXISTS achievements CASCADE;
```

### Repair Migration
```bash
# Mark migration as reverted
supabase migration repair --status reverted 20260109120000

# Re-apply if needed
supabase db push
```

## Migration Best Practices

### 1. Atomic Changes
```sql
-- Wrap in transaction (automatic for migrations)
BEGIN;
  ALTER TABLE profiles ADD COLUMN verified BOOLEAN;
  UPDATE profiles SET verified = false;
  ALTER TABLE profiles ALTER COLUMN verified SET NOT NULL;
COMMIT;
```

### 2. Idempotent Migrations
```sql
-- Safe to run multiple times
CREATE TABLE IF NOT EXISTS table_name (...);
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...;
CREATE INDEX IF NOT EXISTS ...;
DROP TABLE IF EXISTS ...;
```

### 3. Zero-Downtime Migrations

#### Add Column (Safe)
```sql
-- Safe: doesn't lock table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS new_column TEXT DEFAULT 'value';
```

#### Modify Column (Careful)
```sql
-- Step 1: Add new column
ALTER TABLE profiles ADD COLUMN new_phone TEXT;

-- Step 2: Backfill data
UPDATE profiles SET new_phone = phone;

-- Step 3: Update app to use new column
-- (Deploy application)

-- Step 4: Drop old column
ALTER TABLE profiles DROP COLUMN phone;

-- Step 5: Rename new column
ALTER TABLE profiles RENAME COLUMN new_phone TO phone;
```

### 4. Test Before Deploy
```bash
# Always test locally first
supabase db reset
npm run build
npm run dev

# Test critical paths
# - Auth flow
# - Data queries
# - Inserts/updates
```

### 5. Document Changes
```sql
-- Clear documentation in migration
-- Migration: Add achievements system
-- Purpose: Track user achievements for gamification
-- Dependencies: profiles table
-- Rollback: DROP TABLE achievements;

CREATE TABLE achievements (...);
```

## Common Migration Issues

### Issue: Migration Fails
```sql
-- Check migration log
supabase migration list

-- View error details
supabase db push --debug
```

### Issue: Constraint Violation
```sql
-- Check existing data
SELECT * FROM profiles 
WHERE phone IS NULL;

-- Fix data before adding constraint
UPDATE profiles 
SET phone = 'placeholder' 
WHERE phone IS NULL;

-- Then add constraint
ALTER TABLE profiles 
ALTER COLUMN phone SET NOT NULL;
```

### Issue: Index Creation Slow
```sql
-- Create index concurrently (doesn't block writes)
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

## Migration Checklist

Before creating migration:
- [ ] Design schema changes
- [ ] Consider existing data
- [ ] Plan for rollback
- [ ] Check for breaking changes

After creating migration:
- [ ] Test locally with `supabase db reset`
- [ ] Verify app still works
- [ ] Check query performance
- [ ] Document changes

Before production deploy:
- [ ] Review migration SQL
- [ ] Backup database
- [ ] Plan rollback procedure
- [ ] Schedule maintenance window if needed

After production deploy:
- [ ] Verify migration applied
- [ ] Test critical functionality
- [ ] Monitor error logs
- [ ] Check database performance
