import { useSupabase } from "@/contexts/SupabaseProvider";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseRealtimeOptions<T> {
  roomId: string;
  event?: string;
  onMessage?: (message: T) => void;
}

/**
 * Mobile port of web `src/hooks/useRealtime.ts`.
 * Uses mobile Supabase client from SupabaseProvider.
 * Default event: "video_signal" (for Kemi-Check); override with `event` prop.
 */
export function useRealtimeRN<T = unknown>({
  roomId,
  event = "video_signal",
  onMessage,
}: UseRealtimeOptions<T>) {
  const { supabase } = useSupabase();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}:video`, {
      config: { broadcast: { self: false, ack: true } },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event }, (payload) => {
        if (onMessageRef.current) {
          onMessageRef.current(payload.payload as T);
        }
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [supabase, roomId, event]);

  const sendMessage = useCallback(
    async (message: T) => {
      if (!channelRef.current || !isConnected) return;
      await channelRef.current.send({
        type: "broadcast",
        event,
        payload: message,
      });
    },
    [isConnected, event],
  );

  return { sendMessage, isConnected };
}
