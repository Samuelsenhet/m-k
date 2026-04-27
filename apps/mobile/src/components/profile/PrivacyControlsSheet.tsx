import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenSharedData: () => void;
};

export function PrivacyControlsSheet({
  visible,
  onClose,
  onOpenPrivacyPolicy,
  onOpenSharedData,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;

  const [isVisibleProfile, setIsVisibleProfile] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const loadVisibility = useCallback(async () => {
    if (!user) return;
    try {
      const key = await resolveProfilesAuthKey(supabase, user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("is_visible")
        .eq(key, user.id)
        .maybeSingle();
      if (error) throw error;
      setIsVisibleProfile(data?.is_visible ?? true);
    } catch (e) {
      if (__DEV__) console.warn("[PrivacyControlsSheet loadVisibility]", e);
      setIsVisibleProfile(true);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!visible) return;
    void loadVisibility();
  }, [visible, loadVisibility]);

  const handleToggleVisible = async (next: boolean) => {
    if (!user || saving) return;
    const previous = isVisibleProfile;
    setIsVisibleProfile(next);
    setSaving(true);
    try {
      const key = await resolveProfilesAuthKey(supabase, user.id);
      // .select().single() turns a silent no-op (wrong auth key or RLS deny
      // returning 0 rows) into a loud error so the user sees a retry prompt
      // instead of a toggle that pops back on next reload.
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_visible: next })
        .eq(key, user.id)
        .select("is_visible")
        .single();
      if (error) throw error;
      if (!data || data.is_visible !== next) {
        throw new Error(
          `profiles.is_visible write no-op — resolved key='${key}', userId='${user.id}' matched 0 rows`,
        );
      }
      setIsVisibleProfile(data.is_visible);
    } catch (e) {
      if (__DEV__) console.warn("[PrivacyControlsSheet toggle]", e);
      setIsVisibleProfile(previous);
      Alert.alert(t("common.error"), t("profile.error_saving"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.headerRow}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>{t("settings.privacy_controls_title")}</Text>
            <Pressable
              onPress={onClose}
              style={{ width: 40, alignItems: "flex-end" }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <Ionicons name="close" size={26} color={maakTokens.foreground} />
            </Pressable>
          </View>
          <Text style={styles.body}>{t("settings.privacy_description")}</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.rowLabel}>{t("settings.profile_visibility")}</Text>
              <Text style={styles.rowHint}>{t("settings.profile_visibility_hint")}</Text>
            </View>
            {isVisibleProfile === null ? (
              <ActivityIndicator color={maakTokens.primary} />
            ) : (
              <Switch
                value={isVisibleProfile}
                disabled={saving}
                onValueChange={(v) => void handleToggleVisible(v)}
                trackColor={{ false: maakTokens.border, true: `${maakTokens.primary}99` }}
                thumbColor={isVisibleProfile ? maakTokens.primary : maakTokens.mutedForeground}
                accessibilityLabel={t("settings.profile_visibility")}
              />
            )}
          </View>

          <Pressable
            style={styles.linkRow}
            onPress={() => {
              onClose();
              onOpenSharedData();
            }}
            accessibilityRole="button"
            accessibilityLabel={t("settings.shared_data")}
          >
            <Text style={styles.rowLabel}>{t("settings.shared_data")}</Text>
            <Ionicons name="chevron-forward" size={20} color={maakTokens.mutedForeground} />
          </Pressable>
          <Pressable
            style={styles.policyLink}
            onPress={() => {
              onClose();
              onOpenPrivacyPolicy();
            }}
            accessibilityRole="button"
            accessibilityLabel={t("settings.privacy_policy")}
          >
            <Text style={styles.policyLinkTxt}>{t("settings.privacy_policy")}</Text>
            <Ionicons name="chevron-forward" size={20} color={maakTokens.primary} />
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
  },
  sheet: {
    backgroundColor: maakTokens.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
    gap: 16,
  },
  toggleText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 15, color: maakTokens.foreground },
  rowHint: {
    fontSize: 12,
    color: maakTokens.mutedForeground,
    marginTop: 2,
    lineHeight: 16,
  },
  comingSoon: { fontSize: 13, color: maakTokens.mutedForeground, fontStyle: "italic" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  policyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginTop: 8,
  },
  policyLinkTxt: { fontSize: 15, fontWeight: "600", color: maakTokens.primary },
});
