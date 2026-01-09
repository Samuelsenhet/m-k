## Realtime Subscriptions Guide

### Overview
Using Supabase Realtime for live updates in MÄÄK chat, matches, and notifications.

## Setup

### Enable Realtime
In Supabase Dashboard:
1. Database → Replication
2. Enable replication for tables:
   - `messages` ✓
   - `matches` ✓
   - `notifications` ✓

### Realtime Permissions
```sql
-- Enable realtime for table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Verify replication enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## Basic Subscription Pattern

### Subscribe to Changes
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeMessages(matchId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    let channel: RealtimeChannel;
    
    // Setup subscription
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
    
    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);
  
  return messages;
}
```

## Event Types

### Listen to INSERT
```typescript
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
  },
  (payload) => {
    console.log('New message:', payload.new);
    // payload.new contains the inserted row
  }
)
```

### Listen to UPDATE
```typescript
.on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'matches',
    filter: `user_id=eq.${userId}`,
  },
  (payload) => {
    console.log('Old:', payload.old);
    console.log('New:', payload.new);
    // Update local state
  }
)
```

### Listen to DELETE
```typescript
.on(
  'postgres_changes',
  {
    event: 'DELETE',
    schema: 'public',
    table: 'messages',
  },
  (payload) => {
    console.log('Deleted:', payload.old);
    // payload.old contains the deleted row
  }
)
```

### Listen to ALL Events
```typescript
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'messages',
  },
  (payload) => {
    console.log('Event:', payload.eventType);
    console.log('Data:', payload.new || payload.old);
  }
)
```

## Filtering

### Filter by Column
```typescript
// Only messages for specific match
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `match_id=eq.${matchId}`,
  },
  handler
)
```

### Multiple Filters
```typescript
// Multiple filters ANDed together
.on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'matches',
    filter: `user_id=eq.${userId}&status=eq.accepted`,
  },
  handler
)
```

### Filter Operators
```typescript
// Equal
filter: 'column=eq.value'

// Not equal
filter: 'column=neq.value'

// Greater than
filter: 'column=gt.value'

// Less than
filter: 'column=lt.value'

// In list
filter: 'column=in.(value1,value2)'
```

## Chat Implementation

### Complete Chat Hook
```typescript
interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export function useChatMessages(matchId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    let channel: RealtimeChannel;
    
    async function setupChat() {
      // 1. Fetch existing messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
      
      // 2. Subscribe to new messages
      channel = supabase
        .channel(`chat:${matchId}`)
        // Listen for new messages
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          }
        )
        // Listen for read receipts
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            const updated = payload.new as Message;
            setMessages(prev =>
              prev.map(m => (m.id === updated.id ? updated : m))
            );
          }
        )
        // Presence: track online users
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const onlineUsers = new Set(
            Object.values(state)
              .flat()
              .map((presence: any) => presence.user_id)
          );
          setOnline(onlineUsers);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Announce presence
            await channel.track({ user_id: currentUserId });
          }
        });
    }
    
    setupChat();
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [matchId, currentUserId]);
  
  const sendMessage = async (content: string) => {
    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUserId,
        content,
      });
    
    if (error) throw error;
  };
  
  const markAsRead = async (messageIds: string[]) => {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .is('read_at', null);
    
    if (error) console.error('Mark as read error:', error);
  };
  
  return {
    messages,
    loading,
    online,
    sendMessage,
    markAsRead,
  };
}
```

## Presence Tracking

### Track User Presence
```typescript
export function usePresence(channelName: string, userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  useEffect(() => {
    const channel = supabase.channel(channelName);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state)
          .flat()
          .map((presence: any) => presence.user_id);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Users joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Users left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });
    
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [channelName, userId]);
  
  return onlineUsers;
}
```

### Typing Indicator
```typescript
export function useTypingIndicator(
  channelName: string,
  userId: string
) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const channel = useMemo(() => supabase.channel(channelName), [channelName]);
  
  useEffect(() => {
    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(prev => new Set(prev).add(payload.user_id));
        
        // Remove after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(payload.user_id);
            return next;
          });
        }, 3000);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channel]);
  
  const notifyTyping = useCallback(() => {
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId },
    });
  }, [channel, userId]);
  
  const handleTyping = useCallback(() => {
    notifyTyping();
    
    // Debounce typing notifications
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      // Stop typing after 1 second of inactivity
    }, 1000);
  }, [notifyTyping]);
  
  return {
    typingUsers: Array.from(typingUsers).filter(id => id !== userId),
    handleTyping,
  };
}
```

## Broadcast Messages

### Send Custom Events
```typescript
// Sender
const channel = supabase.channel('custom-channel');

channel.send({
  type: 'broadcast',
  event: 'custom-event',
  payload: { message: 'Hello!' },
});

// Receiver
channel
  .on('broadcast', { event: 'custom-event' }, ({ payload }) => {
    console.log('Received:', payload);
  })
  .subscribe();
```

## Connection Status

### Monitor Connection
```typescript
export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  useEffect(() => {
    const channel = supabase.channel('status-monitor');
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setStatus('connected');
      } else if (status === 'CHANNEL_ERROR') {
        setStatus('disconnected');
      }
    });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return status;
}
```

## Performance Optimization

### Batch Updates
```typescript
useEffect(() => {
  const updates: Message[] = [];
  let timeoutId: NodeJS.Timeout;
  
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', { ... }, (payload) => {
      updates.push(payload.new as Message);
      
      // Batch updates every 100ms
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMessages(prev => [...prev, ...updates]);
        updates.length = 0;
      }, 100);
    })
    .subscribe();
  
  return () => {
    clearTimeout(timeoutId);
    supabase.removeChannel(channel);
  };
}, []);
```

### Limit Subscriptions
```typescript
// ❌ Don't subscribe to everything
messages.map(msg => {
  // Creates 100s of subscriptions!
  useRealtimeMessages(msg.id);
});

// ✅ Subscribe to parent only
useRealtimeMessages(matchId);
```

## Error Handling

### Handle Connection Errors
```typescript
channel.subscribe((status, error) => {
  if (status === 'CHANNEL_ERROR') {
    console.error('Subscription error:', error);
    // Retry logic
  } else if (status === 'TIMED_OUT') {
    console.error('Connection timeout');
    // Reconnect
  }
});
```

### Retry Logic
```typescript
const MAX_RETRIES = 3;
let retryCount = 0;

function setupSubscription() {
  const channel = supabase
    .channel('messages')
    .on(...)
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(setupSubscription, 1000 * retryCount);
      }
    });
}
```

## Best Practices

1. **Always Clean Up**
   ```typescript
   return () => {
     supabase.removeChannel(channel);
   };
   ```

2. **Use Specific Channels**
   ```typescript
   // ✅ Specific
   channel('messages:123')
   
   // ❌ Too broad
   channel('messages')
   ```

3. **Filter Server-Side**
   ```typescript
   // ✅ Filter in subscription
   filter: `match_id=eq.${matchId}`
   
   // ❌ Filter client-side
   if (message.match_id === matchId) { ... }
   ```

4. **Prevent Duplicates**
   ```typescript
   setMessages(prev => {
     if (prev.some(m => m.id === newMessage.id)) {
       return prev;
     }
     return [...prev, newMessage];
   });
   ```

5. **Handle Offline Mode**
   ```typescript
   if (!navigator.onLine) {
     // Queue messages locally
     return;
   }
   ```
