import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidSupabaseConfig } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ONLINE_CHANNEL = 'app:online';

/**
 * Subscribes to Supabase Realtime presence on a global "app:online" channel.
 * Each client tracks presence with a unique key (user id or anonymous id).
 * Returns the number of unique presences (online users).
 */
export function useOnlineCount(userId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!hasValidSupabaseConfig) return;

    const presenceKey = userId ?? `anon-${crypto.randomUUID()}`;
    const channel: RealtimeChannel = supabase.channel(ONLINE_CHANNEL, {
      config: { presence: { key: presenceKey } },
    });

    const updateCount = () => {
      const state = channel.presenceState();
      const uniqueKeys = Object.keys(state);
      setCount(uniqueKeys.length);
    };

    channel
      .on('presence', { event: 'sync' }, updateCount)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId ?? null, online_at: new Date().toISOString() });
          updateCount();
        }
      });

    return () => {
      channel.untrack().then(() => supabase.removeChannel(channel));
    };
  }, [userId]);

  return count;
}
