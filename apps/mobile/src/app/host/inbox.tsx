import { useSupabase } from "@/contexts/SupabaseProvider";
import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Introduction inbox — pending introductions the current user needs to
 * respond to. Shows:
 *   • Who's been introduced (the other user, host's display name)
 *   • The host's optional message
 *   • Accept / Decline buttons that call the introduction-respond edge
 *     function
 *
 * Resolved introductions (match_created=true) are hidden. Declines are
 * also hidden after the fact — we only show rows where the caller's own
 * accepted_by_* flag is still null.
 */

type InboxRow = {
  introduction_id: string;
  host_user_id: string;
  host_display_name: string | null;
  other_user_id: string;
  other_display_name: string | null;
  other_archetype: string | null;
  message: string | null;
  created_at: string;
};

export default function IntroductionInboxScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();

  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      // Pending introductions where the user is a participant and hasn't
      // responded yet. Fetched as two queries (user_a_id = me) and
      // (user_b_id = me) for clarity.
      const { data: asA } = await supabase
        .from("introductions")
        .select(
          "id, host_user_id, user_a_id, user_b_id, message, accepted_by_a, accepted_by_b, match_created, created_at",
        )
        .eq("user_a_id", userId)
        .is("accepted_by_a", null)
        .eq("match_created", false);
      const { data: asB } = await supabase
        .from("introductions")
        .select(
          "id, host_user_id, user_a_id, user_b_id, message, accepted_by_a, accepted_by_b, match_created, created_at",
        )
        .eq("user_b_id", userId)
        .is("accepted_by_b", null)
        .eq("match_created", false);

      const combined = [
        ...((asA ?? []).map((r) => {
          const row = r as {
            id: string;
            host_user_id: string;
            user_a_id: string;
            user_b_id: string;
            message: string | null;
            created_at: string;
          };
          return {
            introduction_id: row.id,
            host_user_id: row.host_user_id,
            other_user_id: row.user_b_id,
            message: row.message,
            created_at: row.created_at,
          };
        })),
        ...((asB ?? []).map((r) => {
          const row = r as {
            id: string;
            host_user_id: string;
            user_a_id: string;
            user_b_id: string;
            message: string | null;
            created_at: string;
          };
          return {
            introduction_id: row.id,
            host_user_id: row.host_user_id,
            other_user_id: row.user_a_id,
            message: row.message,
            created_at: row.created_at,
          };
        })),
      ];

      if (combined.length === 0) {
        setRows([]);
        return;
      }

      // Load profile display names + archetypes for the hosts and the
      // "other" users in one round-trip.
      const profileIds = Array.from(
        new Set([
          ...combined.map((c) => c.host_user_id),
          ...combined.map((c) => c.other_user_id),
        ]),
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, archetype")
        .in("id", profileIds);
      const profileMap = new Map<
        string,
        { display_name: string | null; archetype: string | null }
      >();
      for (const p of profiles ?? []) {
        const typed = p as {
          id: string;
          display_name: string | null;
          archetype: string | null;
        };
        profileMap.set(typed.id, {
          display_name: typed.display_name,
          archetype: typed.archetype,
        });
      }

      const enriched: InboxRow[] = combined
        .map((c) => ({
          introduction_id: c.introduction_id,
          host_user_id: c.host_user_id,
          host_display_name: profileMap.get(c.host_user_id)?.display_name ?? null,
          other_user_id: c.other_user_id,
          other_display_name: profileMap.get(c.other_user_id)?.display_name ?? null,
          other_archetype: profileMap.get(c.other_user_id)?.archetype ?? null,
          message: c.message,
          created_at: c.created_at,
        }))
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

      setRows(enriched);
    } catch (err) {
      if (__DEV__) console.error("[inbox] fetch error:", err);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, session?.user?.id]);

  useEffect(() => {
    void fetchInbox();
  }, [fetchInbox]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchInbox();
  }, [fetchInbox]);

  const respond = useCallback(
    async (introductionId: string, accept: boolean) => {
      setBusyId(introductionId);
      try {
        const sess = (await supabase.auth.getSession()).data.session;
        if (!sess?.access_token) return;
        const { data, error: fnError } = await supabase.functions.invoke(
          "introduction-respond",
          {
            body: { introduction_id: introductionId, accept },
            headers: { Authorization: `Bearer ${sess.access_token}` },
          },
        );
        if (fnError) throw fnError;
        if (data && typeof data === "object" && "error" in data) {
          throw new Error(String((data as { error: string }).error));
        }
        const matchCreated =
          data &&
          typeof data === "object" &&
          (data as { match_created?: boolean }).match_created === true;
        if (accept && matchCreated) {
          Alert.alert(
            t("host.inbox.matched_title", { defaultValue: "Ny matchning!" }),
            t("host.inbox.matched_body", {
              defaultValue: "Ni är nu matchade. Säg hej i chatten.",
            }),
          );
        } else if (accept) {
          Alert.alert(
            t("host.inbox.accepted_title", { defaultValue: "Accepterat" }),
            t("host.inbox.accepted_body", {
              defaultValue:
                "Vi väntar på att den andra personen svarar. Du får en notis.",
            }),
          );
        }
        await fetchInbox();
      } catch (err) {
        if (__DEV__) console.error("[inbox] respond error:", err);
        Alert.alert(
          t("common.error", { defaultValue: "Fel" }),
          t("host.inbox.error_generic", {
            defaultValue: "Kunde inte uppdatera. Försök igen.",
          }),
        );
      } finally {
        setBusyId(null);
      }
    },
    [supabase, fetchInbox, t],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons name="arrow-back" size={26} color={maakTokens.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>
          {t("host.inbox.title", { defaultValue: "Introduktioner" })}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
          paddingBottom: insets.bottom + 24,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hero}>
          {t("host.inbox.hero", {
            defaultValue:
              "Folk som Värdar tycker att du skulle gilla att prata med.",
          })}
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={maakTokens.primary} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="mail-unread-outline"
              size={40}
              color={maakTokens.mutedForeground}
            />
            <Text style={styles.emptyTitle}>
              {t("host.inbox.empty_title", {
                defaultValue: "Inga introduktioner just nu",
              })}
            </Text>
            <Text style={styles.emptyBody}>
              {t("host.inbox.empty_body", {
                defaultValue:
                  "När en Värd kopplar ihop dig med någon dyker det upp här.",
              })}
            </Text>
          </View>
        ) : (
          rows.map((r) => (
            <View key={r.introduction_id} style={styles.card}>
              <Text style={styles.cardHostLine}>
                {t("host.inbox.host_line", {
                  defaultValue: "{{host}} vill koppla ihop er",
                  host:
                    r.host_display_name ??
                    t("host.inbox.anonymous_host", { defaultValue: "En Värd" }),
                })}
              </Text>
              <View style={styles.otherRow}>
                <View style={styles.otherAvatar}>
                  <Text style={styles.otherAvatarInitial}>
                    {(r.other_display_name ?? "?").slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.otherName}>
                    {r.other_display_name ??
                      t("common.user", { defaultValue: "Användare" })}
                  </Text>
                  {r.other_archetype && (
                    <Text style={styles.otherArchetype}>{r.other_archetype}</Text>
                  )}
                </View>
              </View>
              {r.message && (
                <View style={styles.messageBubble}>
                  <Text style={styles.messageText}>{r.message}</Text>
                </View>
              )}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => respond(r.introduction_id, false)}
                  disabled={busyId === r.introduction_id}
                  style={[styles.actionButton, styles.actionDecline]}
                >
                  <Text style={styles.actionDeclineLabel}>
                    {t("host.inbox.decline", { defaultValue: "Avböj" })}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => respond(r.introduction_id, true)}
                  disabled={busyId === r.introduction_id}
                  style={[styles.actionButton, styles.actionAccept]}
                >
                  {busyId === r.introduction_id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionAcceptLabel}>
                      {t("host.inbox.accept", { defaultValue: "Acceptera" })}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: maakTokens.foreground },
  hero: {
    marginTop: 12,
    fontSize: 14,
    color: maakTokens.mutedForeground,
    lineHeight: 20,
  },
  loadingWrap: { padding: 40, alignItems: "center" },
  emptyCard: {
    marginTop: 24,
    padding: 28,
    borderRadius: 18,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.08)",
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: maakTokens.mutedForeground,
  },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.08)",
  },
  cardHostLine: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: maakTokens.primary,
  },
  otherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  otherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D9EDE4",
    justifyContent: "center",
    alignItems: "center",
  },
  otherAvatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.primary,
  },
  otherName: { fontSize: 17, fontWeight: "700", color: maakTokens.foreground },
  otherArchetype: {
    marginTop: 2,
    fontSize: 12,
    color: maakTokens.mutedForeground,
  },
  messageBubble: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F4F1",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.foreground,
    fontStyle: "italic",
  },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  actionAccept: { backgroundColor: maakTokens.primary },
  actionDecline: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.15)",
  },
  actionAcceptLabel: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  actionDeclineLabel: {
    color: maakTokens.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
});
