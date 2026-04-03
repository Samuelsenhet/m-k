import { MatchProfileScreen } from "@/components/profile/MatchProfileScreen";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { useMatches } from "@/hooks/useMatches";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { maakTokens } from "@maak/core";

export default function ViewMatchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session, isReady } = useSupabase();
  const user = session?.user;
  const authLoading = !isReady;
  const { matches } = useMatches(authLoading);
  const { match: matchParam } = useLocalSearchParams<{ match?: string }>();

  const matchId = useMemo(
    () => (typeof matchParam === "string" ? matchParam : matchParam?.[0]),
    [matchParam],
  );

  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [personalityInsight, setPersonalityInsight] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const matchFromList = matchId ? matches.find((m) => m.id === matchId) : undefined;

  useEffect(() => {
    if (!matchId || !user) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: row, error } = await supabase
        .from("matches")
        .select("user_id, matched_user_id, personality_insight, status")
        .eq("id", matchId)
        .maybeSingle();

      if (error || !row) {
        setMatchedUserId(null);
        setRowStatus(null);
        setPersonalityInsight(null);
        setLoading(false);
        return;
      }

      const other =
        row.user_id === user.id ? row.matched_user_id : row.user_id;
      setMatchedUserId(other);
      setRowStatus(row.status ?? null);
      setPersonalityInsight(
        (row as { personality_insight?: string | null }).personality_insight ?? null,
      );
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [matchId, user, supabase]);

  const insight =
    personalityInsight ?? matchFromList?.personalityInsight ?? null;
  const score = matchFromList?.matchScore;
  const status = rowStatus ?? matchFromList?.status ?? undefined;
  const showChat = status === "active_chat" || status === "pending_intro";

  if (!matchId) {
    return (
      <>
        <Stack.Screen options={{ title: t("matches.view_match_header"), headerShown: true }} />
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <Text style={styles.err}>{t("common.error")}</Text>
        </View>
      </>
    );
  }

  if (loading || !matchedUserId) {
    return (
      <>
        <Stack.Screen options={{ title: t("matches.view_match_header"), headerShown: true }} />
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={maakTokens.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("nav.profile"), headerShown: false }} />
      <MatchProfileScreen
        userId={matchedUserId}
        matchScore={score}
        personalityInsight={insight}
        showLikePass={false}
        onBack={() => router.back()}
        onChat={
          showChat
            ? () => {
                router.replace(
                  `/(tabs)/chat?match=${encodeURIComponent(matchId)}`,
                );
              }
            : undefined
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: maakTokens.background },
  err: { color: maakTokens.destructive },
});
