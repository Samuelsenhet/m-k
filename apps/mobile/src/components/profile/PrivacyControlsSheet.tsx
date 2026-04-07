import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy: () => void;
};

export function PrivacyControlsSheet({ visible, onClose, onOpenPrivacyPolicy }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
            >
              <Ionicons name="close" size={26} color={maakTokens.foreground} />
            </Pressable>
          </View>
          <Text style={styles.body}>{t("settings.privacy_description")}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("settings.profile_visibility")}</Text>
            <Text style={styles.comingSoon}>{t("settings.coming_soon")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("settings.shared_data")}</Text>
            <Text style={styles.comingSoon}>{t("settings.coming_soon")}</Text>
          </View>
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
  rowLabel: { fontSize: 15, color: maakTokens.foreground },
  comingSoon: { fontSize: 13, color: maakTokens.mutedForeground, fontStyle: "italic" },
  policyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginTop: 8,
  },
  policyLinkTxt: { fontSize: 15, fontWeight: "600", color: maakTokens.primary },
});
