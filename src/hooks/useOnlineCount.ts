import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PRESENCE_CHANNEL = 'maak:online';

/**
 * Live användarräknare via Supabase Realtime Presence.
 * Användare som är inloggade och har appen öppen trackas i kanalen.
 * Vid fel (offline/realtime ned) returneras null – komponenten kan dölja eller visa fallback.
 */
export function useOnlineCount(userId: string | undefined) {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const updateCount = useCallback((state: Record<string, { user_id?: string }[]>) => {
    const presences = state?.presences ?? {};
    const unique = new Set<string>();
    Object.values(presences).forEach((list) => {
      list?.forEach((p) => {
        if (p?.user_id) unique.add(p.user_id);
      });
    });
    setCount(unique.size);
    setError(false);
  }, []);

  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId ?? 'anonymous' } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, { user_id?: string }[]>;
        updateCount(state);
      })
      .on('presence', { event: 'join' }, ({ key, currentPresences }) => {
        const state = { ...channel.presenceState(), presences: currentPresences };
        updateCount(state as Record<string, { user_id?: string }[]>);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && userId) {
          await channel.track({ user_id: userId });
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(true);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setCount(null);
    };
  }, [userId, updateCount]);

  return { count, error };
}
