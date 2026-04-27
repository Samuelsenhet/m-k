import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Props = { onDone: () => void };

export function VerificationPendingRN({ onDone }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Image
        source={MascotAssets.waitingTea}
        style={styles.mascot}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Ionicons name="shield-checkmark" size={32} color={maakTokens.primary} style={{ marginBottom: 8 }} />
      <Text style={styles.title}>{t("mobile.verification.pending_title")}</Text>
      <Text style={styles.body}>{t("mobile.verification.pending_body")}</Text>

      <Pressable style={styles.cta} onPress={onDone}>
        <Text style={styles.ctaText}>{t("mobile.verification.done")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  mascot: { width: 120, height: 120, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: maakTokens.foreground, textAlign: "center" },
  body: { fontSize: 15, lineHeight: 22, color: maakTokens.mutedForeground, textAlign: "center", maxWidth: 300, marginBottom: 24 },
  cta: {
    alignSelf: "stretch",
    backgroundColor: maakTokens.primary,
    borderRadius: maakTokens.radius2xl,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: maakTokens.primaryForeground, fontSize: 16, fontWeight: "700" },
});
