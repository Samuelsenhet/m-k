import { Emoji } from "@/components/Emoji";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { maakTokens } from "@maak/core";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  displayName?: string;
  onContinue: () => void;
  userId: string;
};

export function WelcomeScreenRN({ displayName, onContinue, userId }: Props) {
  const { t, i18n } = useTranslation();
  const { hasValidSupabaseConfig } = useSupabase();
  const onlineCount = useOnlineCount(userId, hasValidSupabaseConfig);

  const features = useMemo(
    () => [
      {
        title: t("mobile.welcome.feature_1_title"),
        description: t("mobile.welcome.feature_1_desc"),
        emoji: "👥",
      },
      {
        title: t("mobile.welcome.feature_2_title"),
        description: t("mobile.welcome.feature_2_desc"),
        emoji: "💬",
      },
      {
        title: t("mobile.welcome.feature_3_title"),
        description: t("mobile.welcome.feature_3_desc"),
        emoji: "✨",
      },
    ],
    [t, i18n.language],
  );

  const welcomeTitle = t("mobile.welcome.title", {
    namePart: displayName
      ? t("mobile.welcome.title_name_part", { name: displayName })
      : "",
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Emoji style={styles.mascot}>🌿</Emoji>
        <Text style={styles.guide}>{t("maak.guide")}</Text>
        <Text style={styles.h1}>{welcomeTitle}</Text>
        <Text style={styles.sub}>{t("mobile.welcome.subtitle")}</Text>
        {hasValidSupabaseConfig ? (
          <Text style={styles.online}>
            {t("common.online_now_full", {
              count: onlineCount.toLocaleString(i18n.language.startsWith("en") ? "en-US" : "sv-SE"),
            })}
          </Text>
        ) : null}

        <View style={styles.features}>
          {features.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Emoji style={styles.featureEmoji}>{f.emoji}</Emoji>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={styles.cta} onPress={onContinue}>
          <Text style={styles.ctaText}>{t("mobile.welcome.cta")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: maakTokens.background },
  scroll: { padding: 24, paddingBottom: 40 },
  mascot: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  guide: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
  },
  sub: {
    fontSize: 15,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  online: {
    fontSize: 14,
    fontWeight: "600",
    color: maakTokens.primary,
    textAlign: "center",
    marginTop: 12,
  },
  features: { marginTop: 28, gap: 12 },
  featureCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: maakTokens.radiusXl,
    backgroundColor: maakTokens.card,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  featureEmoji: { fontSize: 28 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: "600", color: maakTokens.foreground, marginBottom: 4 },
  featureDesc: { fontSize: 14, color: maakTokens.mutedForeground, lineHeight: 20 },
  cta: {
    marginTop: 28,
    backgroundColor: maakTokens.primary,
    paddingVertical: 16,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  ctaText: { color: maakTokens.primaryForeground, fontSize: 17, fontWeight: "600" },
});
