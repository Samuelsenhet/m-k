import { useSupabase } from "@/contexts/SupabaseProvider";
import type { SamlingGroup } from "@/hooks/useGroups";
import { maakTokens } from "@maak/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type GroupMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
};

type Props = {
  group: SamlingGroup;
  currentUserId: string;
  onBack: () => void;
  leaveGroup: (groupId: string) => Promise<boolean>;
};

export function GroupChatRoom({ group, currentUserId, onBack, leaveGroup }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { supabase } = useSupabase();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const listRef = useRef<FlatList<GroupMessage>>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("group_messages")
      .select("id, group_id, sender_id, content, message_type, created_at")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true });
    setMessages((data as GroupMessage[]) ?? []);
    setLoading(false);
  }, [group.id, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`group:${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          const row = payload.new as GroupMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [group.id, supabase]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    await supabase.from("group_messages").insert({
      group_id: group.id,
      sender_id: currentUserId,
      content: text,
      message_type: "text",
    });
    setSending(false);
  };

  const handleLeave = async () => {
    setLeaving(true);
    const ok = await leaveGroup(group.id);
    setLeaving(false);
    setLeaveOpen(false);
    if (ok) onBack();
  };

  const senderName = (senderId: string) =>
    group.members.find((m) => m.user_id === senderId)?.display_name ?? t("groupChat.unknownUser");

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={styles.headerSub}>
            {t("groupChat.memberCount", { count: group.members.length })}
          </Text>
        </View>
        <Pressable onPress={() => setLeaveOpen(true)} style={styles.leaveBtn}>
          <Text style={styles.leaveTxt}>⋯</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={maakTokens.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.list}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const own = item.sender_id === currentUserId;
            return (
              <View style={[styles.row, own ? styles.rowOwn : styles.rowTheirs]}>
                {!own ? (
                  <Text style={styles.sender} numberOfLines={1}>
                    {senderName(item.sender_id)}
                  </Text>
                ) : null}
                <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, own && styles.bubbleTextOwn]}>{item.content}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>{t("groupChat.noMessagesYet")}</Text>
          }
        />
      )}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t("chat.typeMessage")}
          placeholderTextColor={maakTokens.mutedForeground}
          multiline
          maxLength={4000}
        />
        <Pressable
          style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendDisabled]}
          onPress={() => void send()}
          disabled={!draft.trim() || sending}
        >
          <Text style={styles.sendTxt}>{t("chat.send")}</Text>
        </Pressable>
      </View>

      <Modal visible={leaveOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t("groupChat.leaveTitle")}</Text>
            <Text style={styles.modalBody}>{t("groupChat.leaveDescription")}</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setLeaveOpen(false)}>
                <Text style={styles.modalCancelTxt}>{t("groupChat.stayInSamling")}</Text>
              </Pressable>
              <Pressable
                style={styles.modalDanger}
                onPress={() => void handleLeave()}
                disabled={leaving}
              >
                {leaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalDangerTxt}>{t("groupChat.leaveSamling")}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: maakTokens.primary,
  },
  backBtn: { padding: 8 },
  backTxt: { fontSize: 22, color: maakTokens.primaryForeground, fontWeight: "700" },
  headerMid: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: maakTokens.primaryForeground },
  headerSub: { fontSize: 12, color: `${maakTokens.primaryForeground}cc`, marginTop: 2 },
  leaveBtn: { padding: 8 },
  leaveTxt: { fontSize: 20, color: maakTokens.primaryForeground, fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { flex: 1 },
  listContent: { padding: 12 },
  row: { marginBottom: 10, maxWidth: "100%" },
  rowOwn: { alignItems: "flex-end" },
  rowTheirs: { alignItems: "flex-start" },
  sender: {
    fontSize: 11,
    color: maakTokens.mutedForeground,
    marginBottom: 4,
    maxWidth: "70%",
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleOwn: { backgroundColor: maakTokens.primary, alignSelf: "flex-end" },
  bubbleTheirs: { backgroundColor: maakTokens.muted, alignSelf: "flex-start" },
  bubbleText: { fontSize: 16, color: maakTokens.foreground },
  bubbleTextOwn: { color: maakTokens.primaryForeground },
  empty: { textAlign: "center", color: maakTokens.mutedForeground, marginTop: 24 },
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
    maxHeight: 100,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: maakTokens.radiusLg,
  },
  sendDisabled: { opacity: 0.5 },
  sendTxt: { color: maakTokens.primaryForeground, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: maakTokens.foreground },
  modalBody: { fontSize: 15, color: maakTokens.mutedForeground, marginTop: 10, lineHeight: 22 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20, justifyContent: "flex-end" },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 14 },
  modalCancelTxt: { color: maakTokens.primary, fontWeight: "600" },
  modalDanger: {
    backgroundColor: maakTokens.destructive,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: maakTokens.radiusMd,
    minWidth: 120,
    alignItems: "center",
  },
  modalDangerTxt: { color: "#fff", fontWeight: "700" },
});
