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

    const channel = supabase.channel(`user:${userId}:notifications`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "notification_received" }, (msg) => {
        const payload = msg.payload as NotificationPayload;
        if (payload?.title && payload?.message) {
          if (Platform.OS === "ios" || Platform.OS === "android") {
            Alert.alert(payload.title, payload.message);
          }
        }
      })
      .subscribe((status) => {
        if (__DEV__ && status === "SUBSCRIBED") {
          console.log("[Realtime] Subscribed to notifications channel");
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, userId]);
}
