import { ChatEmptyStateWithMascot } from "@/components/chat/ChatEmptyStateWithMascot";
import { ChatThread } from "@/components/chat/ChatThread";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { useGroups } from "@/hooks/useGroups";
import { useMutualChatMatches } from "@/hooks/useMutualChatMatches";
import { useSubscription } from "@/hooks/useSubscription";
import { appLocaleTag } from "@/lib/appLocale";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SelectedMatch = {
  id: string;
  matched_user_id: string;
  matched_profile: {
    display_name: string;
    avatar_url: string | null;
  };
};

type ChatTab = "chatt" | "samling";

export default function ChatScreen() {
  const { t, i18n } = useTranslation();
  const timeLocale = appLocaleTag(i18n.language);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session, isReady } = useSupabase();
  const user = session?.user;
  const { match: matchParam } = useLocalSearchParams<{ match?: string }>();

  const [selected, setSelected] = useState<SelectedMatch | null>(null);
  const [chatTab, setChatTab] = useState<ChatTab>("chatt");
  const [createOpen, setCreateOpen] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { canCreateGroups } = useSubscription();
  const { matches, loading, error, refresh } = useMutualChatMatches();
  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
    refreshGroups,
    createGroup,
  } = useGroups();

  const loadMatchFromParam = useCallback(
    async (matchId: string) => {
      if (!user) return;
      setLoadingMatch(true);
      try {
        const { data: row, error: qErr } = await supabase
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .maybeSingle();

        if (qErr || !row) {
          if (__DEV__) console.warn("[chat] match not found", qErr);
          router.replace("/(tabs)/chat");
          return;
        }

        const matchedUserId =
          row.user_id === user.id ? row.matched_user_id : row.user_id;

        const profileKey = await resolveProfilesAuthKey(supabase, matchedUserId);
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq(profileKey, matchedUserId)
          .maybeSingle();

        setSelected({
          id: matchId,
          matched_user_id: matchedUserId,
          matched_profile: {
            display_name: profile?.display_name ?? t("common.user"),
            avatar_url: profile?.avatar_url ?? null,
          },
        });
      } finally {
        setLoadingMatch(false);
      }
    },
    [supabase, user, router, t],
  );

  useEffect(() => {
    if (!isReady || !user) return;
    const id = typeof matchParam === "string" ? matchParam : matchParam?.[0];
    if (id && !selected) {
      void loadMatchFromParam(id);
    }
  }, [isReady, user, matchParam, selected, loadMatchFromParam]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) router.replace("/phone-auth");
  }, [isReady, user, router]);

  const clearMatchParam = useCallback(() => {
    setSelected(null);
    router.replace("/(tabs)/chat");
  }, [router]);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), refreshGroups()]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, refreshGroups]);

  const openThread = useCallback((m: (typeof matches)[0]) => {
    setSelected({
      id: m.id,
      matched_user_id: m.matched_user_id,
      matched_profile: m.matched_profile,
    });
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) =>
      (m.matched_profile.display_name ?? "").toLowerCase().includes(q),
    );
  }, [matches, searchQuery]);

  if (!isReady || (!user && isReady)) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
      </View>
    );
  }

  if (loadingMatch && matchParam) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
        <Text style={styles.muted}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (selected) {
    return (
      <ChatThread
        matchId={selected.id}
        matchedUserId={selected.matched_user_id}
        matchedUserName={selected.matched_profile.display_name}
        matchedUserAvatarUrl={selected.matched_profile.avatar_url}
        onBack={clearMatchParam}
        onOpenProfile={() =>
          router.push(`/view-match?match=${encodeURIComponent(selected.id)}`)
        }
      />
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.screenTitle}>{t("chat.chats")}</Text>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, chatTab === "chatt" && styles.tabOn]}
          onPress={() => setChatTab("chatt")}
        >
          <Text style={[styles.tabText, chatTab === "chatt" && styles.tabTextOn]}>
            {t("nav.chat")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, chatTab === "samling" && styles.tabOn]}
          onPress={() => setChatTab("samling")}
        >
          <Text style={[styles.tabText, chatTab === "samling" && styles.tabTextOn]}>
            {t("groupChat.title")}
          </Text>
        </Pressable>
      </View>

      {chatTab === "chatt" ? (
        <>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("chat.search")}
            placeholderTextColor={maakTokens.mutedForeground}
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {loading ? (
            <View style={styles.padded}>
              <ActivityIndicator color={maakTokens.primary} />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : matches.length === 0 ? (
            <ScrollView
              style={styles.listFlex}
              contentContainerStyle={[
                styles.emptyScrollContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} />
              }
            >
              <ChatEmptyStateWithMascot
                title={t("matches.noMatches")}
                description={t("chat.emptyChatsEncouragement")}
              />
            </ScrollView>
          ) : filtered.length === 0 ? (
            <View style={styles.searchEmpty}>
              <Text style={styles.searchEmptyText}>{t("chat.noSearchResults")}</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              style={styles.listFlex}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} />
              }
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              renderItem={({ item }) => {
                const preview = item.last_message?.content ?? t("chat.chooseIcebreaker");
                const time = item.last_message?.created_at
                  ? new Date(item.last_message.created_at).toLocaleTimeString(timeLocale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                const unread = item.unread_count > 0;
                return (
                  <Pressable
                    style={[styles.row, unread && styles.rowUnread]}
                    onPress={() => openThread(item)}
                  >
                    <View style={styles.avatarPh}>
                      <Text style={styles.avatarTxt}>
                        {item.matched_profile.display_name.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.rowBody}>
                      <View style={styles.rowTop}>
                        <Text style={styles.name} numberOfLines={1}>
                          {item.matched_profile.display_name}
                        </Text>
                        {time ? <Text style={styles.time}>{time}</Text> : null}
                      </View>
                      <Text style={styles.preview} numberOfLines={2}>
                        {preview}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.samlingHeader}>
            <Text style={styles.samlingHint} numberOfLines={2}>
              {t("groupChat.emptyHeading")}
            </Text>
            <Pressable
              style={styles.addBtn}
              onPress={() => {
                if (canCreateGroups) {
                  setCreateOpen(true);
                } else {
                  router.push({ pathname: "/paywall" });
                }
              }}
            >
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
          {groupsLoading ? (
            <View style={styles.padded}>
              <ActivityIndicator color={maakTokens.primary} />
            </View>
          ) : groupsError ? (
            <Text style={styles.error}>{groupsError}</Text>
          ) : groups.length === 0 ? (
            <Text style={styles.empty}>{t("groupChat.noGroups")}</Text>
          ) : (
            <FlatList
              data={groups}
              style={styles.listFlex}
              keyExtractor={(g) => g.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} />
              }
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => router.push(`/group-chat/${item.id}`)}
                >
                  <View style={styles.avatarPh}>
                    <Text style={styles.avatarTxt}>{item.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.preview} numberOfLines={1}>
                      {item.members.map((m) => m.display_name ?? "?").join(", ")}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}

      <CreateGroupModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(`/group-chat/${id}`);
        }}
        createGroup={createGroup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: maakTokens.background,
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
  },
  listFlex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: maakTokens.background,
  },
  muted: { marginTop: 8, color: maakTokens.mutedForeground },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: maakTokens.muted,
    alignItems: "center",
  },
  tabOn: { backgroundColor: `${maakTokens.primary}22` },
  tabText: { fontSize: 14, fontWeight: "600", color: maakTokens.mutedForeground },
  tabTextOn: { color: maakTokens.primary },
  samlingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  samlingHint: { flex: 1, fontSize: 13, color: maakTokens.mutedForeground, lineHeight: 18 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: maakTokens.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 26, color: maakTokens.primaryForeground, fontWeight: "700", marginTop: -2 },
  search: {
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusLg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: maakTokens.foreground,
    marginBottom: 12,
  },
  padded: { padding: 24 },
  error: { color: maakTokens.destructive },
  empty: {
    paddingVertical: 24,
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 320,
  },
  searchEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
    minHeight: 120,
  },
  searchEmptyText: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: maakTokens.border,
  },
  rowUnread: { backgroundColor: `${maakTokens.primary}0d` },
  avatarPh: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: maakTokens.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 16, fontWeight: "700", color: maakTokens.primary },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 16, fontWeight: "700", color: maakTokens.foreground, flex: 1 },
  time: { fontSize: 12, color: maakTokens.mutedForeground },
  preview: { fontSize: 14, color: maakTokens.mutedForeground, marginTop: 4 },
});
