import { ConfettiCannon } from "@/components/animations/ConfettiCannon";
import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from "react-native-reanimated";

const GRADIENT_TOP = "#FDFCFA";
const GRADIENT_BOTTOM = "#FFFFFF";

type FirstMatchCelebrationRNProps = {
  onContinue: () => void;
};

export function FirstMatchCelebrationRN({ onContinue }: FirstMatchCelebrationRNProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [confettiActive, setConfettiActive] = useState(true);

  // Animated entrance
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    // Haptic celebration burst
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 300);
    setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), 500);

    // Card entrance animation
    cardScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 120 }));
    cardOpacity.value = withDelay(200, withSpring(1));
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <LinearGradient colors={[GRADIENT_TOP, GRADIENT_BOTTOM]} style={styles.gradient}>
      <View style={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }]}>
        <Animated.View style={[styles.card, cardAnimStyle]}>
          <Image source={MascotAssets.lightingLantern} style={styles.mascot} resizeMode="contain" />

          <Text style={styles.title}>{t("waiting_phase.first_match_title")}</Text>
          <Text style={styles.body}>{t("maak_narrative_variants.matches_ready_body")}</Text>

          <View style={styles.quote}>
            <Text style={styles.quoteText}>{t("maak_narrative_variants.first_match_quote")}</Text>
          </View>

          <Pressable
            style={styles.cta}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              onContinue();
            }}
          >
            <Text style={styles.ctaText}>{t("maak_narrative_variants.see_matches_cta")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>

      <ConfettiCannon active={confettiActive} onComplete={() => setConfettiActive(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  wrap: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  card: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: maakTokens.border,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  mascot: { width: 210, height: 210, marginBottom: 8 },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: maakTokens.foreground,
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 14,
  },
  quote: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${maakTokens.primary}33`,
    backgroundColor: `${maakTokens.primary}12`,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  quoteText: {
    textAlign: "center",
    color: maakTokens.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  cta: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

