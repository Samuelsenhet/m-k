import { useSupabase } from "@/contexts/SupabaseProvider";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Brain, Heart, Shield } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Match web `LandingPage` gradient (`COLORS.sage[50]` → white). */
const GRADIENT_TOP = "#FDFCFA";
const GRADIENT_BOTTOM = "#FFFFFF";
/** Match web `COLORS.primary[100]` / `primary[600]` för ikonrutor */
const FEATURE_ICON_BG = "#D9EDE4";
const FEATURE_ICON_COLOR = "#3D5A3B";

type SlideId = "sofia" | "merbel" | "erik";

const SLIDE_ORDER: SlideId[] = ["sofia", "merbel", "erik"];

/** Samma ikoner, storlek och stroke som web `LandingPage` (Lucide Brain / Shield / Heart). */
const LANDING_FEATURES = [
  {
    Icon: Brain,
    titleKey: "landing.feature_personality_title" as const,
    subKey: "landing.feature_personality_sub" as const,
  },
  {
    Icon: Shield,
    titleKey: "landing.feature_safe_title" as const,
    subKey: "landing.feature_safe_sub" as const,
  },
  {
    Icon: Heart,
    titleKey: "landing.feature_meaningful_title" as const,
    subKey: "landing.feature_meaningful_sub" as const,
  },
];

/**
 * Bundled profilkort — samma PNG som webb `src/assets/landing/landing-profile-*.png`
 * (synkas hit från repots kanoniska filer).
 */
const PROFILE_IMAGES: Record<SlideId, ImageSourcePropType> = {
  sofia: require("../../assets/images/landing/landing-profile-sofia.png"),
  merbel: require("../../assets/images/landing/landing-profile-merbel.png"),
  erik: require("../../assets/images/landing/landing-profile-erik.png"),
};

/** w-60 card, p-4 — same inner width as web `aspect-[3/4]` photo area */
const MAIN_CARD_W = 240;
const MAIN_CARD_PAD = 16;
const PHOTO_INNER_W = MAIN_CARD_W - MAIN_CARD_PAD * 2;
const PHOTO_INNER_H = Math.round((PHOTO_INNER_W * 4) / 3);

export default function LandingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, hasValidSupabaseConfig } = useSupabase();
  const user = session?.user;
  const onlineCount = useOnlineCount(user?.id, hasValidSupabaseConfig);

  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % SLIDE_ORDER.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const prevIndex = (slideIndex - 1 + SLIDE_ORDER.length) % SLIDE_ORDER.length;
  const nextIndex = (slideIndex + 1) % SLIDE_ORDER.length;
  const currentId = SLIDE_ORDER[slideIndex];
  const prevId = SLIDE_ORDER[prevIndex];
  const nextId = SLIDE_ORDER[nextIndex];

  const intro = t("maak.intro").split("\n");

  const slideMeta = useMemo(
    () => ({
      name: t(`landing.examples.${currentId}.name`),
      archetype: t(`landing.examples.${currentId}.archetype`),
      bio: t(`landing.examples.${currentId}.bio`),
      tag1: t(`landing.examples.${currentId}.tag_1`),
      tag2: t(`landing.examples.${currentId}.tag_2`),
    }),
    [t, currentId]
  );

  const localeTag = i18n.language.startsWith("sv") ? "sv-SE" : "en-US";
  const countDisplay = onlineCount.toLocaleString(localeTag);

  const handleStart = () => {
    if (user) {
      router.push("/onboarding");
    } else {
      router.push("/phone-auth");
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[GRADIENT_TOP, GRADIENT_BOTTOM]} style={styles.gradient}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {user ? (
            <View
              style={styles.mobileQuickNav}
              accessibilityRole="toolbar"
              accessibilityLabel={t("mobile.landing.quick_nav_a11y")}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("nav.matches")}
                onPress={() => router.push("/(tabs)")}
                style={styles.iconGhost}
              >
                <Ionicons name="heart-outline" size={22} color={maakTokens.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("nav.chat")}
                onPress={() => router.push("/(tabs)/chat")}
                style={styles.iconGhost}
              >
                <Ionicons name="chatbubbles-outline" size={22} color={maakTokens.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("nav.profile")}
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.iconGhost}
              >
                <Ionicons name="person-outline" size={22} color={maakTokens.primary} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.hero}>
            <View style={styles.heroMascotWrap}>
              <Image source={MascotAssets.onboarding} style={styles.heroMascot} resizeMode="contain" />
            </View>
            {intro.map((line, i) => (
              <Text key={i} style={styles.introLine}>
                {line}
              </Text>
            ))}
            <Text style={styles.heroNarrative}>{t("maak_narrative_variants.landing_hero_line")}</Text>
          </View>

          <View style={styles.features} accessibilityLabel={t("landing.features_a11y")}>
            {LANDING_FEATURES.map(({ Icon, titleKey, subKey }) => (
              <View key={titleKey} style={styles.featureCell}>
                <View style={[styles.featureIconWrap, { backgroundColor: FEATURE_ICON_BG }]}>
                  <Icon size={24} color={FEATURE_ICON_COLOR} strokeWidth={1.75} />
                </View>
                <Text style={styles.featureTitle}>{t(titleKey)}</Text>
                <Text style={styles.featureSub}>{t(subKey)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardScene}>
            <View
              style={[styles.deckCard, styles.deckLeft]}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Image
                source={PROFILE_IMAGES[prevId]}
                style={styles.deckImage}
                resizeMode="cover"
              />
            </View>
            <View
              style={[styles.deckCard, styles.deckRight]}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Image
                source={PROFILE_IMAGES[nextId]}
                style={styles.deckImage}
                resizeMode="cover"
              />
            </View>

            {/* Card first; overlays after so they paint above (Android elevation) */}
            <View style={styles.mainCard} collapsable={false}>
              <View style={styles.mainPhoto} collapsable={false}>
                <Image
                  key={currentId}
                  source={PROFILE_IMAGES[currentId]}
                  style={styles.mainPhotoImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.cardName}>
                {slideMeta.name}, {slideMeta.archetype}
              </Text>
              <Text style={styles.cardBio} numberOfLines={2}>
                {slideMeta.bio}
              </Text>
              <View style={styles.tags}>
                <View style={[styles.tag, { backgroundColor: "#F8F6F1" }]}>
                  <Text style={[styles.tagText, { color: "#787254" }]}>{slideMeta.tag1}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: "#F8F6F1" }]}>
                  <Text style={[styles.tagText, { color: "#787254" }]}>{slideMeta.tag2}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sittingBadge} accessibilityElementsHidden pointerEvents="none">
              <Image source={MascotAssets.sitting} style={styles.sittingImg} resizeMode="contain" />
            </View>

            <View style={styles.emojiChat} accessibilityElementsHidden pointerEvents="none">
              <Text style={styles.emoji}>💬</Text>
            </View>
            <View style={styles.emojiPass} accessibilityElementsHidden pointerEvents="none">
              <Text style={styles.emojiSmall}>🙅</Text>
            </View>
          </View>

          {hasValidSupabaseConfig ? (
            <Text
              style={styles.onlineLine}
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
            >
              {t("common.online_now_full", { count: countDisplay })}
            </Text>
          ) : null}

          <View style={styles.ctaBlock}>
            <Pressable style={styles.cta} onPress={handleStart}>
              <Text style={styles.ctaText}>{t("landing.cta")}</Text>
            </Pressable>
            {!user ? (
              <Pressable style={styles.ctaSecondary} onPress={() => router.push("/phone-auth")}>
                <Text style={styles.ctaSecondaryText}>{t("landing.login")}</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.legal}>
            {t("landing.terms_agree")}{" "}
            <Text style={styles.legalLink} onPress={() => router.push("/terms")}>
              {t("landing.terms_link")}
            </Text>{" "}
            {t("landing.and")}{" "}
            <Text style={styles.legalLink} onPress={() => router.push("/privacy")}>
              {t("landing.privacy_link")}
            </Text>
            .
          </Text>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1, backgroundColor: "transparent" },
  scrollContent: {
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    maxWidth: 448,
    width: "100%",
    alignSelf: "center",
  },
  /** Inloggad utan topbar — samma ikoner som webbens nav (md+) */
  mobileQuickNav: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    marginBottom: 4,
  },
  iconGhost: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(75, 110, 72, 0.08)",
  },
  hero: { alignItems: "center", marginBottom: 24, paddingTop: 4 },
  heroMascotWrap: { marginBottom: 0 },
  heroMascot: { width: 220, height: 220 },
  introLine: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#6B6860",
    paddingHorizontal: 8,
  },
  heroNarrative: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: "#5C5952",
    paddingHorizontal: 16,
    fontWeight: "600",
    maxWidth: 340,
  },
  features: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 24,
    marginBottom: 40,
    /** Match web `SCREEN_CONTENT_WIDTH` + `px-4` (16px) */
    paddingHorizontal: 16,
    maxWidth: 672,
    alignSelf: "center",
    width: "100%",
  },
  featureCell: {
    flex: 1,
    minWidth: 0,
    maxWidth: 120,
    alignItems: "center",
  },
  featureIconWrap: {
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    color: "#253D2C",
    textAlign: "center",
  },
  featureSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    color: "#9A9790",
    textAlign: "center",
  },
  cardScene: {
    width: "100%",
    maxWidth: 288,
    minHeight: 400,
    alignSelf: "center",
    marginBottom: 20,
    paddingTop: 16,
    paddingBottom: 24,
    position: "relative",
  },
  deckCard: {
    position: "absolute",
    width: 192,
    height: 256,
    borderRadius: 24,
    overflow: "hidden",
    opacity: 0.5,
    backgroundColor: "#F8F6F1",
  },
  deckImage: {
    width: 192,
    height: 256,
  },
  deckLeft: {
    top: 24,
    left: -16,
    transform: [{ rotate: "-12deg" }],
  },
  deckRight: {
    top: 32,
    right: -8,
    transform: [{ rotate: "8deg" }],
  },
  sittingBadge: {
    position: "absolute",
    top: 16,
    left: 0,
    zIndex: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  sittingImg: { width: 44, height: 44 },
  emojiChat: {
    position: "absolute",
    top: 48,
    right: 0,
    zIndex: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  emojiPass: {
    position: "absolute",
    top: 112,
    right: 0,
    zIndex: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  emoji: { fontSize: 22, lineHeight: 26 },
  emojiSmall: { fontSize: 18, lineHeight: 22 },
  mainCard: {
    position: "relative",
    zIndex: 10,
    width: MAIN_CARD_W,
    alignSelf: "center",
    marginTop: 0,
    borderRadius: 24,
    padding: MAIN_CARD_PAD,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mainPhoto: {
    width: PHOTO_INNER_W,
    height: PHOTO_INNER_H,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "#EBEAE8",
    alignSelf: "center",
  },
  mainPhotoImage: {
    width: PHOTO_INNER_W,
    height: PHOTO_INNER_H,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#253D2C",
    marginBottom: 6,
  },
  cardBio: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9A9790",
    marginBottom: 10,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { fontSize: 12 },
  onlineLine: {
    textAlign: "center",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    color: "#6B6860",
    marginBottom: 20,
  },
  ctaBlock: {
    gap: 12,
    marginBottom: 16,
  },
  cta: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: maakTokens.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: maakTokens.primaryForeground,
    fontSize: 18,
    fontWeight: "700",
  },
  ctaSecondary: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: maakTokens.primary,
    backgroundColor: "transparent",
  },
  ctaSecondaryText: {
    fontSize: 17,
    fontWeight: "600",
    color: maakTokens.primary,
  },
  legal: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9A9790",
    textAlign: "center",
    paddingBottom: 8,
  },
  legalLink: {
    textDecorationLine: "underline",
    color: "#4B6E48",
    fontWeight: "600",
  },
});
