import { Emoji } from "@/components/Emoji";
import { ProfileDetailsModal } from "@/components/profile/ProfileDetailsModal";
import { SubscriptionBanner } from "@/components/profile/SubscriptionBanner";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { i18n } from "@/lib/i18n";
import { getInstagramUsername, getLinkedInUsername } from "@/lib/socialUsernames";
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

// Try to load expo-video — fails gracefully if native module is absent.
let useVideoPlayer: any = null;
let VideoView: any = null;
let hasExpoVideo = false;
try {
  const mod = require("expo-video");
  // Verify the module actually works by checking for the hook
  if (typeof mod.useVideoPlayer === "function") {
    useVideoPlayer = mod.useVideoPlayer;
    VideoView = mod.VideoView;
    hasExpoVideo = true;
  }
} catch {
  // expo-video not available
}
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useCallback, useContext, useEffect, useRef, useState, type Context } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Max hero height (px); actual height scales with window so “Visa mer” fits on smaller phones. */
const HERO_H_MAX = 512;
/** Negative margin pulls card onto hero; larger = more photo visible above card. */
const PROFILE_CARD_OVERLAP_DOWN = 152;
/**
 * Inset above the **visual card lip** (photo → rounded card). Same 24px as web `bottom-6`, but on
 * mobile the card overlaps the hero heavily (`PROFILE_CARD_OVERLAP_DOWN`), so we must not anchor to
 * the hero layout bottom — that would paint dots mid-card (see layout vs web `-mt-7`).
 */
const STORY_INDICATORS_ABOVE_CARD = 24;
/** Height of the absolute strip that contains the segment row (active bar is 4px tall). */
const STORY_SEGMENTS_STRIP_H = 12;
/** Match web Profile page shell (`bg-black` + dark card). */
const PAGE_BG = "#000000";
/** Loaded in root `_layout.tsx` via `@expo-google-fonts/playfair-display`. */
const FONT_HEADING = "PlayfairDisplay_700Bold";
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
  media_type?: string;
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

/** Loading state while video URL resolves or video buffers. */
function HeroVideoLoading() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.videoFallback]}>
      <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
    </View>
  );
}

/** Fallback when native video is unavailable or errored. */
function HeroVideoFallback() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.videoFallback]}>
      <Ionicons name="videocam" size={48} color="rgba(255,255,255,0.7)" />
    </View>
  );
}

/** Auto-playing muted looping video. Only rendered when expo-video is available. */
function HeroVideoPlayer({ uri }: { uri: string }) {
  const [error, setError] = useState(false);
  const player = useVideoPlayer(uri, (p: any) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("statusChange", (status: any) => {
      if (status.error) {
        if (__DEV__) console.warn("[HeroVideoPlayer] playback error:", status.error);
        setError(true);
      }
    });
    return () => sub?.remove?.();
  }, [player]);

  if (error) return <HeroVideoFallback />;

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

/** Renders video player with a pre-resolved URL. Shows spinner if URL not yet cached. */
function HeroVideo({ uri }: { uri: string | null }) {
  if (!hasExpoVideo) return <HeroVideoFallback />;
  if (!uri) return <HeroVideoLoading />;
  return <HeroVideoPlayer uri={uri} />;
}

export function ProfileViewRN({ onEdit, onSettings }: ProfileViewRNProps) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** Custom `MaakTabBar` / Expo Tabs can leave context unset; hook throws — use context + fallback. */
  const tabBarHeightCtx = BottomTabBarHeightContext as Context<number | undefined>;
  const tabBarHeight =
    useContext(tabBarHeightCtx) ?? (Platform.OS === "ios" ? 62 : 56);
  /** Height available above tab bar (tab scene). Hero fills this so more photo shows above the overlay card. */
  const availableH = windowHeight - insets.top - insets.bottom - tabBarHeight;
  /** Minimum photo strip height; hero also uses flex:1 so it grows and eats “dead” space above the tab bar. */
  const heroMinH = Math.max(260, Math.min(HERO_H_MAX, Math.round(availableH * 0.38)));
  const { supabase, session } = useSupabase();
  const user = session?.user;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  /** Pre-resolved signed URLs for video slots — keyed by storage_path. */
  const videoUrlCache = useRef<Map<string, string>>(new Map());
  /** Hero frame in pageRoot coords — dots are a sibling overlay so they aren’t covered by the card. */
  const [heroLayout, setHeroLayout] = useState<{ y: number; height: number }>({ y: 0, height: 0 });

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
          .select("id, storage_path, display_order, media_type")
          .eq("user_id", user.id)
          .order("display_order"),
        supabase.from("personality_results").select("archetype").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profileRes.data) setProfile(profileRes.data as ProfileData);
      const validPhotos = photosRes.data?.filter((p) => p.storage_path) ?? [];
      if (validPhotos.length > 0) setPhotos(validPhotos);
      setArchetype(archRes.data?.archetype ?? null);

      // Preload signed URLs for all video slots so carousel transitions are instant.
      const videoSlots = validPhotos.filter((p) => p.media_type === "video");
      if (videoSlots.length > 0) {
        const results = await Promise.allSettled(
          videoSlots.map(async (slot) => {
            const { data, error } = await supabase.storage
              .from("profile-photos")
              .createSignedUrl(slot.storage_path, 3600);
            return {
              path: slot.storage_path,
              url: error ? getPublicUrl(slot.storage_path) : data.signedUrl,
            };
          }),
        );
        for (const r of results) {
          if (r.status === "fulfilled") {
            videoUrlCache.current.set(r.value.path, r.value.url);
          }
        }
      }
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

  const displayName = profile.display_name || t("profile.placeholder_name");
  const nameAgeHeightLine = (() => {
    const bits: string[] = [];
    if (age != null) bits.push(String(age));
    if (height) bits.push(height);
    if (bits.length === 0) return displayName;
    return `${displayName}, ${bits.join(" | ")}`;
  })();

  /** Until `onLayout` runs, use `heroMinH` so dots still render (web parity; avoids empty overlay). */
  const heroBottomY =
    heroLayout.height > 0
      ? heroLayout.y + heroLayout.height
      : heroLayout.y + heroMinH;

  // Resolve the active photo in a bounds-safe way. If a background refetch
  // shrinks `photos` before the clamp effect runs, `currentPhotoIndex` can
  // briefly point past the end of the array for a single render — optional
  // chaining here prevents a crash during that window.
  const safePhotoIdx =
    photos.length > 0 ? Math.min(currentPhotoIndex, photos.length - 1) : -1;
  const currentPhoto = safePhotoIdx >= 0 ? photos[safePhotoIdx] : null;

  return (
    <>
      <View style={[styles.pageRoot, { paddingTop: insets.top }]}>
        <View
          collapsable={false}
          style={[styles.hero, { flex: 1, minHeight: heroMinH }]}
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            setHeroLayout({ y, height });
          }}
        >
            {currentPhoto ? (
              <>
                {currentPhoto.media_type === "video" ? (
                  <HeroVideo uri={videoUrlCache.current.get(currentPhoto.storage_path) ?? null} />
                ) : (
                  <Image
                    source={{ uri: getPublicUrl(currentPhoto.storage_path) }}
                    style={styles.heroImageFill}
                    contentFit="cover"
                    contentPosition={{ top: "22%", left: "50%" }}
                    transition={200}
                  />
                )}
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
                <Emoji style={styles.emptyEmoji}>{archetypeInfo?.emoji ?? "👤"}</Emoji>
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
        </View>

        <View
          style={[
            styles.profileCardFlow,
            { marginTop: -PROFILE_CARD_OVERLAP_DOWN },
          ]}
        >
            <View style={styles.glassInner}>
              <View style={styles.glassInnerTop}>
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
                    <Emoji>{CATEGORY_BADGE_EMOJI[cat]}</Emoji>{" "}
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
              <SubscriptionBanner />
              <Pressable style={styles.glassMore} onPress={() => setShowMore(true)}>
                <Ionicons name="chevron-down" size={22} color="rgba(255,255,255,0.85)" />
                <Text style={styles.glassMoreTxt}>{t("profile.show_more")}</Text>
              </Pressable>
              </View>
            </View>
        </View>

        {photos.length > 1 ? (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.storySegmentsOverlay,
              {
                /* Just above rounded card: seam ≈ hero bottom − overlap; then −24px like web bottom-6. */
                top: Math.max(
                  0,
                  Math.round(
                    heroBottomY -
                      PROFILE_CARD_OVERLAP_DOWN -
                      STORY_INDICATORS_ABOVE_CARD -
                      STORY_SEGMENTS_STRIP_H,
                  ),
                ),
              },
            ]}
          >
            <View style={styles.storySegmentsRow}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={i === currentPhotoIndex ? styles.storySegActive : styles.storySegInactive}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <ProfileDetailsModal
        visible={showMore}
        onClose={() => setShowMore(false)}
        onEdit={onEdit}
        profile={profile}
        archetypeCode={archetypeCode}
        interestsList={interestsList}
        formattedHeight={height}
        age={age}
        locationLabel={locationLabel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: CHARCOAL_CARD,
    position: "relative",
    overflow: "visible",
  },
  loadingBox: { flex: 1, alignItems: "center", backgroundColor: PAGE_BG },
  loadingTxt: { marginTop: 12, color: maakTokens.mutedForeground },
  retryBtn: { marginTop: 16, padding: 12 },
  retryTxt: { color: maakTokens.primary, fontWeight: "600" },
  hero: {
    overflow: "hidden",
    position: "relative",
  },
  heroImageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  videoFallback: {
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  videoFallbackText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: 6,
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
  /** Above profile card (sibling); web-equivalent `bottom-6` on hero via measured `top`. */
  storySegmentsOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    height: STORY_SEGMENTS_STRIP_H,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    ...Platform.select({
      /** Must exceed `profileCardFlow` elevation so dots paint above the dark card on Android. */
      android: { elevation: 24 },
      ios: {},
    }),
  },
  storySegmentsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  /** Active: `h-1 w-7 bg-white` */
  storySegActive: {
    width: 28,
    height: 4,
    borderRadius: 9999,
    backgroundColor: "#fff",
  },
  /** Inactive: `h-1.5 w-1.5 bg-white/45 rounded-full` */
  storySegInactive: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
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
  /** Hug-content height; flexShrink 0 so expanding hero does not squash the card. */
  profileCardFlow: {
    flexShrink: 0,
    backgroundColor: CHARCOAL_CARD,
    borderTopLeftRadius: maakTokens.radius2xl,
    borderTopRightRadius: maakTokens.radius2xl,
    overflow: "hidden",
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: { elevation: 12 },
    }),
  },
  glassInner: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  glassInnerTop: { flexShrink: 0 },
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
  glassWork: { fontSize: 13, color: "rgba(255,255,255,0.85)", flex: 1 },
  glassLocRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  glassLoc: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  glassMore: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryBtnModalH: {
    minHeight: 48,
  },
  primaryBtnModalTop: { marginTop: 8 },
  pressedOpacity: { opacity: 0.92 },
  primaryBtnTxt: { color: maakTokens.primaryForeground, fontSize: 17, fontWeight: "600" },
  ghostMoreTxt: { fontSize: 14, fontWeight: "600", color: "#9a978f" },
});
