import { useSupabase } from "@/contexts/SupabaseProvider";
import { i18n } from "@/lib/i18n";
import { getInstagramUsername, getLinkedInUsername } from "@/lib/socialUsernames";
import {
  ARCHETYPE_CODES_BY_CATEGORY,
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
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Max hero height (px); actual height scales with window so “Visa mer” fits on smaller phones. */
const HERO_H_MAX = 512;
/** Match web Profile page shell (`bg-black` + dark card). */
const PAGE_BG = "#000000";
/** Loaded in root `_layout.tsx` via `@expo-google-fonts/playfair-display`. */
const FONT_HEADING = "PlayfairDisplay_700Bold";
const GRID_SELECTION_BORDER = "#2d5a3d";
/** Muted sage for links on dark profile card (reference screenshots). */
const SAGE_LINK = "#7a9e88";
/** Solid charcoal content card under hero (reference: no glass). */
const CHARCOAL_CARD = "#1a1a1a";

/** Same emojis as web `ArchetypeBadge` (category pill on dark hero); labels via i18n. */
const CATEGORY_BADGE_EMOJI: Record<PersonalityCategory, string> = {
  DIPLOMAT: "🕊️",
  STRATEGER: "🎯",
  BYGGARE: "🏗️",
  UPPTÄCKARE: "🧭",
};

/** Light mint tiles in “Visa mer” sheet (reference). */
const CATEGORY_CARD: Record<PersonalityCategory, { bg: string; border: string }> = {
  DIPLOMAT: { bg: "#E8EEFC", border: "rgba(59, 130, 246, 0.35)" },
  STRATEGER: { bg: "#EDE9FC", border: "rgba(139, 92, 246, 0.35)" },
  BYGGARE: { bg: "#DCF5E3", border: "rgba(75, 110, 72, 0.45)" },
  UPPTÄCKARE: { bg: "#FDF3D6", border: "rgba(245, 158, 11, 0.4)" },
};

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  hometown: string | null;
  country: string | null;
  work: string | null;
  height: string | null;
  interested_in?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  education?: string | null;
  gender?: string | null;
  id_verification_status?: string | null;
  dating_intention?: string | null;
  dating_intention_extra?: string | null;
  relationship_type?: string | null;
  relationship_type_extra?: string | null;
}

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
}

function formatHeightSafe(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return i18n.t("profile.height_value_cm", { value });
  return "";
}

function parseInterests(interestedIn: string | null | undefined): string[] {
  if (!interestedIn || typeof interestedIn !== "string") return [];
  const seen = new Set<string>();
  return interestedIn
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => {
      const k = s.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export type ProfileViewRNProps = {
  onEdit: () => void;
  onSettings: () => void;
};

export function ProfileViewRN({ onEdit, onSettings }: ProfileViewRNProps) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  /** ~38% of screen keeps name + CTAs + “Visa mer” visible without scrolling on typical phones. */
  const heroH = Math.min(HERO_H_MAX, Math.max(240, Math.round(windowHeight * 0.38)));
  const { supabase, session } = useSupabase();
  const user = session?.user;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const [profileRes, photosRes, archRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "display_name, bio, date_of_birth, hometown, country, work, height, interested_in, instagram, linkedin, id_verification_status, education, gender, dating_intention, dating_intention_extra, relationship_type, relationship_type_extra",
          )
          .eq(profileKey, user.id)
          .maybeSingle(),
        supabase
          .from("profile_photos")
          .select("*")
          .eq("user_id", user.id)
          .order("display_order"),
        supabase.from("personality_results").select("archetype").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profileRes.data) setProfile(profileRes.data as ProfileData);
      if (photosRes.data) setPhotos(photosRes.data.filter((p) => p.storage_path));
      setArchetype(archRes.data?.archetype ?? null);
    } catch (e) {
      if (__DEV__) console.error("[ProfileViewRN]", e);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (photos.length === 0) return;
    setCurrentPhotoIndex((i) => Math.min(i, photos.length - 1));
  }, [photos.length]);

  const getPublicUrl = (path: string) =>
    supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((i) => (i + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
    }
  };

  const archetypeCode = archetype && archetype in ARCHETYPE_INFO ? (archetype as ArchetypeCode) : null;
  const archetypeInfo = archetypeCode ? ARCHETYPE_INFO[archetypeCode] : null;

  if (loading || !user) {
    return (
      <View style={[styles.loadingBox, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
        <Text style={styles.loadingTxt}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.loadingBox, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.loadingTxt}>{t("profile.load_error")}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void fetchData()}>
          <Text style={styles.retryTxt}>{t("common.retry")}</Text>
        </Pressable>
      </View>
    );
  }

  const age = calculateAge(profile.date_of_birth);
  const heightRaw = formatHeightSafe(profile.height);
  const height =
    heightRaw && (heightRaw.endsWith("cm") || heightRaw.includes("cm"))
      ? heightRaw
      : heightRaw
        ? i18n.t("profile.height_value_cm", { value: heightRaw })
        : null;
  const interestsList = parseInterests(profile.interested_in);
  const countryDisplay = profile.country
    ? t(`countries.${profile.country}`, { defaultValue: profile.country })
    : null;
  const locationLabel =
    [profile.hometown, countryDisplay].filter(Boolean).join(", ") || null;

  const cat = archetypeInfo?.category;
  const catStyle = cat ? CATEGORY_CARD[cat] : { bg: maakTokens.muted, border: maakTokens.border };

  const localizedCategoryI18n =
    cat != null
      ? {
          title: t(`personality.guide_category_${cat}_title`, {
            defaultValue: CATEGORY_INFO[cat].title,
          }),
          description: t(`personality.guide_category_${cat}_desc`, {
            defaultValue: CATEGORY_INFO[cat].description,
          }),
        }
      : null;
  const localizedUserArchetype =
    archetypeCode && archetypeInfo
      ? {
          title: t(`personality.archetypes.${archetypeCode}.title`, {
            defaultValue: archetypeInfo.title,
          }),
          description: t(`personality.archetypes.${archetypeCode}.description`, {
            defaultValue: archetypeInfo.description,
          }),
          strengths: (() => {
            const raw = t(`personality.archetypes.${archetypeCode}.strengths`, {
              returnObjects: true,
            });
            return Array.isArray(raw) ? (raw as string[]) : archetypeInfo.strengths;
          })(),
          loveStyle: t(`personality.archetypes.${archetypeCode}.loveStyle`, {
            defaultValue: archetypeInfo.loveStyle,
          }),
        }
      : null;

  const displayName = profile.display_name || t("profile.placeholder_name");
  const nameAgeHeightLine = (() => {
    const bits: string[] = [];
    if (age != null) bits.push(String(age));
    if (height) bits.push(height);
    if (bits.length === 0) return displayName;
    return `${displayName}, ${bits.join(" | ")}`;
  })();

  return (
    <>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + tabBarHeight + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardShell}>
          <View style={[styles.hero, { height: heroH }]}>
            {photos.length > 0 ? (
              <>
                <Image
                  source={{ uri: getPublicUrl(photos[currentPhotoIndex]!.storage_path) }}
                  style={[styles.heroImage, { height: heroH }]}
                  contentFit="cover"
                  contentPosition="top"
                  transition={200}
                />
                {photos.length > 1 ? (
                  <>
                    <Pressable
                      style={styles.tapLeft}
                      onPress={prevPhoto}
                      accessibilityRole="button"
                      accessibilityLabel={t("profile.prev_photo")}
                    />
                    <Pressable
                      style={styles.tapRight}
                      onPress={nextPhoto}
                      accessibilityRole="button"
                      accessibilityLabel={t("profile.next_photo")}
                    />
                  </>
                ) : null}
              </>
            ) : (
              <LinearGradient
                colors={["#C5D9C8", "#E8EDE3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.emptyPhotoInner]}
              >
                <Text style={styles.emptyEmoji}>{archetypeInfo?.emoji ?? "👤"}</Text>
                <Text style={styles.emptyPhotoHint}>{t("profile.no_photos_yet")}</Text>
                <Pressable style={styles.addPhotoBtn} onPress={onEdit}>
                  <Ionicons name="create-outline" size={18} color={maakTokens.primaryForeground} />
                  <Text style={styles.addPhotoBtnTxt}>{t("profile.addPhoto")}</Text>
                </Pressable>
              </LinearGradient>
            )}

            <LinearGradient
              colors={[
                "transparent",
                "rgba(26,26,26,0.2)",
                "rgba(26,26,26,0.72)",
                "#1a1a1a",
              ]}
              locations={[0, 0.52, 0.78, 1]}
              style={styles.heroGradient}
              pointerEvents="none"
            />

            <View style={styles.heroTopBar} pointerEvents="box-none">
              <Pressable
                style={styles.heroIconBtn}
                onPress={onSettings}
                accessibilityLabel={t("settings.title")}
                hitSlop={8}
              >
                <Ionicons name="settings-outline" size={22} color="#fff" />
              </Pressable>
              <Pressable
                style={styles.heroIconBtn}
                onPress={onEdit}
                accessibilityLabel={t("profile.edit_profile")}
                hitSlop={8}
              >
                <Ionicons name="create-outline" size={22} color="#fff" />
              </Pressable>
            </View>

            {photos.length > 1 ? (
              <View style={styles.storySegments} pointerEvents="none">
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.storySeg,
                      i === currentPhotoIndex ? styles.storySegOn : styles.storySegOff,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.profileCard}>
            <View style={styles.glassInner}>
              <View style={styles.glassNameRow}>
                <Text style={styles.glassName} numberOfLines={3}>
                  {nameAgeHeightLine}
                </Text>
                {profile.id_verification_status === "approved" ? (
                  <Ionicons name="shield-checkmark" size={22} color="#fff" />
                ) : null}
              </View>
              {String(profile.instagram ?? "").trim() || String(profile.linkedin ?? "").trim() ? (
                <View style={styles.socialRow}>
                  {String(profile.instagram ?? "").trim() ? (
                    <Pressable
                      style={styles.socialLinkRow}
                      onPress={() =>
                        void Linking.openURL(
                          `https://instagram.com/${getInstagramUsername(String(profile.instagram))}`,
                        )
                      }
                    >
                      <Ionicons name="logo-instagram" size={20} color={SAGE_LINK} />
                      <Text style={styles.glassIg}>
                        {t("profile.fact_instagram")} @{getInstagramUsername(String(profile.instagram))}
                      </Text>
                    </Pressable>
                  ) : null}
                  {String(profile.linkedin ?? "").trim() ? (
                    <Pressable
                      style={styles.socialLinkRow}
                      onPress={() =>
                        void Linking.openURL(
                          `https://linkedin.com/in/${getLinkedInUsername(String(profile.linkedin))}`,
                        )
                      }
                    >
                      <Ionicons name="logo-linkedin" size={20} color={SAGE_LINK} />
                      <Text style={styles.glassIg}>{t("profile.fact_linkedin")}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              {archetypeInfo && cat ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeTxt}>
                    {CATEGORY_BADGE_EMOJI[cat]}{" "}
                    {t(`personality.guide_category_${cat}_title`, {
                      defaultValue: CATEGORY_INFO[cat].title,
                    })}
                  </Text>
                </View>
              ) : null}
              {locationLabel ? (
                <View style={styles.glassLocRow}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.glassLoc}>{locationLabel}</Text>
                </View>
              ) : null}
              {profile.work ? (
                <View style={styles.glassLocRow}>
                  <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.glassWork}>{profile.work}</Text>
                </View>
              ) : null}
              <Pressable
                onPress={onEdit}
                style={({ pressed }) => [styles.primaryBtnWrap, pressed && styles.pressedOpacity]}
              >
                <LinearGradient
                  colors={[maakTokens.gradientPrimary[0], maakTokens.gradientPrimary[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtnGrad}
                >
                  <Ionicons name="create-outline" size={18} color={maakTokens.primaryForeground} />
                  <Text style={styles.primaryBtnTxt}>{t("profile.edit_profile")}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.glassMore} onPress={() => setShowMore(true)}>
                <Ionicons name="chevron-up" size={22} color="rgba(255,255,255,0.85)" />
                <Text style={styles.glassMoreTxt}>{t("profile.show_more")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showMore}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={() => setShowMore(false)}
      >
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <Pressable
            style={styles.modalDismiss}
            onPress={() => setShowMore(false)}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <View style={styles.modalHandleBar} />
            <Ionicons name="chevron-down" size={24} color={maakTokens.mutedForeground} />
          </Pressable>
          <ScrollView
            contentContainerStyle={[styles.modalScroll, { paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>{t("profile.about_me")}</Text>

            <Text style={styles.bioBlock}>
              {profile.bio || t("profile.bio_placeholder")}
            </Text>

            <Text style={styles.sectionTitleSerif}>{t("profile.interests_title")}</Text>
            <View style={styles.chipRow}>
              {interestsList.length > 0 ? (
                interestsList.map((label) => (
                  <View key={label} style={styles.chip}>
                    <Text style={styles.chipTxt}>{label}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.mutedSm}>{t("profile.interests_empty")}</Text>
              )}
            </View>

            {(profile.dating_intention ||
              profile.relationship_type ||
              profile.dating_intention_extra ||
              profile.relationship_type_extra) && (
              <View style={styles.datingBlock}>
                {profile.dating_intention ? (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitleSerif}>{t("profile.dating_intention_title")}</Text>
                    <Text style={styles.bodyStrong}>
                      {t(`profile.dating_${profile.dating_intention}` as "profile.dating_livspartner")}
                    </Text>
                    {profile.dating_intention_extra ? (
                      <Text style={styles.mutedSm}>{profile.dating_intention_extra}</Text>
                    ) : null}
                  </View>
                ) : null}
                {profile.relationship_type ? (
                  <View>
                    <Text style={styles.sectionTitleSerif}>{t("profile.relationship_type_title")}</Text>
                    <Text style={styles.bodyStrong}>
                      {t(`profile.relation_${profile.relationship_type}` as "profile.relation_monogam")}
                    </Text>
                    {profile.relationship_type_extra ? (
                      <Text style={styles.mutedSm}>{profile.relationship_type_extra}</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            )}

            {archetypeInfo && cat ? (
              <View style={styles.personalityBlock}>
                <Text style={styles.sectionTitleGreen}>{t("personality.main_category_label")}</Text>
                <Text style={styles.sectionSub}>{t("personality.main_category_sub")}</Text>
                <View
                  style={[
                    styles.categoryCard,
                    { backgroundColor: catStyle.bg, borderColor: catStyle.border },
                  ]}
                >
                  <Text style={styles.catEmoji}>{CATEGORY_INFO[cat].emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catTitleSerif}>{localizedCategoryI18n?.title}</Text>
                    <Text style={styles.mutedSm}>{localizedCategoryI18n?.description}</Text>
                  </View>
                </View>

                <Text style={[styles.sectionTitleGreen, { marginTop: 20 }]}>
                  {t("personality.four_archetypes_label")}
                </Text>
                <Text style={styles.sectionSub}>{t("personality.four_archetypes_sub")}</Text>
                <Text style={styles.testLine}>
                  {t("personality.test_result_line", {
                    title: localizedUserArchetype?.title,
                    code: archetypeInfo.name,
                    category: localizedCategoryI18n?.title,
                  })}
                </Text>
                <View style={styles.grid2}>
                  {ARCHETYPE_CODES_BY_CATEGORY[cat].map((code) => {
                    const info = ARCHETYPE_INFO[code];
                    const isUser = archetype === code;
                    const gridTitle = t(`personality.archetypes.${code}.title`, {
                      defaultValue: info.title,
                    });
                    return (
                      <View
                        key={code}
                        style={[
                          styles.gridCell,
                          { backgroundColor: catStyle.bg, borderColor: catStyle.border },
                          isUser && { borderColor: GRID_SELECTION_BORDER, borderWidth: 3 },
                        ]}
                      >
                        <Text style={styles.gridEmoji}>{info.emoji}</Text>
                        <Text style={styles.gridTitle} numberOfLines={2}>
                          {gridTitle}
                          {isUser ? (
                            <Text style={styles.gridYour}>
                              {" "}
                              ({t("personality.your_type")})
                            </Text>
                          ) : null}
                        </Text>
                        <Text style={styles.gridCode}>{info.name}</Text>
                      </View>
                    );
                  })}
                </View>

                <Text style={[styles.sectionTitleGreen, { marginTop: 20 }]}>
                  {t("personality.your_archetype_card")}
                </Text>
                <View
                  style={[
                    styles.archetypeCard,
                    { backgroundColor: catStyle.bg, borderColor: catStyle.border },
                  ]}
                >
                  <View style={styles.archetypeHead}>
                    <Text style={styles.bigEmoji}>{archetypeInfo.emoji}</Text>
                    <View>
                      <Text style={styles.archTitleSerif}>{localizedUserArchetype?.title}</Text>
                      <Text style={styles.mutedSm}>{archetypeInfo.name}</Text>
                    </View>
                  </View>
                  <Text style={styles.desc}>{localizedUserArchetype?.description}</Text>
                  <Text style={[styles.sectionTitleGreen, { fontSize: 15, marginTop: 12 }]}>
                    {t("profile.strengths")}
                  </Text>
                  <View style={styles.chipRow}>
                    {(localizedUserArchetype?.strengths ?? []).map((s, i) => (
                      <View key={i} style={styles.strengthPill}>
                        <Text style={styles.strengthPillTxt}>{s}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.relationsBox}>
                    <Text style={styles.relationsTxt}>
                      <Text style={styles.bodyStrong}>{t("profile.in_relationships_label")}</Text>
                      {localizedUserArchetype?.loveStyle}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.factGrid}>
              {profile.work ? (
                <View style={styles.factCell}>
                  <Text style={styles.factLabel}>{t("profile.fact_work")}</Text>
                  <Text style={styles.factVal}>{profile.work}</Text>
                </View>
              ) : null}
              {profile.education ? (
                <View style={styles.factCell}>
                  <Text style={styles.factLabel}>{t("profile.fact_education")}</Text>
                  <Text style={styles.factVal}>{profile.education}</Text>
                </View>
              ) : null}
              {locationLabel ? (
                <View style={styles.factCell}>
                  <Text style={styles.factLabel}>{t("profile.fact_location")}</Text>
                  <Text style={styles.factVal}>{locationLabel}</Text>
                </View>
              ) : null}
              {age != null ? (
                <View style={styles.factCell}>
                  <Text style={styles.factLabel}>{t("profile.fact_age")}</Text>
                  <Text style={styles.factVal}>{t("profile.fact_age_years", { age })}</Text>
                </View>
              ) : null}
              {height ? (
                <View style={styles.factCell}>
                  <Text style={styles.factLabel}>{t("profile.fact_height")}</Text>
                  <Text style={styles.factVal}>{height}</Text>
                </View>
              ) : null}
              {profile.gender ? (
                <View style={styles.factCell}>
                  <Text style={styles.factLabel}>{t("profile.fact_gender")}</Text>
                  <Text style={styles.factVal}>{profile.gender}</Text>
                </View>
              ) : null}
              {String(profile.instagram ?? "").trim() ? (
                <View style={styles.factCell}>
                  <Text style={styles.factLabel}>{t("profile.fact_instagram")}</Text>
                  <Text style={styles.factVal}>
                    @
                    {getInstagramUsername(String(profile.instagram))}
                  </Text>
                </View>
              ) : null}
              {String(profile.linkedin ?? "").trim() ? (
                <View style={styles.factCell}>
                  <Text style={styles.factLabel}>{t("profile.fact_linkedin")}</Text>
                  <Text style={styles.factVal}>{getLinkedInUsername(String(profile.linkedin))}</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={() => {
                setShowMore(false);
                onEdit();
              }}
              style={({ pressed }) => [
                styles.primaryBtnWrap,
                styles.primaryBtnModalTop,
                pressed && styles.pressedOpacity,
              ]}
            >
              <LinearGradient
                colors={[maakTokens.gradientPrimary[0], maakTokens.gradientPrimary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primaryBtnGrad, styles.primaryBtnModalH]}
              >
                <Ionicons name="create-outline" size={20} color={maakTokens.primaryForeground} />
                <Text style={styles.primaryBtnTxt}>{t("profile.edit_profile")}</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pageScroll: { flex: 1, backgroundColor: PAGE_BG },
  loadingBox: { flex: 1, alignItems: "center", backgroundColor: PAGE_BG },
  loadingTxt: { marginTop: 12, color: maakTokens.mutedForeground },
  retryBtn: { marginTop: 16, padding: 12 },
  retryTxt: { color: maakTokens.primary, fontWeight: "600" },
  cardShell: {
    backgroundColor: PAGE_BG,
    overflow: "visible",
  },
  hero: {
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    width: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  tapLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "33.33%",
    zIndex: 10,
  },
  tapRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "33.33%",
    zIndex: 10,
  },
  heroTopBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 20,
  },
  storySegments: {
    position: "absolute",
    bottom: 18,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-end",
    zIndex: 19,
  },
  storySeg: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 3,
    borderRadius: 2,
  },
  storySegOn: { flexGrow: 1.35, minWidth: 28, backgroundColor: "#fff", height: 4 },
  storySegOff: { backgroundColor: "rgba(255,255,255,0.35)" },
  /** Translucent gray glass — matches reference hero controls (not solid white). */
  heroIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.38)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: CHARCOAL_CARD,
    borderTopLeftRadius: maakTokens.radius2xl,
    borderTopRightRadius: maakTokens.radius2xl,
    overflow: "hidden",
    marginTop: -28,
    zIndex: 5,
  },
  glassInner: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20 },
  glassNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  glassName: {
    flex: 1,
    fontFamily: FONT_HEADING,
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 30,
  },
  glassIg: { fontSize: 14, fontWeight: "600", color: SAGE_LINK },
  glassWork: { fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.92)", flex: 1 },
  glassLocRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  glassLoc: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  glassMore: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  glassMoreTxt: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  emptyPhotoInner: { alignItems: "center", justifyContent: "center" },
  emptyEmoji: { fontSize: 64 },
  emptyPhotoHint: { marginTop: 8, fontSize: 14, fontWeight: "600", color: maakTokens.foreground },
  addPhotoBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: maakTokens.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: maakTokens.radiusLg,
  },
  addPhotoBtnTxt: { color: maakTokens.primaryForeground, fontWeight: "600", fontSize: 15 },
  socialRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8 },
  socialLinkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(122, 158, 136, 0.5)",
    backgroundColor: "rgba(30, 50, 38, 0.85)",
  },
  categoryBadgeTxt: { color: SAGE_LINK, fontWeight: "600", fontSize: 12 },
  primaryBtnWrap: {
    marginTop: 14,
    borderRadius: maakTokens.radiusXl,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  primaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  primaryBtnModalH: {
    minHeight: 48,
  },
  primaryBtnModalTop: { marginTop: 8 },
  pressedOpacity: { opacity: 0.92 },
  primaryBtnTxt: { color: maakTokens.primaryForeground, fontSize: 17, fontWeight: "600" },
  ghostMoreTxt: { fontSize: 14, fontWeight: "600", color: "#9a978f" },
  modalRoot: { flex: 1, backgroundColor: "#FAF9F8" },
  modalDismiss: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 4,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: maakTokens.mutedForeground,
    opacity: 0.35,
    marginBottom: 4,
  },
  modalScroll: { paddingHorizontal: 20 },
  modalTitle: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 12,
  },
  bioBlock: {
    fontSize: 15,
    lineHeight: 22,
    color: maakTokens.mutedForeground,
    marginBottom: 20,
  },
  sectionTitleSerif: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 8,
  },
  sectionTitleGreen: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.primary,
    marginBottom: 8,
  },
  sectionSub: { fontSize: 13, color: maakTokens.mutedForeground, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: maakTokens.muted,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  chipTxt: { fontSize: 13, color: maakTokens.foreground },
  mutedSm: { fontSize: 14, color: maakTokens.mutedForeground },
  bodyStrong: { fontSize: 15, fontWeight: "600", color: maakTokens.foreground },
  datingBlock: { marginBottom: 8 },
  personalityBlock: { marginBottom: 8 },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
  },
  catEmoji: { fontSize: 36 },
  catTitleSerif: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  testLine: { fontSize: 14, color: maakTokens.foreground, marginBottom: 12, lineHeight: 20 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCell: {
    width: "47%",
    padding: 10,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
  },
  gridEmoji: { fontSize: 22, marginBottom: 4 },
  gridTitle: { fontSize: 13, fontWeight: "700", color: maakTokens.foreground },
  gridYour: { fontSize: 11, fontWeight: "400", color: maakTokens.mutedForeground },
  gridCode: { fontSize: 11, color: maakTokens.mutedForeground, marginTop: 2 },
  archetypeCard: {
    padding: 14,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
  },
  archetypeHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  bigEmoji: { fontSize: 40 },
  archTitleSerif: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  desc: { fontSize: 14, color: maakTokens.mutedForeground, lineHeight: 20 },
  strengthPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: maakTokens.muted,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  strengthPillTxt: { fontSize: 12, color: maakTokens.foreground, fontWeight: "500" },
  relationsBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: maakTokens.border,
  },
  relationsTxt: { fontSize: 14, color: maakTokens.mutedForeground, lineHeight: 20 },
  factGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  factCell: { width: "47%" },
  factLabel: { fontSize: 11, color: maakTokens.mutedForeground, marginBottom: 4 },
  factVal: { fontSize: 14, fontWeight: "600", color: maakTokens.foreground },
});
