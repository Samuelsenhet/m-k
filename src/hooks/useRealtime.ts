import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions<T> {
  roomId: string;
  onMessage?: (message: T) => void;
  onError?: (error: Error) => void;
}

export function useRealtime<T = unknown>({ roomId, onMessage, onError }: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if already subscribed to prevent multiple subscriptions
    if (channelRef.current?.state === 'subscribed') return;

    const channel = supabase.channel(`room:${roomId}:messages`, {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'message_created' }, (payload) => {
        try {
          if (onMessage) {
            onMessage(payload.payload as T);
          }
        } catch (error) {
          if (onError && error instanceof Error) {
            onError(error);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [roomId, onMessage, onError]);

  const sendMessage = async (message: T) => {
    if (!channelRef.current) {
      throw new Error('Channel not initialized');
    }

    const { error } = await channelRef.current.send({
      type: 'broadcast',
      event: 'message_created',
      payload: message,
    });

    if (error) {
      throw error;
    }
  };

  return {
    sendMessage,
    isConnected,
  };
}