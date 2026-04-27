import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens } from "@maak/core";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const MOMENT_DEPTH_LINE_MS = 580;

const LINE_KEYS = Array.from({ length: 16 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `maak_moment_of_depth.lines_${n}` as const;
});

const AnimatedImage = Animated.createAnimatedComponent(Image);

type Props = {
  visible: boolean;
  onContinue: () => void;
};

export function MomentOfDepthInterstitialRN({ visible, onContinue }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [showStory, setShowStory] = useState(false);
  const mascotPulse = useSharedValue(1);

  useEffect(() => {
    if (!visible) {
      setVisibleLineCount(0);
      setShowStory(false);
      return;
    }
    setVisibleLineCount(0);
    setShowStory(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 16; i++) {
      timers.push(
        setTimeout(() => setVisibleLineCount(i), i * MOMENT_DEPTH_LINE_MS),
      );
    }
    timers.push(
      setTimeout(() => setShowStory(true), 16 * MOMENT_DEPTH_LINE_MS + 400),
    );
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      mascotPulse.value = 1;
      return;
    }
    mascotPulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1,
      false,
    );
  }, [visible, mascotPulse]);

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotPulse.value }],
  }));

  const linesToShow = useMemo(
    () => LINE_KEYS.slice(0, visibleLineCount),
    [visibleLineCount],
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onContinue}>
      <View style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AnimatedImage
            source={MascotAssets.onboarding}
            style={[styles.mascot, mascotStyle]}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />

          <View style={styles.linesCard}>
            {linesToShow.map((key, i) => {
              const isEmphasis = i === 4 || i === 11;
              return (
                <Animated.Text
                  key={key}
                  entering={FadeIn.duration(400)}
                  style={[styles.line, isEmphasis && styles.lineEmphasis]}
                >
                  {t(key)}
                </Animated.Text>
              );
            })}
          </View>

          {showStory ? (
            <Animated.View entering={FadeIn.duration(500)} style={styles.storyCard}>
              <Text style={styles.storyTitle}>{t("maak_matching_story.title")}</Text>
              <Text style={styles.storyP}>{t("maak_matching_story.body_1")}</Text>
              <Text style={styles.storyP}>{t("maak_matching_story.body_2")}</Text>
              <Text style={styles.storyP}>{t("maak_matching_story.body_3")}</Text>
            </Animated.View>
          ) : null}

          {showStory ? (
            <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.ctaWrap}>
              <Pressable style={styles.cta} onPress={onContinue} accessibilityRole="button">
                <Text style={styles.ctaTxt}>{t("maak_moment_of_depth.continue_cta")}</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: maakTokens.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: "center",
  },
  mascot: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  linesCard: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius2xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  line: {
    color: maakTokens.foreground,
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  lineEmphasis: {
    fontWeight: "700",
    fontStyle: "normal",
    color: maakTokens.primary,
    fontSize: 17,
  },
  storyCard: {
    marginTop: 16,
    backgroundColor: `${maakTokens.primary}0A`,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
    borderColor: `${maakTokens.primary}22`,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  storyTitle: {
    color: maakTokens.foreground,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  storyP: {
    color: maakTokens.mutedForeground,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 10,
  },
  ctaWrap: {
    marginTop: 20,
    alignSelf: "stretch",
    maxWidth: 400,
    width: "100%",
  },
  cta: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  ctaTxt: {
    color: maakTokens.primaryForeground,
    fontSize: 16,
    fontWeight: "700",
  },
});
