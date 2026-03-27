import { useSupabase } from "@/contexts/SupabaseProvider";
import { archetypeDisplayTitle } from "@/lib/archetypeTitle";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProfileRow = {
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  hometown: string | null;
  work: string | null;
  height: string | null;
};

type PhotoRow = { storage_path: string; display_order: number };

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

export function MatchProfileScreen({
  userId,
  matchScore,
  personalityInsight,
  showLikePass,
  onBack,
  onChat,
  onLike,
  onPass,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [archetype, setArchetype] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, userId);
      const [profileRes, photosRes, archRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, bio, date_of_birth, hometown, work, height")
          .eq(profileKey, userId)
          .maybeSingle(),
        supabase
          .from("profile_photos")
          .select("storage_path, display_order")
          .eq("user_id", userId)
          .order("display_order"),
        supabase.from("personality_results").select("archetype").eq("user_id", userId).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data as ProfileRow);
      if (photosRes.data?.length) {
        setPhotos(photosRes.data.filter((p) => p.storage_path) as PhotoRow[]);
      } else setPhotos([]);
      if (archRes.data?.archetype) setArchetype(archRes.data.archetype);
    } catch (e) {
      if (__DEV__) console.error("[MatchProfileScreen]", e);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const getPublicUrl = (path: string) =>
    supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;

  const name = profile?.display_name ?? t("common.user");
  const age = ageFromDob(profile?.date_of_birth ?? null);
  const currentPhoto = photos[photoIndex];
  const archetypeLabel = archetypeDisplayTitle(archetype, t);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.topBtn}>
          <Text style={styles.topBack}>← {t("common.back")}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero}>
          {currentPhoto ? (
            <Image
              source={{ uri: getPublicUrl(currentPhoto.storage_path) }}
              style={styles.heroImg}
              contentFit="cover"
              contentPosition="top"
            />
          ) : (
            <View style={styles.heroPh}>
              <Text style={styles.heroPhTxt}>{name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
          {photos.length > 1 ? (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <Pressable key={i} onPress={() => setPhotoIndex(i)}>
                  <View style={[styles.dot, i === photoIndex && styles.dotOn]} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={styles.name}>
          {name}
          {age != null ? `, ${age}` : ""}
        </Text>
        {archetypeLabel ? <Text style={styles.arch}>{archetypeLabel}</Text> : null}
        {matchScore != null ? (
          <Text style={styles.score}>{t("matches.matchScore", { score: Math.round(matchScore) })}</Text>
        ) : null}
        {personalityInsight ? (
          <View style={styles.insightBox}>
            <Text style={styles.insightTitle}>{t("chat.why_you_matched")}</Text>
            <Text style={styles.insight}>{personalityInsight}</Text>
          </View>
        ) : null}

        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.meta}>
          {profile?.hometown ? (
            <Text style={styles.metaLine}>📍 {profile.hometown}</Text>
          ) : null}
          {profile?.work ? <Text style={styles.metaLine}>💼 {profile.work}</Text> : null}
          {profile?.height ? (
            <Text style={styles.metaLine}>
              📏 {t("profile.height_value_cm", { value: profile.height })}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {showLikePass && onPass && onLike ? (
            <View style={styles.rowBtns}>
              <Pressable style={styles.passBtn} onPress={onPass}>
                <Text style={styles.passTxt}>{t("matches.pass")}</Text>
              </Pressable>
              <Pressable style={styles.likeBtn} onPress={onLike}>
                <Text style={styles.likeTxt}>{t("matches.like")}</Text>
              </Pressable>
            </View>
          ) : null}
          {onChat ? (
            <Pressable style={styles.chatBtn} onPress={onChat}>
              <Text style={styles.chatTxt}>{t("chat.chatWith")}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { paddingHorizontal: 12, paddingBottom: 8 },
  topBtn: { alignSelf: "flex-start" },
  topBack: { fontSize: 16, fontWeight: "600", color: maakTokens.primary },
  scroll: { paddingHorizontal: maakTokens.screenPaddingHorizontal },
  hero: { marginBottom: 16 },
  heroImg: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: maakTokens.radiusXl,
    backgroundColor: maakTokens.muted,
  },
  heroPh: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: maakTokens.radiusXl,
    backgroundColor: maakTokens.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPhTxt: { fontSize: 48, fontWeight: "700", color: maakTokens.primary },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: maakTokens.border },
  dotOn: { backgroundColor: maakTokens.primary },
  name: { fontSize: 24, fontWeight: "700", color: maakTokens.foreground },
  arch: { fontSize: 14, color: maakTokens.mutedForeground, marginTop: 4 },
  score: { fontSize: 16, fontWeight: "600", color: maakTokens.primary, marginTop: 8 },
  insightBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: maakTokens.radiusLg,
    backgroundColor: maakTokens.card,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: maakTokens.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  insight: { fontSize: 15, lineHeight: 22, color: maakTokens.foreground },
  bio: { fontSize: 15, lineHeight: 22, color: maakTokens.mutedForeground, marginTop: 12 },
  meta: { marginTop: 12, gap: 6 },
  metaLine: { fontSize: 14, color: maakTokens.mutedForeground },
  actions: { marginTop: 24, gap: 12 },
  rowBtns: { flexDirection: "row", gap: 12 },
  passBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    alignItems: "center",
  },
  passTxt: { fontWeight: "600", color: maakTokens.mutedForeground },
  likeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    backgroundColor: `${maakTokens.primary}22`,
    alignItems: "center",
  },
  likeTxt: { fontWeight: "700", color: maakTokens.primary },
  chatBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  chatTxt: { fontWeight: "700", color: maakTokens.primaryForeground, fontSize: 16 },
});
