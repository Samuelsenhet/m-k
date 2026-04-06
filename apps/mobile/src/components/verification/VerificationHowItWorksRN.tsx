import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { MascotAssets } from "@/lib/mascotAssets";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { onContinue: () => void; onSkip: () => void };

export function VerificationHowItWorksRN({ onContinue, onSkip }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const pages = [
    {
      title: t("mobile.verification.how_title"),
      body: t("mobile.verification.how_body_1"),
      cta: t("mobile.verification.continue"),
    },
    {
      title: t("mobile.verification.how_title"),
      body: t("mobile.verification.how_body_2"),
      link: t("mobile.verification.how_link"),
      cta: t("mobile.verification.verify_me"),
    },
  ];

  const current = pages[page]!;
  const isLast = page === pages.length - 1;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Illustration */}
      <Image
        source={MascotAssets.encouraging}
        style={styles.illustration}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />

      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.body}>{current.body}</Text>
      {current.link ? (
        <Text style={styles.link}>{current.link}</Text>
      ) : null}

      {/* Page dots */}
      <View style={styles.dots}>
        {pages.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <Pressable
        style={styles.cta}
        onPress={() => {
          if (isLast) onContinue();
          else setPage(page + 1);
        }}
      >
        <Text style={styles.ctaText}>{current.cta}</Text>
      </Pressable>

      <Pressable onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>{t("mobile.verification.not_now")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: "center" },
  illustration: { width: 140, height: 140, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: maakTokens.foreground, textAlign: "center", marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 23, color: maakTokens.mutedForeground, textAlign: "center", marginBottom: 12, maxWidth: 320 },
  link: { fontSize: 14, color: maakTokens.primary, textDecorationLine: "underline", marginBottom: 20 },
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
