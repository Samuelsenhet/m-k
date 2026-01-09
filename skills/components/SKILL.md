---
name: MÄÄK Component Patterns
description: Reusable component patterns and UI conventions
---

## Overview
Standard patterns for building consistent, accessible components across the MÄÄK app.

## Component Structure

### Directory Organization
```
src/components/
├── ui/              # shadcn/ui base components
├── auth/            # Authentication components
├── chat/            # Chat and messaging
├── landing/         # Landing page sections
├── mascot/          # Mascot character
├── matches/         # Match display
├── navigation/      # Nav components
├── onboarding/      # Onboarding flow
├── personality/     # Personality test
├── profile/         # User profiles
└── settings/        # Settings panels
```

### File Naming
- PascalCase for component files: `MatchCard.tsx`
- camelCase for utilities: `useMatches.ts`
- kebab-case for CSS: `match-card.module.css`

## Common Patterns

### Component Template
```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ComponentNameProps {
  title: string;
  onAction?: () => void;
}

export function ComponentName({ title, onAction }: ComponentNameProps) {
  const [state, setState] = useState('');

  const handleClick = () => {
    onAction?.();
  };

  return (
    <Card>
      <h2>{title}</h2>
      <Button onClick={handleClick}>Action</Button>
    </Card>
  );
}
```

### Custom Hook Pattern
```tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCustomHook(userId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('table')
          .select('*')
          .eq('user_id', userId);
        
        if (error) throw error;
        setData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  return { data, loading, error };
}
```

## Best Practices

1. **Use TypeScript** - Define explicit prop types
2. **Extract Logic** - Move complex logic to custom hooks
3. **Composition** - Build complex UIs from simple components
4. **Accessibility** - Include ARIA labels and keyboard navigation
5. **Performance** - Memoize expensive computations with useMemo/useCallback
