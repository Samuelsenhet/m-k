import { useSupabase } from "@/contexts/SupabaseProvider";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device for push notifications via Expo Push API and
 * stores the token in the expo_push_tokens table. Only runs on physical
 * devices (push is unavailable on simulators).
 *
 * Requires: expo-notifications plugin in app.config.cjs + APNs key
 * uploaded to Expo (eas credentials).
 */
export function useExpoPushToken() {
  const { supabase, session } = useSupabase();
  const userId = session?.user?.id;
  const registered = useRef(false);

  useEffect(() => {
    if (!userId || registered.current) return;
    if (!Device.isDevice) {
      if (__DEV__) console.log("[Push] Skipping — not a physical device");
      return;
    }

    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          if (__DEV__) console.log("[Push] Permission not granted");
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "4d900a70-4327-4740-83cc-4ac6745ef8eb",
        });
        const token = tokenData.data;

        if (__DEV__) console.log("[Push] Token:", token);

        // Upsert token to DB
        await supabase.from("expo_push_tokens").upsert(
          {
            user_id: userId,
            token,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,token" }
        );

        registered.current = true;
      } catch (err) {
        if (__DEV__) console.warn("[Push] Registration failed:", err);
      }
    })();
  }, [userId, supabase]);
}
