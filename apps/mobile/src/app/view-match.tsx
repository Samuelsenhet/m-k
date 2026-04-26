import { MatchProfileScreen } from "@/components/profile/MatchProfileScreen";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { useMatches } from "@/hooks/useMatches";
import type { DimensionBreakdownEntry, MatchSubtype } from "@/types/api";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

import { maakTokens } from "@maak/core";

type MatchDetailRow = {
  user_id: string;
  matched_user_id: string;
  status: string | null;
  personality_insight: string | null;
  match_story: string | null;
  match_subtype: MatchSubtype | null;
  match_type: MatchSubtype | null;
  fallback_used: boolean | null;
  dimension_breakdown: DimensionBreakdownEntry[] | null;
  icebreakers: string[] | null;
};

export default function ViewMatchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session, isReady } = useSupabase();
  const user = session?.user;
  const posthog = usePostHog();
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
  const [matchRow, setMatchRow] = useState<MatchDetailRow | null>(null);
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
        .select(
          "user_id, matched_user_id, personality_insight, status, match_story, match_subtype, match_type, fallback_used, dimension_breakdown, icebreakers",
        )
        .eq("id", matchId)
        .maybeSingle();

      if (error || !row) {
        setMatchedUserId(null);
        setRowStatus(null);
        setPersonalityInsight(null);
        setMatchRow(null);
        setLoading(false);
        return;
      }

      const typedRow = row as MatchDetailRow;
      const other =
        typedRow.user_id === user.id ? typedRow.matched_user_id : typedRow.user_id;
      setMatchedUserId(other);
      setRowStatus(typedRow.status ?? null);
      setPersonalityInsight(typedRow.personality_insight ?? null);
      setMatchRow(typedRow);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [matchId, user, supabase]);

  const insight =
    personalityInsight ?? matchFromList?.personalityInsight ?? null;
  const score = matchFromList?.matchScore;
  const status = rowStatus ?? matchFromList?.status ?? undefined;
  const showChat = status === "active_chat" || status === "pending_intro";

  const matchDetail = useMemo(() => {
    const subtype: MatchSubtype | null =
      matchRow?.match_subtype ?? matchFromList?.matchSubtype ?? matchRow?.match_type ?? null;
    const story = matchRow?.match_story ?? matchFromList?.matchStory ?? null;
    if (!subtype || (!story && !matchRow?.dimension_breakdown?.length && !matchRow?.icebreakers?.length)) {
      return undefined;
    }
    return {
      subtype,
      story,
      fallbackUsed: matchRow?.fallback_used ?? matchFromList?.fallbackUsed ?? false,
      dimensionBreakdown:
        matchRow?.dimension_breakdown ?? matchFromList?.dimensionBreakdown ?? [],
      icebreakers:
        (matchRow?.icebreakers ?? matchFromList?.icebreakers ?? []).slice(0, 3),
    };
  }, [matchRow, matchFromList]);

  useEffect(() => {
    if (matchId && matchedUserId) {
      posthog.capture('match_profile_viewed', {
        match_id: matchId,
        match_status: status,
        match_score: score,
      });
    }
  }, [matchId, matchedUserId]);

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
        matchDetail={matchDetail}
        onBack={() => router.back()}
        onChat={
          showChat
            ? () => router.replace(`/(tabs)/chat?match=${encodeURIComponent(matchId)}`)
            : undefined
        }
        onPass={
          status === "pending_intro"
            ? async () => {
                const { error } = await supabase.from("matches").update({ status: "passed" }).eq("id", matchId);
                if (error && __DEV__) console.warn("[view-match] pass failed:", error.message);
                router.back();
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
