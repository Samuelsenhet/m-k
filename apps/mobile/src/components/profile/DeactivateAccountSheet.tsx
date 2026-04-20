import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type VisibilityChoice = "hidden" | "visible";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DeactivateAccountSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const user = session?.user;

  const [choice, setChoice] = useState<VisibilityChoice>("hidden");
  const [submitting, setSubmitting] = useState(false);

  const runDeactivate = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      const key = await resolveProfilesAuthKey(supabase, user.id);
      const { data, error } = await supabase
        .from("profiles")
        .update({
          deactivated_at: new Date().toISOString(),
          deactivation_hidden: choice === "hidden",
        })
        .eq(key, user.id)
        .select("deactivated_at, deactivation_hidden")
        .single();
      if (error) throw error;
      if (!data?.deactivated_at) {
        throw new Error(
          `profiles.deactivated_at write no-op — resolved key='${key}', userId='${user.id}'`,
        );
      }
      await supabase.auth.signOut();
      onClose();
      router.replace("/phone-auth");
      Alert.alert("", t("settings.deactivate_success"));
    } catch (e) {
      if (__DEV__) console.warn("[DeactivateAccountSheet]", e);
      Alert.alert(t("common.error"), t("profile.error_saving"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeactivate = () => {
    Alert.alert(
      t("settings.deactivate_account_title"),
      t("settings.deactivate_account_description"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.deactivate_confirm"),
          style: "destructive",
          onPress: () => void runDeactivate(),
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.headerRow}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>{t("settings.deactivate_account_title")}</Text>
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
          <Text style={styles.body}>{t("settings.deactivate_account_description")}</Text>

          <Text style={styles.sectionHeading}>{t("settings.deactivate_visibility_heading")}</Text>

          <VisibilityOption
            selected={choice === "hidden"}
            onPress={() => setChoice("hidden")}
            title={t("settings.deactivate_visibility_hidden")}
            hint={t("settings.deactivate_visibility_hidden_desc")}
          />
          <VisibilityOption
            selected={choice === "visible"}
            onPress={() => setChoice("visible")}
            title={t("settings.deactivate_visibility_visible")}
            hint={t("settings.deactivate_visibility_visible_desc")}
          />

          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && { opacity: 0.92 },
              submitting && { opacity: 0.7 },
            ]}
            onPress={confirmDeactivate}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={t("settings.deactivate_confirm")}
          >
            {submitting ? (
              <ActivityIndicator color={maakTokens.destructive} />
            ) : (
              <>
                <Ionicons name="pause-circle-outline" size={20} color={maakTokens.destructive} />
                <Text style={styles.confirmTxt}>
                  {t("settings.deactivate_confirm")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function VisibilityOption({
  selected,
  onPress,
  title,
  hint,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  hint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
    >
      <View style={styles.optionTextCol}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionHint}>{hint}</Text>
      </View>
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={selected ? maakTokens.primary : maakTokens.mutedForeground}
      />
    </Pressable>
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
  sectionHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: maakTokens.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 4,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: maakTokens.border,
    marginBottom: 10,
    backgroundColor: maakTokens.card,
  },
  optionSelected: {
    borderColor: maakTokens.primary,
    backgroundColor: `${maakTokens.primary}12`,
  },
  optionTextCol: { flex: 1, minWidth: 0 },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: maakTokens.foreground,
  },
  optionHint: {
    fontSize: 12,
    lineHeight: 16,
    color: maakTokens.mutedForeground,
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: maakTokens.destructive,
    marginTop: 16,
  },
  confirmTxt: {
    fontSize: 15,
    fontWeight: "600",
    color: maakTokens.destructive,
  },
});
