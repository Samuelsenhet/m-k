import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens } from "@maak/core";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** ~10 s for 16 lines — see docs/MOMENT_OF_DEPTH_SCRIPT.md */
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
          {linesToShow.map((key) => (
            <Text key={key} style={styles.line}>
              {t(key)}
            </Text>
          ))}
          {showStory ? (
            <View style={styles.storyBlock}>
              <Text style={styles.storyTitle}>{t("maak_matching_story.title")}</Text>
              <Text style={styles.storyP}>{t("maak_matching_story.body_1")}</Text>
              <Text style={styles.storyP}>{t("maak_matching_story.body_2")}</Text>
              <Text style={styles.storyP}>{t("maak_matching_story.body_3")}</Text>
            </View>
          ) : null}
          {showStory ? (
            <Pressable style={styles.cta} onPress={onContinue} accessibilityRole="button">
              <Text style={styles.ctaTxt}>{t("maak_moment_of_depth.continue_cta")}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0a0a0c",
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  mascot: {
    width: 112,
    height: 112,
    marginBottom: 16,
  },
  line: {
    color: "#f4f4f5",
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "500",
  },
  storyBlock: {
    marginTop: 20,
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.22)",
    width: "100%",
    maxWidth: 400,
  },
  storyTitle: {
    color: "#fafafa",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  storyP: {
    color: "rgba(244,244,245,0.88)",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 12,
  },
  cta: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: maakTokens.radiusLg,
    alignSelf: "stretch",
    maxWidth: 400,
    alignItems: "center",
  },
  ctaTxt: {
    color: maakTokens.primaryForeground,
    fontSize: 16,
    fontWeight: "700",
  },
});
