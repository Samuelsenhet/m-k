import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { onContinue: () => void; onSkip: () => void };

const POINTS: { icon: keyof typeof Ionicons.glyphMap; titleKey: string; descKey: string }[] = [
  { icon: "person-outline", titleKey: "mobile.verification.intro_point1_title", descKey: "mobile.verification.intro_point1_desc" },
  { icon: "shield-checkmark-outline", titleKey: "mobile.verification.intro_point2_title", descKey: "mobile.verification.intro_point2_desc" },
  { icon: "lock-closed-outline", titleKey: "mobile.verification.intro_point3_title", descKey: "mobile.verification.intro_point3_desc" },
];

export function VerificationIntroRN({ onContinue, onSkip }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark" size={48} color={maakTokens.primary} />
      </View>

      <Text style={styles.title}>{t("mobile.verification.intro_title")}</Text>

      <View style={styles.points}>
        {POINTS.map((p, i) => (
          <View key={i} style={styles.pointRow}>
            <Ionicons name={p.icon} size={22} color={maakTokens.foreground} />
            <View style={styles.pointText}>
              <Text style={styles.pointTitle}>{t(p.titleKey)}</Text>
              <Text style={styles.pointDesc}>{t(p.descKey)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Page dots */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
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
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${maakTokens.primary}1A`,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: "700", color: maakTokens.foreground, textAlign: "center", marginBottom: 24 },
  points: { alignSelf: "stretch", gap: 20, marginBottom: 24 },
  pointRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  pointText: { flex: 1 },
  pointTitle: { fontSize: 16, fontWeight: "700", color: maakTokens.foreground },
  pointDesc: { fontSize: 14, color: maakTokens.mutedForeground, marginTop: 2, lineHeight: 20 },
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
