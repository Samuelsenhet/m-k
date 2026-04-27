import { useSupabase } from "@/contexts/SupabaseProvider";
import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  created_at: string;
}

/**
 * Subscribe to the Supabase Realtime `user:<id>:notifications` channel.
 * Shows in-app alerts when notifications arrive. This bridges the gap
 * until expo-notifications + APNs are fully configured for true push.
 */
export function useRealtimeNotifications() {
  const { supabase, session } = useSupabase();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    const channel = supabase.channel(`user:${userId}:notifications`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "notification_received" }, (msg) => {
        if (!active) return;
        const payload = msg.payload as NotificationPayload;
        if (payload?.title && payload?.message) {
          if (Platform.OS === "ios" || Platform.OS === "android") {
            Alert.alert(payload.title, payload.message);
          }
        }
      })
      .subscribe();

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, userId]);
}
