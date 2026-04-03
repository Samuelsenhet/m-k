import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type MutualMatchOption = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (groupId: string) => void;
  createGroup: (name: string, memberUserIds: string[]) => Promise<string | null>;
};

export function CreateGroupModal({ visible, onClose, onCreated, createGroup }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;

  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<MutualMatchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchMutualMatches = useCallback(async () => {
    if (!user || !visible) return;
    setLoading(true);
    try {
      const { data: matchesData } = await supabase
        .from("matches")
        .select("user_id, matched_user_id")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq("status", "mutual");
      if (!matchesData?.length) {
        setOptions([]);
        return;
      }
      const userIds = matchesData.map((m) =>
        m.user_id === user.id ? m.matched_user_id : m.user_id,
      );
      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`${profileKey}, display_name, avatar_url`)
        .in(profileKey, userIds);

      const list: MutualMatchOption[] = (profilesData ?? []).map((p: Record<string, unknown>) => ({
        user_id: (p[profileKey] ?? p.id ?? p.user_id) as string,
        display_name: (p.display_name as string) ?? t("groupChat.unknownUser"),
        avatar_url: (p.avatar_url as string | null) ?? null,
      }));
      setOptions(list);
    } finally {
      setLoading(false);
    }
  }, [user, visible, supabase, t]);

  useEffect(() => {
    if (visible) {
      setName("");
      setSelectedIds(new Set());
      void fetchMutualMatches();
    }
  }, [visible, fetchMutualMatches]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (selectedIds.size < 2 || !name.trim()) return;
    setCreating(true);
    try {
      const id = await createGroup(name.trim(), Array.from(selectedIds));
      if (id) {
        onCreated(id);
        onClose();
      }
    } finally {
      setCreating(false);
    }
  };

  const canCreate = selectedIds.size >= 2 && name.trim().length > 0 && !creating;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.title}>{t("groupChat.create")}</Text>
          <Text style={styles.label}>{t("groupChat.groupName")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("groupChat.groupNamePlaceholder")}
            placeholderTextColor={maakTokens.mutedForeground}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.hintSmall}>{t("groupChat.selectMatches")}</Text>
          <Text style={styles.hint}>{t("groupChat.selectMatchesHint")}</Text>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color={maakTokens.primary} />
          ) : options.length === 0 ? (
            <Text style={styles.empty}>{t("groupChat.needMoreMatches")}</Text>
          ) : (
            <ScrollView style={styles.optScroll} nestedScrollEnabled>
              {options.map((opt) => {
                const selected = selectedIds.has(opt.user_id);
                return (
                  <Pressable
                    key={opt.user_id}
                    style={[styles.optRow, selected && styles.optRowOn]}
                    onPress={() => toggle(opt.user_id)}
                  >
                    <Text style={styles.optName}>{opt.display_name}</Text>
                    <View style={[styles.check, selected && styles.checkOn]}>
                      {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Pressable
            style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
            onPress={() => void handleCreate()}
            disabled={!canCreate}
          >
            {creating ? (
              <ActivityIndicator color={maakTokens.primaryForeground} />
            ) : (
              <Text style={styles.createBtnText}>{t("groupChat.create")}</Text>
            )}
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelTxt}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    paddingHorizontal: 0,
  },
  sheet: {
    backgroundColor: maakTokens.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "92%",
  },
  title: { fontSize: 20, fontWeight: "700", color: maakTokens.foreground, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: maakTokens.foreground, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusLg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: maakTokens.foreground,
    marginBottom: 12,
  },
  hintSmall: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  hint: { fontSize: 12, color: maakTokens.mutedForeground, marginBottom: 8 },
  empty: { textAlign: "center", color: maakTokens.mutedForeground, padding: 16 },
  optScroll: { maxHeight: 220, marginBottom: 12 },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: maakTokens.radiusLg,
    backgroundColor: maakTokens.muted,
    marginBottom: 8,
  },
  optRowOn: {
    borderWidth: 2,
    borderColor: maakTokens.primary,
    backgroundColor: `${maakTokens.primary}12`,
  },
  optName: { fontSize: 16, fontWeight: "600", flex: 1 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: maakTokens.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: maakTokens.primary, borderColor: maakTokens.primary },
  checkMark: { color: maakTokens.primaryForeground, fontWeight: "900" },
  createBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
    marginTop: 8,
  },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { color: maakTokens.primaryForeground, fontWeight: "700", fontSize: 16 },
  cancelBtn: { paddingVertical: 14, alignItems: "center" },
  cancelTxt: { color: maakTokens.primary, fontWeight: "600" },
});
