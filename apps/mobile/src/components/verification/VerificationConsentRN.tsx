import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { onAccept: () => void; onSkip: () => void };

export function VerificationConsentRN({ onAccept, onSkip }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconRow}>
        <View style={styles.iconDot} />
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={32} color={maakTokens.foreground} />
        </View>
      </View>

      <Text style={styles.title}>{t("mobile.verification.consent_title")}</Text>
      <Text style={styles.body}>{t("mobile.verification.consent_body")}</Text>

      <Pressable style={styles.acceptBtn} onPress={onAccept}>
        <Text style={styles.acceptText}>{t("mobile.verification.consent_accept")}</Text>
      </Pressable>

      <Pressable style={styles.customizeBtn} onPress={onSkip}>
        <Text style={styles.customizeText}>{t("mobile.verification.consent_customize")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, alignItems: "center" },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  iconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: maakTokens.foreground },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: maakTokens.foreground,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "700", color: maakTokens.foreground, textAlign: "left", alignSelf: "stretch", marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 23, color: maakTokens.mutedForeground, textAlign: "left", alignSelf: "stretch", marginBottom: 32 },
  acceptBtn: {
    alignSelf: "stretch",
    backgroundColor: maakTokens.muted,
    borderRadius: maakTokens.radius2xl,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  acceptText: { fontSize: 16, fontWeight: "700", color: maakTokens.foreground },
  customizeBtn: {
    alignSelf: "stretch",
    backgroundColor: maakTokens.muted,
    borderRadius: maakTokens.radius2xl,
    paddingVertical: 16,
    alignItems: "center",
  },
  customizeText: { fontSize: 16, fontWeight: "600", color: maakTokens.mutedForeground },
});
