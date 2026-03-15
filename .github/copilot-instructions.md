# MÄÄK - AI Coding Instructions

> **📚 Deep Documentation**: Before making changes, check the `skills/` folder for detailed AI-readable docs:
>
> - `skills/database/SKILL.md` - Full schema, RLS policies, migrations
> - `skills/components/SKILL.md` - Component patterns, hooks, UI conventions
> - `skills/brand/SKILL.md` - Colors, typography, design tokens
> - `skills/workflows/SKILL.md` - Development, testing, deployment procedures

## Architecture Overview

**MĀĀK is a mobile-only app** (iOS and Android). Swedish personality-based dating app using **Expo SDK 55 + React Native + TypeScript + Expo Router** with **Supabase** (PostgreSQL + Edge Functions + Realtime) backend. The app matches users based on MBTI-style personality dimensions.

### Core Data Flow

1. **Auth**: Phone-based auth via Supabase → `AuthProvider` context
2. **Personality Test**: 5-dimension scores (ei/sn/tf/jp/at) → categorized into 4 types (DIPLOMAT, STRATEGER, BYGGARE, UPPTÄCKARE) → 16 archetypes (INFJ, INTJ, etc.)
3. **Matching**: Daily matches generated via `match-daily` Edge Function using score signals (40% personality similarity, 30% archetype alignment, 30% interest overlap)
4. **Chat**: Real-time messaging via Supabase Realtime channels

### Key Directories

- `src/components/` - Feature-grouped components (auth/, chat/, personality/, matches/, etc.)
- `src/hooks/` - Custom hooks (`useMatches`, `useRealtime`, `useAuth`, etc.)
- `src/integrations/supabase/` - Supabase client + auto-generated types
- `supabase/functions/` - Deno Edge Functions (match-daily, ai-assistant, send-notification)
- `skills/` - AI-readable documentation (database schema, component patterns, brand guidelines)

## Development Commands

```bash
npm run start        # Expo dev server (Metro)
npm run ios          # Run iOS (requires ios/ from npx expo prebuild)
npm run ios:prebuild # Prebuild + run iOS
npm run android      # Run Android
npm run prebuild     # Generate ios/ and android/
npm run lint         # ESLint + spellcheck
npm run typecheck    # TypeScript check
npm run test         # Jest tests
supabase db push     # Push migrations
supabase gen types typescript --project-id "$EXPO_PUBLIC_SUPABASE_PROJECT_ID" > src/integrations/supabase/types.ts
```

## Project Conventions

### Import Paths

Use `@/` alias for all src imports:

```tsx
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { View, Text } from 'react-native';
```

### Component Pattern

```tsx
// PascalCase files, TypeScript interfaces, React Native / Expo
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export function Component({ title, onAction }: ComponentProps) {
  // Hook pattern: useState → useEffect → handlers → return
}
```

### Supabase Queries

Always use typed client from `@/integrations/supabase/client`:

```tsx
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId);
if (error) throw error;
```

### Personality Types

- **DimensionKey**: `'ei' | 'sn' | 'tf' | 'jp' | 'at'` (scores 0-100)
- **PersonalityCategory**: `'DIPLOMAT' | 'STRATEGER' | 'BYGGARE' | 'UPPTÄCKARE'`
- **ArchetypeCode**: 16 MBTI codes (INFJ, INTJ, etc.)

See `src/types/personality.ts` for full type definitions.

## Database Schema

Key tables with RLS policies (see `skills/database/SKILL.md`):

- `profiles` - User data with `category`, `archetype`, personality info
- `matches` - Match records with `compatibility_score`, `status`
- `messages` - Chat messages with soft-delete via `deleted_at`
- `personality_results` - Test results with dimension scores

## Edge Functions (Deno)

Located in `supabase/functions/`:

- `match-daily` - Daily match generation algorithm
- `ai-assistant` - AI-powered features
- `generate-icebreakers` - Conversation starters
- `send-notification` - Push notifications

Edge functions use Deno with imports from `https://deno.land/` and `https://esm.sh/`.

## UI/Brand System

- **App**: Expo React Native with Native Tabs (Expo Router). Eucalyptus Grove palette (primary green, sage, off-white).
- **Primary color**: `#4b6e48` (brand green); theme via React Navigation ThemeProvider (Dark/Default).
- **Personality Colors**: Purple (Diplomat), Blue (Strateger), Green (Byggare), Gold (Upptäckare)

See `skills/brand/SKILL.md` for complete design tokens if present.

## i18n

Swedish-first with English fallback. Translations in `src/i18n/locales/`:

```tsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// t('key.nested.value')
```

## Environment Variables

Required in `.env` (Expo/React Native):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
```
