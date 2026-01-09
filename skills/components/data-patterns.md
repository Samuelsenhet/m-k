## Data Fetching Patterns

### Overview
Best practices for fetching, caching, and managing data from Supabase in MÄÄK.

## Custom Hook Pattern

### Basic Data Hook
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useData<T>(
  table: string,
  filter?: { column: string; value: any }
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from(table).select('*');
      
      if (filter) {
        query = query.eq(filter.column, filter.value);
      }
      
      const { data: result, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setData(result as T);
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod');
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [table, filter?.column, filter?.value]);
  
  return { data, loading, error, refetch: fetchData };
}
```

### Usage
```tsx
export function ProfileView({ userId }: { userId: string }) {
  const { data: profile, loading, error, refetch } = useData<Profile>(
    'profiles',
    { column: 'user_id', value: userId }
  );
  
  if (loading) return <div>Laddar...</div>;
  if (error) return <div>Fel: {error}</div>;
  if (!profile) return <div>Ingen profil hittades</div>;
  
  return (
    <div>
      <h1>{profile.display_name}</h1>
      <Button onClick={refetch}>Uppdatera</Button>
    </div>
  );
}
```

## Matches Hook

### Implementation
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Match {
  id: string;
  matched_user_id: string;
  compatibility_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  profile: {
    display_name: string;
    archetype: string;
    category: string;
    photos: string[];
  };
}

export function useMatches(userId: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from('matches')
          .select(`
            id,
            matched_user_id,
            compatibility_score,
            status,
            profile:profiles!matched_user_id (
              display_name,
              archetype,
              category,
              photos
            )
          `)
          .eq('user_id', userId)
          .order('compatibility_score', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setMatches(data as Match[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMatches();
  }, [userId]);
  
  const acceptMatch = async (matchId: string) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'accepted' })
      .eq('id', matchId);
    
    if (!error) {
      setMatches(matches.map(m => 
        m.id === matchId ? { ...m, status: 'accepted' } : m
      ));
    }
  };
  
  const rejectMatch = async (matchId: string) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'rejected' })
      .eq('id', matchId);
    
    if (!error) {
      setMatches(matches.filter(m => m.id !== matchId));
    }
  };
  
  return { matches, loading, error, acceptMatch, rejectMatch };
}
```

## Messages Hook with Realtime

### Implementation
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export function useMessages(matchId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  useEffect(() => {
    let channel: RealtimeChannel | undefined;
    
    async function setupMessages() {
      try {
        // Fetch existing messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setMessages(data);
        }
        
        // Subscribe to new messages
        channel = supabase
          .channel(`messages:${matchId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
              setMessages(prev => [...prev, payload.new as Message]);
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Error setting up messages:', err);
      } finally {
        setLoading(false);
      }
    }
    
    setupMessages();
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [matchId]);
  
  const sendMessage = async (content: string) => {
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: currentUserId,
          content,
        });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };
  
  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
  };
  
  return { messages, loading, sending, sendMessage, markAsRead };
}
```

## Optimistic Updates

### Pattern
```typescript
export function useOptimisticUpdate<T extends { id: string }>(
  table: string,
  initialData: T[]
) {
  const [data, setData] = useState<T[]>(initialData);
  const [pending, setPending] = useState<Set<string>>(new Set());
  
  const updateItem = async (id: string, updates: Partial<T>) => {
    // Capture original item before optimistic update
    const original = initialData.find(i => i.id === id);
    
    // Optimistically update UI
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    
    setPending(prev => new Set(prev).add(id));
    
    try {
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      // Revert on error using captured original
      if (original) {
        setData(prev => prev.map(item =>
          item.id === id ? original : item
        ));
      }
      throw err;
    } finally {
      setPending(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };
  
  return { data, pending, updateItem };
}
```

## Pagination Pattern

### Implementation
```typescript
interface UsePaginatedDataProps {
  table: string;
  pageSize: number;
  orderBy?: { column: string; ascending: boolean };
}

export function usePaginatedData<T>({ 
  table, 
  pageSize, 
  orderBy 
}: UsePaginatedDataProps) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const fetchPage = async (pageNum: number) => {
    setLoading(true);
    
    try {
      let query = supabase
        .from(table)
        .select('*')
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);
      
      if (orderBy) {
        query = query.order(orderBy.column, { 
          ascending: orderBy.ascending 
        });
      }
      
      const { data: pageData, error } = await query;
      
      if (error) throw error;
      
      if (pageNum === 0) {
        setData(pageData as T[]);
      } else {
        setData(prev => [...prev, ...(pageData as T[])]);
      }
      
      setHasMore((pageData?.length || 0) === pageSize);
      setPage(pageNum);
    } catch (err) {
      console.error('Pagination error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPage(page + 1);
    }
  };
  
  const refresh = () => {
    fetchPage(0);
  };
  
  useEffect(() => {
    fetchPage(0);
  }, [table, pageSize, JSON.stringify(orderBy)]);
  
  return { data, loading, hasMore, loadMore, refresh };
}
```

## Infinite Scroll Hook

### Implementation
```typescript
import { useEffect, useRef } from 'react';

export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  loading: boolean
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (loading || !hasMore) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 1.0 }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, hasMore, loading]);
  
  return loadMoreRef;
}

// Usage
function MatchList() {
  const { data, loading, hasMore, loadMore } = usePaginatedData({
    table: 'matches',
    pageSize: 10,
  });
  
  const loadMoreRef = useInfiniteScroll(loadMore, hasMore, loading);
  
  return (
    <div>
      {data.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
      
      <div ref={loadMoreRef} className="h-10">
        {loading && <Spinner />}
      </div>
    </div>
  );
}
```

## Error Boundary Pattern

### Implementation
```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Data fetch error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center p-8">
          <p className="text-destructive">Ett fel uppstod vid hämtning av data</p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Försök igen
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Best Practices

1. **Error Handling**
   - Always handle errors gracefully
   - Provide retry mechanisms
   - Log errors for debugging

2. **Loading States**
   - Show skeleton loaders
   - Indicate what's loading
   - Don't block UI unnecessarily

3. **Caching**
   - Store frequently accessed data
   - Implement cache invalidation
   - Use SWR pattern when appropriate

4. **Performance**
   - Paginate large datasets
   - Use realtime selectively
   - Memoize expensive computations

5. **Type Safety**
   - Generate TypeScript types from schema
   - Use generic hooks for reusability
   - Validate data at boundaries
