import { Emoji } from "@/components/Emoji";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { archetypeDisplayTitle } from "@/lib/archetypeTitle";
import {
  ARCHETYPE_INFO,
  CATEGORY_INFO,
  maakTokens,
  resolveProfilesAuthKey,
  type ArchetypeCode,
  type PersonalityCategory,
} from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FONT_HEADING = "PlayfairDisplay_700Bold";
const CHARCOAL_CARD = "#1a1a1a";
const PAGE_BG = "#000000";
const SAGE_LINK = "#7a9e88";
const HERO_H_MAX = 512;
const CARD_OVERLAP = 140;
const STORY_STRIP_H = 12;
const STORY_ABOVE_CARD = 24;

const CATEGORY_BADGE_EMOJI: Record<PersonalityCategory, string> = {
  DIPLOMAT: "🕊️",
  STRATEGER: "🎯",
  BYGGARE: "🏗️",
  UPPTÄCKARE: "🧭",
};

const CATEGORY_CARD_BG: Record<PersonalityCategory, { bg: string; border: string }> = {
  DIPLOMAT: { bg: "#E8EEFC", border: "rgba(59, 130, 246, 0.35)" },
  STRATEGER: { bg: "#EDE9FC", border: "rgba(139, 92, 246, 0.35)" },
  BYGGARE: { bg: "#DCF5E3", border: "rgba(75, 110, 72, 0.45)" },
  UPPTÄCKARE: { bg: "#FDF3D6", border: "rgba(245, 158, 11, 0.4)" },
};

type ProfileRow = {
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  hometown: string | null;
  country: string | null;
  work: string | null;
  height: string | null;
  interested_in?: string | null;
};

type PhotoRow = { storage_path: string; display_order: number; media_type?: string };

type Props = {
  userId: string;
  matchScore?: number;
  personalityInsight?: string | null;
  showLikePass?: boolean;
  onBack: () => void;
  onChat?: () => void;
  onLike?: () => void;
  onPass?: () => void;
};

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function parseInterests(val: string | null | undefined): string[] {
  if (!val) return [];
  return val.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
}

export function MatchProfileScreen({
  userId,
  matchScore,
  personalityInsight,
  onBack,
  onChat,
  onPass,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { supabase } = useSupabase();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [heroLayout, setHeroLayout] = useState({ y: 0, height: 0 });

  const heroMinH = Math.max(260, Math.min(HERO_H_MAX, Math.round(windowHeight * 0.42)));

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, userId);
      const [profileRes, photosRes, archRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, bio, date_of_birth, hometown, country, work, height, interested_in")
          .eq(profileKey, userId)
          .maybeSingle(),
        supabase
          .from("profile_photos")
          .select("storage_path, display_order, media_type")
          .eq("user_id", userId)
          .order("display_order"),
        supabase.from("personality_results").select("archetype").eq("user_id", userId).maybeSingle(),
      ]);
      if (profileRes.data) setProfile(profileRes.data as ProfileRow);
      if (photosRes.data?.length) setPhotos(photosRes.data.filter((p) => p.storage_path) as PhotoRow[]);
      if (archRes.data?.archetype) setArchetype(archRes.data.archetype);
    } catch (e) {
      if (__DEV__) console.error("[MatchProfileScreen]", e);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => { void load(); }, [load]);

  const getPublicUrl = (path: string) =>
    supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;

  const nextPhoto = () => { if (photos.length > 1) setPhotoIndex((i) => (i + 1) % photos.length); };
  const prevPhoto = () => { if (photos.length > 1) setPhotoIndex((i) => (i - 1 + photos.length) % photos.length); };

  const name = profile?.display_name ?? t("common.user");
  const age = ageFromDob(profile?.date_of_birth ?? null);
  const archetypeCode = archetype && archetype in ARCHETYPE_INFO ? (archetype as ArchetypeCode) : null;
  const archetypeInfo = archetypeCode ? ARCHETYPE_INFO[archetypeCode] : null;
  const cat = archetypeInfo?.category ?? null;
  const archLabel = archetypeDisplayTitle(archetype, t);
  const interests = parseInterests(profile?.interested_in);
  const locationLabel = [profile?.hometown, profile?.country ? t(`countries.${profile.country}`, { defaultValue: profile.country }) : null].filter(Boolean).join(", ") || null;
  const nameAgeLine = age != null ? `${name}, ${age}` : name;
  const heroBottomY = heroLayout.height > 0 ? heroLayout.y + heroLayout.height : heroLayout.y + heroMinH;

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.pageRoot, { paddingTop: insets.top }]}>
      {/* Hero photo */}
      <View
        collapsable={false}
        style={[styles.hero, { minHeight: heroMinH }]}
        onLayout={(e) => setHeroLayout({ y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })}
      >
        {photos.length > 0 ? (
          <>
            <Image
              source={{ uri: getPublicUrl(photos[photoIndex]!.storage_path) }}
              style={styles.heroImg}
              contentFit="cover"
              contentPosition={{ top: "22%", left: "50%" }}
              transition={200}
            />
            {photos.length > 1 ? (
              <>
                <Pressable style={styles.tapLeft} onPress={prevPhoto} accessibilityLabel={t("profile.prev_photo")} />
                <Pressable style={styles.tapRight} onPress={nextPhoto} accessibilityLabel={t("profile.next_photo")} />
              </>
            ) : null}
          </>
        ) : (
          <LinearGradient colors={["#C5D9C8", "#E8EDE3"]} style={[StyleSheet.absoluteFill, styles.phCenter]}>
            <Text style={styles.phInitials}>{name.slice(0, 2).toUpperCase()}</Text>
          </LinearGradient>
        )}

        <LinearGradient
          colors={["transparent", "rgba(26,26,26,0.2)", "rgba(26,26,26,0.72)", CHARCOAL_CARD]}
          locations={[0, 0.52, 0.78, 1]}
          style={styles.heroGradient}
          pointerEvents="none"
        />

        <View style={styles.topBar} pointerEvents="box-none">
          <Pressable style={styles.heroIconBtn} onPress={onBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          {matchScore != null ? (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{Math.round(matchScore)}%</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Story segments */}
      {photos.length > 1 ? (
        <View
          pointerEvents="none"
          style={[styles.storyOverlay, {
            top: Math.max(0, Math.round(heroBottomY - CARD_OVERLAP - STORY_ABOVE_CARD - STORY_STRIP_H)),
          }]}
        >
          <View style={styles.storyRow}>
            {photos.map((_, i) => (
              <View key={i} style={i === photoIndex ? styles.storyActive : styles.storyInactive} />
            ))}
          </View>
        </View>
      ) : null}

      {/* Overlapping card */}
      <ScrollView
        style={[styles.cardFlow, { marginTop: -CARD_OVERLAP }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={styles.cardInner}>
          <Text style={styles.name} numberOfLines={2}>{nameAgeLine}</Text>

          {archLabel ? (
            <View style={styles.categoryRow}>
              {cat ? <Text style={styles.categoryEmoji}>{CATEGORY_BADGE_EMOJI[cat]}</Text> : null}
              <Text style={styles.archLabel}>{archLabel}</Text>
            </View>
          ) : null}

          {locationLabel ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.metaText}>{locationLabel}</Text>
            </View>
          ) : null}
          {profile?.work ? (
            <View style={styles.metaRow}>
              <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.metaText}>{profile.work}</Text>
            </View>
          ) : null}

          {personalityInsight ? (
            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>{t("chat.why_you_matched")}</Text>
              <Text style={styles.insightText}>{personalityInsight}</Text>
            </View>
          ) : null}

          {interests.length > 0 ? (
            <View style={styles.chipRow}>
              {interests.map((label) => (
                <View key={label} style={styles.interestChip}>
                  <Text style={styles.interestText}>{label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {archetypeInfo && cat ? (
            <View style={styles.personalitySection}>
              <Text style={styles.sectionTitle}>{t("personality.main_category_label")}</Text>
              <View style={[styles.catCard, { backgroundColor: CATEGORY_CARD_BG[cat].bg, borderColor: CATEGORY_CARD_BG[cat].border }]}>
                <Emoji style={styles.catCardEmoji}>{CATEGORY_INFO[cat].emoji}</Emoji>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catCardTitle}>
                    {t(`personality.guide_category_${cat}_title`, { defaultValue: CATEGORY_INFO[cat].title })}
                  </Text>
                  <Text style={styles.catCardDesc}>
                    {t(`personality.guide_category_${cat}_desc`, { defaultValue: CATEGORY_INFO[cat].description })}
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t("personality.your_archetype_card")}</Text>
              <View style={[styles.archCard, { backgroundColor: CATEGORY_CARD_BG[cat].bg, borderColor: CATEGORY_CARD_BG[cat].border }]}>
                <View style={styles.archHead}>
                  <Emoji style={styles.archEmoji}>{archetypeInfo.emoji}</Emoji>
                  <View>
                    <Text style={styles.archTitle}>
                      {t(`personality.archetypes.${archetypeCode}.title`, { defaultValue: archetypeInfo.title })}
                    </Text>
                    <Text style={styles.archCode}>{archetypeInfo.name}</Text>
                  </View>
                </View>
                <Text style={styles.archDesc}>
                  {t(`personality.archetypes.${archetypeCode}.description`, { defaultValue: archetypeInfo.description })}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            {onPass ? (
              <Pressable style={styles.passBtn} onPress={onPass}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.85)" />
                <Text style={styles.passBtnText}>{t("matches.pass")}</Text>
              </Pressable>
            ) : null}
            {onChat ? (
              <Pressable style={styles.chatBtn} onPress={onChat}>
                <Ionicons name="chatbubble" size={18} color={maakTokens.primaryForeground} />
                <Text style={styles.chatBtnText}>{t("chat.chatWith")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: { flex: 1, backgroundColor: CHARCOAL_CARD, position: "relative" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: PAGE_BG },
  hero: { overflow: "hidden", position: "relative" },
  heroImg: { ...StyleSheet.absoluteFillObject },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  tapLeft: { position: "absolute", left: 0, top: 0, bottom: 0, width: "33.33%", zIndex: 10 },
  tapRight: { position: "absolute", right: 0, top: 0, bottom: 0, width: "33.33%", zIndex: 10 },
  phCenter: { alignItems: "center", justifyContent: "center" },
  phInitials: { fontSize: 56, fontWeight: "700", color: maakTokens.primary, opacity: 0.5 },
  topBar: {
    position: "absolute", top: 16, left: 16, right: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", zIndex: 20,
  },
  heroIconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.38)",
    alignItems: "center", justifyContent: "center",
  },
  scoreBadge: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: `${maakTokens.primary}CC`,
  },
  scoreText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  storyOverlay: {
    position: "absolute", left: 0, right: 0, height: STORY_STRIP_H,
    justifyContent: "center", alignItems: "center", zIndex: 100,
    ...Platform.select({ android: { elevation: 24 }, ios: {} }),
  },
  storyRow: { flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" },
  storyActive: { width: 28, height: 4, borderRadius: 9999, backgroundColor: "#fff" },
  storyInactive: { width: 6, height: 6, borderRadius: 9999, backgroundColor: "rgba(255,255,255,0.45)" },
  cardFlow: {
    flexShrink: 0, backgroundColor: CHARCOAL_CARD,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", zIndex: 2,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.28, shadowRadius: 14 },
      android: { elevation: 12 },
    }),
  },
  cardInner: { paddingHorizontal: 20, paddingTop: 18, gap: 8 },
  name: { fontFamily: FONT_HEADING, fontSize: 26, fontWeight: "700", color: "#fff", lineHeight: 32 },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  categoryEmoji: { fontSize: 16 },
  archLabel: { fontSize: 14, fontWeight: "600", color: SAGE_LINK },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  insightBox: {
    marginTop: 8, padding: 14, borderRadius: maakTokens.radiusLg,
    backgroundColor: `${maakTokens.primary}22`, borderWidth: 1, borderColor: `${maakTokens.primary}44`,
  },
  insightTitle: {
    fontSize: 11, fontWeight: "700", color: maakTokens.primaryMid,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
  },
  insightText: { fontSize: 14, lineHeight: 21, color: "rgba(255,255,255,0.9)" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  interestChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  interestText: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  bio: { fontSize: 14, lineHeight: 21, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  personalitySection: { marginTop: 16 },
  sectionTitle: {
    fontFamily: FONT_HEADING, fontSize: 16, fontWeight: "700", color: maakTokens.primaryMid, marginBottom: 8,
  },
  catCard: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderRadius: maakTokens.radiusXl, borderWidth: 1,
  },
  catCardEmoji: { fontSize: 32 },
  catCardTitle: { fontFamily: FONT_HEADING, fontSize: 18, fontWeight: "700", color: maakTokens.foreground },
  catCardDesc: { fontSize: 13, color: maakTokens.mutedForeground, marginTop: 2 },
  archCard: { padding: 14, borderRadius: maakTokens.radiusXl, borderWidth: 1 },
  archHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  archEmoji: { fontSize: 36 },
  archTitle: { fontFamily: FONT_HEADING, fontSize: 18, fontWeight: "700", color: maakTokens.foreground },
  archCode: { fontSize: 12, color: maakTokens.mutedForeground },
  archDesc: { fontSize: 13, lineHeight: 20, color: maakTokens.mutedForeground },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  passBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  passBtnText: { fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  chatBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 22, backgroundColor: maakTokens.primary,
  },
  chatBtnText: { fontSize: 16, fontWeight: "700", color: maakTokens.primaryForeground },
});
