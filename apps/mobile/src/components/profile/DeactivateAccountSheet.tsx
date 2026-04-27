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

type AccountChoice = "hidden" | "visible" | "delete";

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

  const [choice, setChoice] = useState<AccountChoice>("hidden");
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

  // Apple 5.1.1(v): account deletion must be available IN-APP and permanently
  // remove the user's account + personal data. Calls the delete-user edge fn
  // (service role) which runs auth.admin.deleteUser + cascade cleanup.
  const runDelete = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { userId: user.id },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      onClose();
      router.replace("/phone-auth");
      Alert.alert("", t("settings.delete_account_success"));
    } catch (e) {
      if (__DEV__) console.warn("[DeactivateAccountSheet] delete failed:", e);
      Alert.alert(t("common.error"), t("settings.delete_account_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAction = () => {
    if (choice === "delete") {
      Alert.alert(
        t("settings.delete_account_title"),
        t("settings.delete_account_description"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("settings.delete_account_confirm"),
            style: "destructive",
            onPress: () => void runDelete(),
          },
        ],
      );
      return;
    }
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
          <VisibilityOption
            selected={choice === "delete"}
            onPress={() => setChoice("delete")}
            title={t("settings.delete_account")}
            hint={t("settings.delete_account_description")}
            destructive
          />

          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && { opacity: 0.92 },
              submitting && { opacity: 0.7 },
            ]}
            onPress={confirmAction}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={
              choice === "delete"
                ? t("settings.delete_account_confirm")
                : t("settings.deactivate_confirm")
            }
          >
            {submitting ? (
              <ActivityIndicator color={maakTokens.destructive} />
            ) : (
              <>
                <Ionicons
                  name={choice === "delete" ? "trash-outline" : "pause-circle-outline"}
                  size={20}
                  color={maakTokens.destructive}
                />
                <Text style={styles.confirmTxt}>
                  {choice === "delete"
                    ? t("settings.delete_account_confirm")
                    : t("settings.deactivate_confirm")}
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
  destructive,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  hint: string;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        selected && styles.optionSelected,
        destructive && selected && styles.optionDestructiveSelected,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
    >
      <View style={styles.optionTextCol}>
        <Text style={[styles.optionTitle, destructive && { color: maakTokens.destructive }]}>
          {title}
        </Text>
        <Text style={styles.optionHint}>{hint}</Text>
      </View>
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={
          selected
            ? destructive
              ? maakTokens.destructive
              : maakTokens.primary
            : maakTokens.mutedForeground
        }
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
  optionDestructiveSelected: {
    borderColor: maakTokens.destructive,
    backgroundColor: `${maakTokens.destructive}12`,
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
