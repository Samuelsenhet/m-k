import { useSupabase } from "@/contexts/SupabaseProvider";
import { useHostProfile } from "@/hooks/useHostProfile";
import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Introduction picker - active Värdar pick a second match to introduce
 * together with user_a (passed as route param from IntroduceButton).
 *
 * Flow:
 *   1. Load the Värd's own matches, excluding user_a, excluding anyone
 *      they have already introduced to user_a (local-only - the edge
 *      function has its own dedup).
 *   2. Display avatars + names. Tap one → highlight as user_b.
 *   3. Optional message field (max 300 chars).
 *   4. Submit → call introduction-create edge function.
 *   5. On success, pop back to the previous screen.
 *
 * The screen is host-gated. If a non-host somehow lands here (deep link,
 * race condition), we show a PaywallGate-style reject.
 */

type MatchRow = {
  match_id: string;
  user_id: string;
  display_name: string | null;
  archetype: string | null;
  avatar_url: string | null;
};

const MAX_MESSAGE_LEN = 300;

export default function IntroducePickerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const host = useHostProfile();

  const params = useLocalSearchParams<{ user_a_id?: string; user_a_name?: string }>();
  const userAId = typeof params.user_a_id === "string" ? params.user_a_id : "";
  const userAName = typeof params.user_a_name === "string" ? params.user_a_name : "";

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBId, setSelectedBId] = useState<string | null>(null);
  const [selectedBName, setSelectedBName] = useState<string>("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadMatches = useCallback(async () => {
    const hostId = session?.user?.id;
    if (!hostId) {
      setLoading(false);
      return;
    }
    try {
      // Pull the host's current matches (any direction). Join profile basics.
      const { data: rawRows, error: rawError } = await supabase
        .from("matches")
        .select(
          "id, user_id, matched_user_id, status",
        )
        .or(`user_id.eq.${hostId},matched_user_id.eq.${hostId}`)
        .in("status", ["pending", "liked", "mutual"]);
      if (rawError) throw rawError;

      // For each row, determine the peer id (not the host).
      const peerIds = new Set<string>();
      const peerByMatchId = new Map<string, { match_id: string; peer_id: string }>();
      for (const row of (rawRows ?? []) as { id: string; user_id: string; matched_user_id: string }[]) {
        const peer = row.user_id === hostId ? row.matched_user_id : row.user_id;
        if (peer === userAId) continue; // don't show user_a as an option
        if (!peerIds.has(peer)) {
          peerIds.add(peer);
          peerByMatchId.set(peer, { match_id: row.id, peer_id: peer });
        }
      }

      if (peerIds.size === 0) {
        setMatches([]);
        return;
      }

      // Join profile details for display.
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, archetype, avatar_url")
        .in("id", Array.from(peerIds));
      if (profileError) throw profileError;

      const rows: MatchRow[] = (profiles ?? [])
        .map((p) => {
          const typed = p as {
            id: string;
            display_name: string | null;
            archetype: string | null;
            avatar_url: string | null;
          };
          const pair = peerByMatchId.get(typed.id);
          return pair
            ? {
                match_id: pair.match_id,
                user_id: typed.id,
                display_name: typed.display_name,
                archetype: typed.archetype,
                avatar_url: typed.avatar_url,
              }
            : null;
        })
        .filter((r): r is MatchRow => r !== null)
        .sort((a, b) =>
          (a.display_name ?? "").localeCompare(b.display_name ?? "", "sv"),
        );
      setMatches(rows);
    } catch (err) {
      if (__DEV__) console.error("[introduce] load matches error:", err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, session?.user?.id, userAId]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const submit = useCallback(async () => {
    if (!selectedBId || submitting) return;
    setSubmitting(true);
    try {
      const sess = (await supabase.auth.getSession()).data.session;
      if (!sess?.access_token) {
        Alert.alert(
          t("common.error", { defaultValue: "Fel" }),
          t("host.introduce.error_not_logged_in", {
            defaultValue: "Du behöver vara inloggad.",
          }),
        );
        return;
      }
      const { data, error: fnError } = await supabase.functions.invoke(
        "introduction-create",
        {
          body: {
            user_a_id: userAId,
            user_b_id: selectedBId,
            message: message.trim() || undefined,
          },
          headers: { Authorization: `Bearer ${sess.access_token}` },
        },
      );
      if (fnError) throw fnError;
      if (data && typeof data === "object" && "error" in data) {
        throw new Error(String((data as { error: string }).error));
      }
      Alert.alert(
        t("host.introduce.success_title", { defaultValue: "Introduktion skickad" }),
        t("host.introduce.success_body", {
          defaultValue: "Båda får en notis. Du hör av dig när de svarat.",
        }),
        [{ text: t("common.done", { defaultValue: "Klar" }), onPress: () => router.back() }],
      );
    } catch (err) {
      if (__DEV__) console.error("[introduce] submit error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert(
        t("common.error", { defaultValue: "Fel" }),
        msg.includes("not an active") ||
          msg.includes("not a current match") ||
          msg.includes("already completed")
          ? msg
          : t("host.introduce.error_generic", {
              defaultValue: "Kunde inte skicka introduktionen. Försök igen.",
            }),
      );
    } finally {
      setSubmitting(false);
    }
  }, [selectedBId, submitting, supabase, userAId, message, t, router]);

  // Host gate
  if (!host.loading && !host.isActive) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={26} color={maakTokens.foreground} />
          </Pressable>
          <Text style={styles.topTitle}>{t("host.introduce.title", { defaultValue: "Introducera" })}</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.rejectWrap}>
          <Ionicons name="lock-closed" size={40} color={maakTokens.mutedForeground} />
          <Text style={styles.rejectText}>
            {t("host.introduce.host_gate", {
              defaultValue:
                "Endast aktiva Värdar kan göra introduktioner. Bli Värd genom att skapa aktiva Samlingar eller hålla en Träff.",
            })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={maakTokens.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>
          {t("host.introduce.title", { defaultValue: "Introducera" })}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: maakTokens.screenPaddingHorizontal,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heroTitle}>
            {t("host.introduce.hero_title", {
              defaultValue: "Vem ska du koppla ihop {{name}} med?",
              name: userAName || t("host.introduce.this_person", { defaultValue: "den här personen" }),
            })}
          </Text>
          <Text style={styles.heroBody}>
            {t("host.introduce.hero_body", {
              defaultValue:
                "Välj en annan av dina matchningar som du tror skulle passa. Båda får en notis och kan svara ja eller nej.",
            })}
          </Text>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={maakTokens.primary} />
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {t("host.introduce.empty_title", {
                  defaultValue: "Inga andra matchningar",
                })}
              </Text>
              <Text style={styles.emptyBody}>
                {t("host.introduce.empty_body", {
                  defaultValue:
                    "Du behöver minst två matchningar för att göra en introduktion.",
                })}
              </Text>
            </View>
          ) : (
            <View style={styles.matchList}>
              {matches.map((m) => {
                const selected = m.user_id === selectedBId;
                return (
                  <Pressable
                    key={m.user_id}
                    onPress={() => {
                      setSelectedBId(m.user_id);
                      setSelectedBName(m.display_name ?? "");
                    }}
                    style={[styles.matchRow, selected && styles.matchRowSelected]}
                  >
                    <View style={styles.matchAvatarPlaceholder}>
                      <Text style={styles.matchAvatarInitial}>
                        {(m.display_name ?? "?").slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.matchName}>
                        {m.display_name ?? t("common.user", { defaultValue: "Användare" })}
                      </Text>
                      {m.archetype && (
                        <Text style={styles.matchArchetype}>{m.archetype}</Text>
                      )}
                    </View>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={maakTokens.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {selectedBId && (
            <View style={styles.messageWrap}>
              <Text style={styles.messageLabel}>
                {t("host.introduce.message_label", {
                  defaultValue: "Meddelande (valfritt)",
                })}
              </Text>
              <TextInput
                style={styles.messageInput}
                placeholder={t("host.introduce.message_placeholder", {
                  defaultValue:
                    "Hej, jag tror ni skulle gilla varandra för att...",
                })}
                placeholderTextColor={maakTokens.mutedForeground}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={MAX_MESSAGE_LEN}
                accessibilityLabel={t("host.introduce.message_label", {
                  defaultValue: "Meddelande",
                })}
              />
              <Text style={styles.messageCount}>
                {message.length} / {MAX_MESSAGE_LEN}
              </Text>
            </View>
          )}
        </ScrollView>

        {selectedBId && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              onPress={submit}
              disabled={submitting}
              style={[styles.submitButton, submitting && styles.submitButtonBusy]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitLabel}>
                  {t("host.introduce.submit", {
                    defaultValue: "Skicka introduktion till {{name}}",
                    name: selectedBName || t("common.user", { defaultValue: "Användare" }),
                  })}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
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
  heroTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    color: maakTokens.foreground,
    letterSpacing: -0.3,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
  },
  loadingWrap: { padding: 40, alignItems: "center" },
  emptyCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.08)",
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: maakTokens.foreground },
  emptyBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: maakTokens.mutedForeground,
  },
  matchList: { marginTop: 20, gap: 8 },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "rgba(37, 61, 44, 0.06)",
  },
  matchRowSelected: {
    borderColor: maakTokens.primary,
    backgroundColor: "#D9EDE4",
  },
  matchAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D9EDE4",
    justifyContent: "center",
    alignItems: "center",
  },
  matchAvatarInitial: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.primary,
  },
  matchName: { fontSize: 15, fontWeight: "600", color: maakTokens.foreground },
  matchArchetype: {
    marginTop: 2,
    fontSize: 12,
    color: maakTokens.mutedForeground,
  },
  messageWrap: { marginTop: 24 },
  messageLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: maakTokens.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  messageInput: {
    minHeight: 100,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.08)",
    fontSize: 15,
    color: maakTokens.foreground,
    textAlignVertical: "top",
  },
  messageCount: {
    marginTop: 6,
    fontSize: 11,
    color: maakTokens.mutedForeground,
    textAlign: "right",
  },
  footer: {
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(37, 61, 44, 0.08)",
    backgroundColor: maakTokens.background,
  },
  submitButton: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonBusy: { opacity: 0.7 },
  submitLabel: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  rejectWrap: { padding: 40, alignItems: "center", gap: 16 },
  rejectText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
  },
});
