import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NativeModules, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const hasWebRTC = !!NativeModules.WebRTCModule;

export default function KemiCheckScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matchId: rawId } = useLocalSearchParams<{ matchId: string | string[] }>();
  const matchId = typeof rawId === "string" ? rawId : rawId?.[0] ?? "";
  const { session } = useSupabase();
  const [ended, setEnded] = useState(false);

  // TODO: resolve matched user name from match record
  const matchedUserName = t("mobile.kemicheck.partner");

  const handleEnd = useCallback(
    (durationSeconds: number) => {
      setEnded(true);
      if (__DEV__) console.log(`[KemiCheck] Call ended: ${durationSeconds}s`);
      router.back();
    },
    [router],
  );

  // Expo Go fallback — no native WebRTC module
  if (!hasWebRTC) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.fallback, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={maakTokens.foreground} />
          </Pressable>
          <Ionicons name="videocam-off-outline" size={48} color={maakTokens.primary} />
          <Text style={styles.fallbackTitle}>{t("mobile.kemicheck.title")}</Text>
          <Text style={styles.fallbackBody}>{t("mobile.kemicheck.not_available")}</Text>
        </View>
      </>
    );
  }

  // Lazy-require KemiCheckRN to avoid loading react-native-webrtc in Expo Go
  const KemiCheckRN = hasWebRTC
    ? require("@/components/video/KemiCheckRN").KemiCheckRN
    : null;

  if (!matchId || !session?.user || ended) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.fallback, { paddingTop: insets.top }]}>
          <Text style={styles.fallbackBody}>{t("common.loading")}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {KemiCheckRN ? (
        <KemiCheckRN
          matchId={matchId}
          matchedUserName={matchedUserName}
          isInitiator
          onEnd={handleEnd}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: maakTokens.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  closeBtn: { position: "absolute", top: 56, left: 16 },
  fallbackTitle: { fontSize: 22, fontWeight: "700", color: maakTokens.foreground },
  fallbackBody: { fontSize: 15, color: maakTokens.mutedForeground, textAlign: "center" },
});
