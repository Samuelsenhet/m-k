import { useSupabase } from "@/contexts/SupabaseProvider";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

const ONLINE_CHANNEL = "app:online";

function randomAnonKey() {
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Supabase Realtime presence on global channel - same idea as web useOnlineCount.
 */
export function useOnlineCount(userId: string | undefined, hasValidConfig: boolean): number {
  const { supabase } = useSupabase();
  const [count, setCount] = useState(0);
  const anonKeyRef = useRef<string | null>(null);
  if (!anonKeyRef.current) anonKeyRef.current = randomAnonKey();
  const presenceKey = userId ?? anonKeyRef.current;

  useEffect(() => {
    if (!hasValidConfig) return;

    // Remove any existing channel with the same name so we can attach
    // presence callbacks before subscribing (Supabase reuses channel objects
    // and throws if callbacks are added after subscribe()).
    const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${ONLINE_CHANNEL}`);
    if (existing) {
      void supabase.removeChannel(existing);
    }

    const channel: RealtimeChannel = supabase.channel(ONLINE_CHANNEL, {
      config: { presence: { key: presenceKey } },
    });

    const updateCount = () => {
      const state = channel.presenceState();
      setCount(Object.keys(state).length);
    };

    channel
      .on("presence", { event: "sync" }, updateCount)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId ?? null,
            online_at: new Date().toISOString(),
          });
          updateCount();
        }
      });

    return () => {
      void channel.untrack().then(() => {
        void supabase.removeChannel(channel);
      });
    };
  }, [supabase, presenceKey, userId, hasValidConfig]);

  return count;
}
