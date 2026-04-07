import { FirstMatchCelebrationRN } from "@/components/journey/FirstMatchCelebrationRN";
import { WaitingPhaseRN } from "@/components/journey/WaitingPhaseRN";
import { MatchListCard } from "@/components/matches/MatchListCard";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { MascotAssets } from "@/lib/mascotAssets";
import { useMatchStatus } from "@/hooks/useMatchStatus";
import { useMatches } from "@/hooks/useMatches";
import { useMatchActions } from "@/hooks/useMatchActions";
import { useSundayRematch } from "@/hooks/useSundayRematch";
import { isSupabaseInvokeUnauthorized } from "@maak/core";
import { maakTokens } from "@maak/core";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getNextMidnightISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

type TabKey = "all" | "similar" | "complementary";

const MATCHES_READY_CELEBRATION_KEY = "@maak/matches_ready_celebration_seen";
const FIRST_MATCH_CELEBRATION_KEY = "@maak/first_match_celebration_seen";

export default function MatchesScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session, isReady, hasValidSupabaseConfig } = useSupabase();
  const authLoading = !isReady;
  const user = session?.user;
  const onlineCount = useOnlineCount(user?.id, hasValidSupabaseConfig);

  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    errorDetail: matchesErrorDetail,
    authSessionMissing,
    refreshMatches,
    fetchMoreMatches,
    hasMore,
    setMatches,
  } = useMatches(authLoading);

  const { passMatch } = useMatchActions(matches, setMatches);

  const {
    status: matchStatus,
    isLoading: statusLoading,
    error: statusError,
    errorDetail: statusErrorDetail,
    refetch: refetchMatchStatus,
  } = useMatchStatus(authLoading);

  const { sundayMatches, isSunday } = useSundayRematch();

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [firstMatchOpen, setFirstMatchOpen] = useState(false);
  const prevJourneyPhaseRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const p = matchStatus?.journey_phase;
    const prev = prevJourneyPhaseRef.current;
    if (prev === "WAITING" && p === "READY") {
      void AsyncStorage.getItem(MATCHES_READY_CELEBRATION_KEY).then((stored) => {
        if (stored !== "1") {
          setCelebrationOpen(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      });
    }
    if (p) prevJourneyPhaseRef.current = p;
  }, [matchStatus?.journey_phase]);

  useEffect(() => {
    if (matchStatus?.journey_phase !== "FIRST_MATCH") {
      setFirstMatchOpen(false);
      return;
    }
    void AsyncStorage.getItem(FIRST_MATCH_CELEBRATION_KEY).then((stored) => {
      if (stored !== "1") setFirstMatchOpen(true);
    });
  }, [matchStatus?.journey_phase]);

  const dismissCelebration = useCallback(() => {
    void AsyncStorage.setItem(MATCHES_READY_CELEBRATION_KEY, "1");
    setCelebrationOpen(false);
  }, []);

  const dismissFirstMatch = useCallback(() => {
    void AsyncStorage.setItem(FIRST_MATCH_CELEBRATION_KEY, "1");
    setFirstMatchOpen(false);
  }, []);

  const withCelebrationModal = useCallback(
    (inner: ReactNode) => (
      <>
        <Modal
          visible={celebrationOpen}
          transparent
          animationType="fade"
          onRequestClose={dismissCelebration}
        >
          <Pressable style={styles.celebrationOverlay} onPress={dismissCelebration}>
            <View style={styles.celebrationCard}>
              <Text style={styles.celebrationTitle}>
                {t("maak_narrative_variants.matches_ready_title")}
              </Text>
              <Text style={styles.celebrationBody}>
                {t("maak_narrative_variants.matches_ready_body")}
              </Text>
              <Pressable style={styles.celebrationBtn} onPress={dismissCelebration}>
                <Text style={styles.celebrationBtnTxt}>
                  {t("maak_narrative_variants.see_matches_cta")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
        {inner}
      </>
    ),
    [celebrationOpen, dismissCelebration, t],
  );

  const edgeUnauthorized =
    isSupabaseInvokeUnauthorized(matchesErrorDetail) ||
    isSupabaseInvokeUnauthorized(statusErrorDetail);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/phone-auth");
    }
  }, [isReady, user, router]);

  useEffect(() => {
    if (authLoading || edgeUnauthorized) return;
    if (!user) return;
    if (authSessionMissing || statusError?.message === "Not authenticated") {
      router.replace("/phone-auth");
    }
  }, [authLoading, edgeUnauthorized, user, authSessionMissing, statusError, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchMatchStatus(), refreshMatches()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMatchStatus, refreshMatches]);

  const getPublicUrl = useCallback(
    (path: string) => supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl,
    [supabase],
  );

  const pendingMatches = useMemo(
    () => matches.filter((m) => m.status === "pending_intro"),
    [matches],
  );
  const mutualMatches = useMemo(
    () => matches.filter((m) => m.status === "active_chat"),
    [matches],
  );
  const similarMatches = useMemo(
    () => pendingMatches.filter((m) => m.matchType === "similar"),
    [pendingMatches],
  );
  const complementaryMatches = useMemo(
    () => pendingMatches.filter((m) => m.matchType === "complementary"),
    [pendingMatches],
  );

  const filteredPending = useMemo(() => {
    if (activeTab === "similar") return similarMatches;
    if (activeTab === "complementary") return complementaryMatches;
    return pendingMatches;
  }, [activeTab, similarMatches, complementaryMatches, pendingMatches]);

  const openChat = useCallback(
    (matchId: string) => router.push(`/(tabs)/chat?match=${encodeURIComponent(matchId)}`),
    [router],
  );

  const openProfile = useCallback(
    (matchId: string) => router.push(`/view-match?match=${encodeURIComponent(matchId)}`),
    [router],
  );

  type ListItem =
    | { type: "empty"; key: string }
    | { type: "section"; title: string; key: string }
    | { type: "match"; match: (typeof matches)[number]; mutual: boolean; key: string }
    | { type: "sunday-banner"; key: string }
    | { type: "sunday-match"; sundayMatch: (typeof sundayMatches)[number]; key: string };

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    const hasAny = pendingMatches.length > 0 || mutualMatches.length > 0;

    if (!hasAny) {
      items.push({ type: "empty", key: "empty" });
      return items;
    }

    if (mutualMatches.length > 0) {
      items.push({
        type: "section",
        title: t("matches.mutual_section", { count: mutualMatches.length }),
        key: "section-mutual",
      });
      for (const m of mutualMatches) {
        items.push({ type: "match", match: m, mutual: true, key: `mutual-${m.id}` });
      }
    }

    if (isSunday && sundayMatches.length > 0) {
      items.push({ type: "sunday-banner", key: "sunday-banner" });
      for (const m of sundayMatches) {
        items.push({ type: "sunday-match", sundayMatch: m, key: `sun-${m.id}` });
      }
    }

    if (filteredPending.length > 0) {
      items.push({ type: "section", title: t("matches.discover_section"), key: "section-discover" });
      for (const m of filteredPending) {
        items.push({ type: "match", match: m, mutual: false, key: `pending-${m.id}` });
      }
    }

    return items;
  }, [pendingMatches, mutualMatches, isSunday, sundayMatches, filteredPending, t]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.type) {
        case "empty":
          return (
            <View style={styles.emptyCard}>
              <Image
                source={MascotAssets.plantingSeed}
                style={styles.emptyMascot}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
              <Text style={styles.emptyTitle}>{t("matches.noMatches")}</Text>
              <Text style={styles.emptyBody}>{t("matches.noMatchesDescription")}</Text>
            </View>
          );
        case "section":
          return <Text style={styles.sectionTitle}>{item.title}</Text>;
        case "match":
          return (
            <MatchListCard
              match={item.match}
              getPublicUrl={getPublicUrl}
              mutual={item.mutual}
              onChat={() => openChat(item.match.id)}
              onViewProfile={() => openProfile(item.match.id)}
              onPass={item.mutual ? undefined : () => void passMatch(item.match.id)}
            />
          );
        case "sunday-banner":
          return (
            <View style={styles.sundayBanner}>
              <Image
                source={MascotAssets.encouraging}
                style={styles.sundayMascot}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.sundayTitle}>{t("matches.sunday_title")}</Text>
                <Text style={styles.sundaySub}>{t("matches.sunday_sub")}</Text>
              </View>
            </View>
          );
        case "sunday-match":
          return (
            <MatchListCard
              match={{
                id: item.sundayMatch.id,
                matchedUser: {
                  userId: item.sundayMatch.matchedUserId,
                  displayName: item.sundayMatch.displayName,
                  avatarUrl: item.sundayMatch.avatarUrl ?? undefined,
                  category: "",
                  archetype: item.sundayMatch.archetype ?? undefined,
                  photos: item.sundayMatch.photos,
                },
                matchType: "similar",
                matchScore: item.sundayMatch.compatibilityScore ?? 0,
                status: "pending_intro",
                interests: [],
                compatibilityFactors: [],
                expiresAt: "",
                personalityInsight: null,
              }}
              getPublicUrl={getPublicUrl}
              onChat={() => openChat(item.sundayMatch.id)}
              onViewProfile={() => openProfile(item.sundayMatch.id)}
              onPass={() => void passMatch(item.sundayMatch.id)}
            />
          );
      }
    },
    [getPublicUrl, openChat, openProfile, passMatch, t],
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  const signOutAndRedirect = async () => {
    await supabase.auth.signOut();
    router.replace("/phone-auth");
  };

  if (!isReady || (!user && isReady)) {
    return withCelebrationModal(
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
      </View>,
    );
  }

  if (matchStatus?.journey_phase === "WAITING") {
    return withCelebrationModal(
      <WaitingPhaseRN
        timeRemaining={matchStatus.time_remaining}
        nextMatchAvailable={matchStatus.next_reset_time}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />,
    );
  }

  if (matchStatus?.journey_phase === "FIRST_MATCH" && firstMatchOpen) {
    return withCelebrationModal(<FirstMatchCelebrationRN onContinue={dismissFirstMatch} />);
  }

  if (user && edgeUnauthorized) {
    return withCelebrationModal(
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.errorPad, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.errorTitle}>{t("matches.edge_auth_title")}</Text>
        <Text style={styles.errorBody}>{t("matches.edge_auth_body")}</Text>
        <Text style={styles.errorSteps}>{t("matches.edge_auth_steps")}</Text>
        <Text style={styles.errorLi}>1. {t("matches.edge_auth_step1")}</Text>
        <Text style={styles.errorLi}>2. {t("matches.edge_auth_step2")}</Text>
        <Text style={styles.errorLi}>3. {t("matches.edge_auth_step3")}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => void onRefresh()}>
          <Text style={styles.primaryBtnText}>{t("matches.edge_auth_retry")}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => void signOutAndRedirect()}>
          <Text style={styles.secondaryBtnText}>{t("matches.edge_auth_sign_out")}</Text>
        </Pressable>
      </ScrollView>,
    );
  }

  if (authLoading || statusLoading) {
    return withCelebrationModal(
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>,
    );
  }

  if (
    user &&
    statusError &&
    !edgeUnauthorized &&
    matchStatus === null &&
    !statusLoading &&
    !matchesLoading
  ) {
    return withCelebrationModal(
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.errorPad, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.errorTitle}>{t("matches.error_title")}</Text>
        <Text style={styles.errorBody}>{t("matches.error_reassure")}</Text>
        {__DEV__ && statusError.message ? (
          <Text style={styles.errorDetail}>{statusError.message}</Text>
        ) : null}
        <Pressable style={styles.primaryBtn} onPress={() => void refetchMatchStatus()}>
          <Text style={styles.primaryBtnText}>{t("matches.retry")}</Text>
        </Pressable>
      </ScrollView>,
    );
  }

  if (matchesError) {
    return withCelebrationModal(
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.errorPad, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.errorTitle}>{t("matches.error_title")}</Text>
        <Text style={styles.errorBody}>{t("matches.error_reassure")}</Text>
        {__DEV__ && matchesErrorDetail != null ? (
          <Text style={styles.errorDetail}>
            {matchesErrorDetail instanceof Error
              ? matchesErrorDetail.message
              : String(matchesErrorDetail)}
          </Text>
        ) : __DEV__ ? (
          <Text style={styles.errorDetail}>{matchesError}</Text>
        ) : null}
        <Pressable style={styles.primaryBtn} onPress={() => void refreshMatches()}>
          <Text style={styles.primaryBtnText}>{t("matches.retry")}</Text>
        </Pressable>
      </ScrollView>,
    );
  }

  if (matchStatus === null && !matchesLoading && matches.length === 0) {
    return withCelebrationModal(
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.waitingBox, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.waitingTitle}>{t("matches.until_ready")}</Text>
        <Text style={styles.waitingBody}>{t("matches.noMatchesDescription")}</Text>
        <Text style={styles.timerHint}>
          {t("matches.next_reset_prefix")}{" "}
          {new Date(getNextMidnightISO()).toLocaleString(
            i18n.language.startsWith("en") ? "en-US" : "sv-SE",
          )}
        </Text>
      </ScrollView>,
    );
  }

  if (matchesLoading && matches.length === 0) {
    return withCelebrationModal(
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
        <Text style={styles.loadingText}>{t("maak.waiting")}</Text>
      </View>,
    );
  }

  const listHeader = useMemo(
    () => (
      <>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t("matches.title")}</Text>
            <Text style={styles.subtitle}>{t("matches.subtitle")}</Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => void onRefresh()} hitSlop={12}>
            <Text style={styles.iconBtnText}>↻</Text>
          </Pressable>
        </View>

        {hasValidSupabaseConfig && onlineCount > 0 ? (
          <Text style={styles.online}>
            {t("landing.users_seeking_love", { count: onlineCount })}
          </Text>
        ) : null}

        <View style={styles.insight}>
          <Text style={styles.insightTitle}>{t("matches.insight_title")}</Text>
          <Text style={styles.insightSub}>{t("matches.insight_subtitle")}</Text>
          <View style={styles.pillRow}>
            <View style={styles.pillGreen}>
              <Text style={styles.pillGreenText}>
                {similarMatches.length} {t("matches.similar")}
              </Text>
            </View>
            <View style={styles.pillCoral}>
              <Text style={styles.pillCoralText}>
                {complementaryMatches.length} {t("matches.complementary")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabs}>
          {(
            [
              ["all", t("matches.tabAll"), pendingMatches.length] as const,
              ["similar", t("matches.tabSimilar"), similarMatches.length] as const,
              ["complementary", t("matches.tabComplementary"), complementaryMatches.length] as const,
            ] as const
          ).map(([key, label, count]) => (
            <Pressable
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                {label} ({count})
              </Text>
            </Pressable>
          ))}
        </View>
      </>
    ),
    [
      t, onRefresh, hasValidSupabaseConfig, onlineCount,
      similarMatches.length, complementaryMatches.length,
      pendingMatches.length, activeTab,
    ],
  );

  const listFooter = useMemo(
    () => (
      <>
        {hasMore ? (
          <Pressable
            style={styles.loadMore}
            onPress={() => void fetchMoreMatches()}
            disabled={matchesLoading}
          >
            {matchesLoading ? (
              <ActivityIndicator color={maakTokens.primary} />
            ) : (
              <Text style={styles.loadMoreText}>{t("matches.load_more")}</Text>
            )}
          </Pressable>
        ) : null}
        <Text style={styles.footerNote}>{t("matches.footer_tomorrow")}</Text>
      </>
    ),
    [hasMore, fetchMoreMatches, matchesLoading, t],
  );

  return withCelebrationModal(
    <FlatList
      data={listData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: maakTokens.screenPaddingHorizontal,
        paddingBottom: insets.bottom + 24,
        gap: 16,
      }}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      initialNumToRender={10}
      maxToRenderPerBatch={8}
      windowSize={7}
    />,
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: maakTokens.background },
  loadingText: { marginTop: 12, color: maakTokens.mutedForeground },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700", color: maakTokens.foreground },
  subtitle: { fontSize: 14, color: maakTokens.mutedForeground, marginTop: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: maakTokens.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { fontSize: 20, color: maakTokens.primary, fontWeight: "700" },
  online: { fontSize: 13, fontWeight: "600", color: maakTokens.primary, marginBottom: 12 },
  insight: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    padding: 16,
    borderWidth: 1,
    borderColor: maakTokens.border,
    marginBottom: 16,
  },
  insightTitle: { fontSize: 16, fontWeight: "700", color: maakTokens.foreground },
  insightSub: { fontSize: 12, color: maakTokens.mutedForeground, marginTop: 4, marginBottom: 10 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pillGreen: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: `${maakTokens.primary}18`,
    borderWidth: 1,
    borderColor: `${maakTokens.primary}44`,
  },
  pillGreenText: { fontSize: 12, fontWeight: "600", color: maakTokens.primary },
  pillCoral: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: `${maakTokens.coral}18`,
    borderWidth: 1,
    borderColor: `${maakTokens.coral}44`,
  },
  pillCoralText: { fontSize: 12, fontWeight: "600", color: maakTokens.coral },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: maakTokens.muted,
    alignItems: "center",
  },
  tabActive: { backgroundColor: `${maakTokens.primary}22` },
  tabText: { fontSize: 11, fontWeight: "600", color: maakTokens.mutedForeground, textAlign: "center" },
  tabTextActive: { color: maakTokens.primary },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: maakTokens.foreground, marginBottom: 10, marginTop: 8 },
  emptyCard: {
    padding: 20,
    borderRadius: maakTokens.radiusXl,
    backgroundColor: maakTokens.card,
    borderWidth: 1,
    borderColor: maakTokens.border,
    marginBottom: 16,
    alignItems: "center",
  },
  emptyMascot: { width: 160, height: 160, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: maakTokens.foreground, textAlign: "center" },
  emptyBody: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    marginTop: 8,
    lineHeight: 20,
    textAlign: "center",
  },
  loadMore: { marginTop: 16, padding: 14, alignItems: "center" },
  loadMoreText: { color: maakTokens.primary, fontWeight: "600" },
  footerNote: { textAlign: "center", fontSize: 13, color: maakTokens.mutedForeground, marginTop: 20 },
  sundayBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${maakTokens.primary}14`,
    borderRadius: maakTokens.radiusXl,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  sundayMascot: { width: 48, height: 48 },
  sundayTitle: { fontSize: 16, fontWeight: "700", color: maakTokens.foreground },
  sundaySub: { fontSize: 13, color: maakTokens.mutedForeground, marginTop: 2 },
  waitingBox: { paddingHorizontal: maakTokens.screenPaddingHorizontal, paddingBottom: 40 },
  waitingTitle: { fontSize: 22, fontWeight: "700", color: maakTokens.foreground, textAlign: "center" },
  waitingBody: { fontSize: 15, color: maakTokens.mutedForeground, textAlign: "center", marginTop: 10, lineHeight: 22 },
  timerHint: { fontSize: 12, color: maakTokens.mutedForeground, marginTop: 8 },
  errorPad: { paddingHorizontal: maakTokens.screenPaddingHorizontal, paddingBottom: 40 },
  errorTitle: { fontSize: 20, fontWeight: "700", color: maakTokens.foreground, marginBottom: 8 },
  errorBody: { fontSize: 15, color: maakTokens.mutedForeground, lineHeight: 22, marginBottom: 12 },
  errorSteps: { fontSize: 14, fontWeight: "600", color: maakTokens.foreground, marginTop: 8 },
  errorLi: { fontSize: 14, color: maakTokens.mutedForeground, marginTop: 6, lineHeight: 20 },
  errorDetail: {
    fontSize: 12,
    fontFamily: "monospace",
    color: maakTokens.destructive,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
    marginTop: 12,
  },
  primaryBtnText: { color: maakTokens.primaryForeground, fontWeight: "600", fontSize: 16 },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    alignItems: "center",
  },
  secondaryBtnText: { color: maakTokens.primary, fontWeight: "600" },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  celebrationCard: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    padding: 24,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
    marginBottom: 12,
  },
  celebrationBody: {
    fontSize: 15,
    lineHeight: 22,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 20,
  },
  celebrationBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  celebrationBtnTxt: {
    color: maakTokens.primaryForeground,
    fontWeight: "700",
    fontSize: 16,
  },
});
