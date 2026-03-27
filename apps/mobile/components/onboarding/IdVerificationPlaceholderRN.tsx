import { maakTokens } from "@maak/core";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Webbens ID-verifiering (dokumentuppladdning) portas senare.
 * Samma som webben: valfritt steg, användaren kan hoppa över.
 */
export function IdVerificationPlaceholderRN({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.box}>
      <Text style={styles.icon}>🛡️</Text>
      <Text style={styles.title}>{t("mobile.id_verify.title")}</Text>
      <Text style={styles.body}>{t("mobile.id_verify.body")}</Text>
      <Pressable style={styles.btn} onPress={onContinue}>
        <Text style={styles.btnText}>{t("mobile.wizard.continue")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 14, alignItems: "center", paddingVertical: 8 },
  icon: { fontSize: 40 },
  title: { fontSize: 20, fontWeight: "700", color: maakTokens.foreground },
  body: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    lineHeight: 21,
  },
  btn: {
    marginTop: 8,
    backgroundColor: maakTokens.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: maakTokens.radiusLg,
  },
  btnText: { color: maakTokens.primaryForeground, fontWeight: "600" },
});
