import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { onContinue: () => void; onSkip: () => void };

const TIPS: { icon: keyof typeof Ionicons.glyphMap; titleKey: string; descKey: string }[] = [
  { icon: "person-circle-outline", titleKey: "mobile.verification.tip1_title", descKey: "mobile.verification.tip1_desc" },
  { icon: "heart-outline", titleKey: "mobile.verification.tip2_title", descKey: "mobile.verification.tip2_desc" },
];

export function VerificationTipsRN({ onContinue, onSkip }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("mobile.verification.tips_title")}</Text>

      <View style={styles.tips}>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Ionicons name={tip.icon} size={22} color={maakTokens.foreground} />
            <View style={styles.tipText}>
              <Text style={styles.tipTitle}>{t(tip.titleKey)}</Text>
              <Text style={styles.tipDesc}>{t(tip.descKey)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Page dots */}
      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      <Pressable style={styles.cta} onPress={onContinue}>
        <Text style={styles.ctaText}>{t("mobile.verification.continue")}</Text>
      </Pressable>

      <Pressable onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>{t("mobile.verification.not_now")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "700", color: maakTokens.foreground, textAlign: "center", marginBottom: 24 },
  tips: { alignSelf: "stretch", gap: 20, marginBottom: 24 },
  tipRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  tipText: { flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: "700", color: maakTokens.foreground },
  tipDesc: { fontSize: 14, color: maakTokens.mutedForeground, marginTop: 2, lineHeight: 20 },
  dots: { flexDirection: "row", gap: 6, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: maakTokens.border },
  dotActive: { backgroundColor: maakTokens.foreground, width: 20 },
  cta: {
    alignSelf: "stretch", backgroundColor: maakTokens.primary,
    borderRadius: maakTokens.radius2xl, paddingVertical: 16, alignItems: "center",
  },
  ctaText: { color: maakTokens.primaryForeground, fontSize: 16, fontWeight: "700" },
  skipBtn: { paddingVertical: 16, alignItems: "center" },
  skipText: { color: maakTokens.mutedForeground, fontSize: 15 },
});
