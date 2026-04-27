import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MascotAssets } from "@/lib/mascotAssets";

const GRADIENT_TOP = "#FDFCFA";
const GRADIENT_BOTTOM = "#F7F7F5";

export interface WaitingPhaseRNProps {
  timeRemaining: string;
  nextMatchAvailable: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function WaitingPhaseRN({
  timeRemaining,
  nextMatchAvailable,
  refreshing = false,
  onRefresh,
}: WaitingPhaseRNProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tipIndex, setTipIndex] = useState(0);

  const tips = useMemo(
    () =>
      [
        {
          icon: "heart-outline" as ComponentProps<typeof Ionicons>["name"],
          title: t("waiting_phase.tip_1_title"),
          description: t("waiting_phase.tip_1_desc"),
        },
        {
          icon: "time-outline" as ComponentProps<typeof Ionicons>["name"],
          title: t("waiting_phase.tip_2_title"),
          description: t("waiting_phase.tip_2_desc"),
        },
        {
          icon: "sparkles-outline" as ComponentProps<typeof Ionicons>["name"],
          title: t("waiting_phase.tip_3_title"),
          description: t("waiting_phase.tip_3_desc"),
        },
      ],
    [t],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 5000);
    return () => clearInterval(id);
  }, [tips.length]);

  const tip = tips[tipIndex]!;

  const nextLabel = (() => {
    try {
      const d = new Date(nextMatchAvailable);
      if (Number.isNaN(d.getTime())) return nextMatchAvailable;
      const loc = i18n.language.startsWith("en") ? "en-US" : "sv-SE";
      return d.toLocaleString(loc, {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return nextMatchAvailable;
    }
  })();

  return (
    <LinearGradient colors={[GRADIENT_TOP, GRADIENT_BOTTOM]} style={styles.gradient}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          {
            flexGrow: 1,
            /* Short content: center block vertically so empty space splits top/bottom (no huge band only under footer). */
            justifyContent: "center",
            paddingTop: insets.top + 16,
            /* Tab scene already sits above the tab bar - do not add tabBarHeight. */
            paddingBottom: insets.bottom + 20,
          },
        ]}
        {...(onRefresh
          ? {
              refreshControl: (
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              ),
            }
          : {})}
      >
        <Text style={styles.kicker}>{t("maak.waiting")}</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t("waiting_phase.first_match_title")}</Text>
            <Text style={styles.cardSubtitle}>{t("waiting_phase.first_match_subtitle")}</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.countdownRow}>
              <View style={styles.mascotWrap}>
                <Image source={MascotAssets.waitingTea} style={styles.mascot} resizeMode="contain" />
              </View>
              <View style={styles.countdownRight}>
                <Ionicons name="time-outline" size={26} color={maakTokens.primary} />
                <View style={styles.countdownTextCol}>
                  <Text style={styles.countdownValue}>{timeRemaining}</Text>
                  <Text style={styles.countdownHint}>{t("waiting_phase.countdown_hint")}</Text>
                </View>
              </View>
            </View>

            <View style={styles.tipCard}>
              <View style={styles.tipIconCircle}>
                <Ionicons name={tip.icon} size={22} color={maakTokens.primary} />
              </View>
              <View style={styles.tipTextCol}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipBody}>{tip.description}</Text>
              </View>
            </View>

            <View style={styles.dots}>
              {tips.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === tipIndex ? styles.dotActive : styles.dotIdle]}
                />
              ))}
            </View>

            <Text style={styles.nextReset}>
              {t("waiting_phase.next_reset_lead")}{" "}
              <Text style={styles.nextResetBold}>{nextLabel}</Text>
            </Text>

            <Pressable
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Text style={styles.ctaText}>{t("waiting_phase.continue_explore")}</Text>
              <Ionicons name="arrow-forward" size={20} color={maakTokens.primaryForeground} />
            </Pressable>
          </View>
        </View>

        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>
            {t("maak_moment_of_depth.lines_13")}{"\n"}
            {t("maak_moment_of_depth.lines_14")}{"\n"}
            {t("maak_moment_of_depth.lines_16")}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  /** Required so the scroll viewport fills the tab scene; otherwise parent shows empty gradient below. */
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  kicker: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    borderRadius: maakTokens.radius2xl,
    borderWidth: 1,
    borderColor: `${maakTokens.primary}33`,
    backgroundColor: maakTokens.card,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  cardBody: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12, gap: 18 },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 14,
    backgroundColor: maakTokens.muted,
    borderRadius: maakTokens.radiusLg,
  },
  mascotWrap: {
    width: 72,
    height: 72,
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  mascot: { width: 72, height: 72 },
  countdownRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  countdownTextCol: { flex: 1, minWidth: 0 },
  countdownValue: {
    fontSize: 28,
    fontWeight: "700",
    color: maakTokens.primary,
  },
  countdownHint: {
    fontSize: 13,
    color: maakTokens.mutedForeground,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    minHeight: 88,
    backgroundColor: `${maakTokens.muted}CC`,
    borderRadius: maakTokens.radiusLg,
  },
  tipIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${maakTokens.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTextCol: { flex: 1, minWidth: 0 },
  tipTitle: { fontSize: 15, fontWeight: "600", color: maakTokens.foreground },
  tipBody: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    marginTop: 6,
    lineHeight: 20,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    width: 28,
    backgroundColor: maakTokens.primary,
  },
  dotIdle: {
    width: 6,
    backgroundColor: `${maakTokens.mutedForeground}44`,
  },
  nextReset: {
    fontSize: 12,
    color: maakTokens.mutedForeground,
    textAlign: "center",
  },
  nextResetBold: { fontWeight: "600", color: maakTokens.mutedForeground },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: maakTokens.primary,
    paddingVertical: 16,
    borderRadius: maakTokens.radiusXl,
    marginTop: 4,
  },
  ctaPressed: { opacity: 0.92 },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    color: maakTokens.primaryForeground,
  },
  quoteBlock: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    borderLeftColor: `${maakTokens.primary}44`,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
    color: maakTokens.mutedForeground,
    textAlign: "left",
  },
});
