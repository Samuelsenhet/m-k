import { IcebreakerPanel } from "@/components/chat/IcebreakerPanel";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MessageRow = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
};

type Props = {
  matchId: string;
  matchedUserId: string;
  matchedUserName: string;
  matchedUserAvatarUrl?: string | null;
  onBack: () => void;
  onOpenProfile?: () => void;
};

export function ChatThread({
  matchId,
  matchedUserId,
  matchedUserName,
  matchedUserAvatarUrl,
  onBack,
  onOpenProfile,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const userId = session?.user?.id;
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<MessageRow>>(null);
  const [kemiDismissed, setKemiDismissed] = useState(false);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      if (__DEV__) console.error("[ChatThread] fetch messages", error);
    } else {
      setMessages((data as MessageRow[]) || []);
    }
    setLoading(false);
  }, [matchId, supabase]);

  const markRead = useCallback(
    async (rows: MessageRow[]) => {
      if (!userId) return;
      const unread = rows.filter((m) => m.sender_id !== userId && !m.is_read);
      if (unread.length === 0) return;
      await supabase
        .from("messages")
        .update({ is_read: true })
        .in(
          "id",
          unread.map((m) => m.id),
        );
      setMessages((prev) =>
        prev.map((m) => (unread.some((u) => u.id === m.id) ? { ...m, is_read: true } : m)),
      );
    },
    [supabase, userId],
  );

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!loading && messages.length > 0 && userId) void markRead(messages);
  }, [loading, messages, markRead, userId]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  const sendText = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!userId || !trimmed || sending) return false;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: userId,
      content: trimmed,
    });
    if (error) {
      if (__DEV__) console.error("[ChatThread] send", error);
      setSending(false);
      return false;
    }
    // Chat-first flow: first message activates the match and keeps it in chat.
    // Promote both sides of the pair from pending -> mutual.
    try {
      const { data: matchRow } = await supabase
        .from("matches")
        .select("user_id, matched_user_id, status")
        .eq("id", matchId)
        .maybeSingle();
      if (matchRow && matchRow.status === "pending") {
        await supabase.from("matches").update({ status: "mutual" }).eq("id", matchId);
        await supabase
          .from("matches")
          .update({ status: "mutual" })
          .eq("user_id", matchRow.matched_user_id)
          .eq("matched_user_id", matchRow.user_id)
          .eq("status", "pending");
      }
    } catch (promoteErr) {
      if (__DEV__) console.error("[ChatThread] promote pending->mutual", promoteErr);
    }
    setSending(false);
    return true;
  };

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const prev = draft;
    setDraft("");
    const ok = await sendText(text);
    if (!ok) setDraft(prev);
  };

  const avatarUri =
    matchedUserAvatarUrl && /^https?:\/\//i.test(matchedUserAvatarUrl)
      ? matchedUserAvatarUrl
      : matchedUserAvatarUrl
        ? supabase.storage.from("profile-photos").getPublicUrl(matchedUserAvatarUrl).data.publicUrl
        : null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.headerBtn}>
          <Text style={styles.headerBack}>←</Text>
        </Pressable>
        <Pressable
          style={styles.headerMid}
          onPress={onOpenProfile}
          disabled={!onOpenProfile}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPh}>
              <Text style={styles.headerAvatarTxt}>
                {matchedUserName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {matchedUserName}
          </Text>
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={maakTokens.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.listFlex}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPad}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === userId;
            return (
              <View
                style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
              >
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : undefined]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyNarrative}>
              <Text style={styles.emptyTitle}>{t("maak_narrative_variants.chat_empty_title")}</Text>
              <Text style={styles.emptySub}>{t("maak_narrative_variants.chat_empty_body")}</Text>
              <Text style={styles.emptyHint}>{t("chat.noMessages")}</Text>
            </View>
          }
        />
      )}

      {!loading && messages.length === 0 ? (
        <IcebreakerPanel
          matchId={matchId}
          matchedUserId={matchedUserId}
          onSelectSuggestion={setDraft}
        />
      ) : null}

      {/* Kemi-Check trigger: after 10+ messages */}
      {!kemiDismissed && messages.length >= 10 ? (
        <View style={styles.kemiCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kemiTitle}>{t("mobile.kemicheck.suggestion_title")}</Text>
            <Text style={styles.kemiSub}>{t("mobile.kemicheck.suggestion_body")}</Text>
          </View>
          <Pressable
            style={styles.kemiBtn}
            onPress={() => router.push({ pathname: "/kemi-check/[matchId]", params: { matchId } })}
          >
            <Ionicons name="videocam" size={18} color={maakTokens.primaryForeground} />
          </Pressable>
          <Pressable onPress={() => setKemiDismissed(true)} hitSlop={8}>
            <Ionicons name="close" size={18} color={maakTokens.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t("chat.typeMessage")}
          placeholderTextColor={maakTokens.mutedForeground}
          multiline
          maxLength={4000}
          editable={!sending}
        />
        <Pressable
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={() => void send()}
          disabled={sending || !draft.trim()}
        >
          {sending ? (
            <ActivityIndicator color={maakTokens.primaryForeground} size="small" />
          ) : (
            <Text style={styles.sendBtnText}>{t("chat.send")}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: maakTokens.border,
    backgroundColor: maakTokens.card,
  },
  headerBtn: { padding: 8 },
  headerBack: { fontSize: 22, color: maakTokens.primary, fontWeight: "700" },
  headerMid: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 10 },
  headerAvatarPh: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: maakTokens.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarTxt: { fontSize: 14, fontWeight: "700", color: maakTokens.primary },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: maakTokens.foreground },
  headerSpacer: { width: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listFlex: { flex: 1 },
  listPad: { paddingHorizontal: 12, paddingVertical: 12 },
  kemiCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${maakTokens.primary}14`,
    borderRadius: maakTokens.radiusLg,
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 10,
  },
  kemiTitle: { fontSize: 14, fontWeight: "700", color: maakTokens.foreground },
  kemiSub: { fontSize: 12, color: maakTokens.mutedForeground, marginTop: 1 },
  kemiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: maakTokens.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleRow: { marginBottom: 8, maxWidth: "100%" },
  bubbleRowMine: { alignSelf: "flex-end" },
  bubbleRowTheirs: { alignSelf: "flex-start" },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMine: { backgroundColor: maakTokens.primary },
  bubbleTheirs: { backgroundColor: maakTokens.muted },
  bubbleText: { fontSize: 16, lineHeight: 22, color: maakTokens.foreground },
  bubbleTextMine: { color: maakTokens.primaryForeground },
  empty: { textAlign: "center", color: maakTokens.mutedForeground, marginTop: 24 },
  emptyNarrative: { paddingVertical: 20, paddingHorizontal: 8 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 21,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyHint: { fontSize: 13, color: maakTokens.mutedForeground, textAlign: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: maakTokens.border,
    backgroundColor: maakTokens.card,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusLg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: maakTokens.foreground,
  },
  sendBtn: {
    backgroundColor: maakTokens.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: maakTokens.radiusLg,
    minWidth: 72,
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: maakTokens.primaryForeground, fontWeight: "700" },
});
