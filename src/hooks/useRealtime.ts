import { useEffect, useRef, useState, useCallback } from 'react';
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
  
  // Store callbacks in refs to avoid recreating channel on callback changes
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  useEffect(() => {
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
          if (onMessageRef.current) {
            onMessageRef.current(payload.payload as T);
          }
        } catch (error) {
          if (onErrorRef.current && error instanceof Error) {
            onErrorRef.current(error);
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
  }, [roomId]); // Only recreate channel when roomId changes

  const sendMessage = async (message: T) => {
    if (!channelRef.current) {
      throw new Error('Channel not initialized');
    }
    if (!isConnected) {
      throw new Error('Channel not subscribed yet');
    }

    const sendResult: unknown = await channelRef.current.send({
      type: 'broadcast',
      event: 'message_created',
      payload: message,
    });

    // Supabase returns a status object/string depending on version; treat non-ok as error
    if (typeof sendResult === 'string') {
      if (sendResult.toLowerCase() !== 'ok') {
        throw new Error(`Realtime send failed: ${sendResult}`);
      }
      return;
    }
    if (typeof sendResult === 'object' && sendResult !== null && 'status' in sendResult) {
      const status = (sendResult as { status?: unknown }).status;
      if (typeof status === 'string' && status.toLowerCase() !== 'ok') {
        throw new Error(`Realtime send failed: ${status}`);
      }
    }
  };

  return {
    sendMessage,
    isConnected,
  };
}