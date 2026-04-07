import type { Match } from "@/hooks/useMatches";
import { archetypeDisplayTitle } from "@/lib/archetypeTitle";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

function resolvePhotoUri(
  photos: string[] | undefined,
  getPublicUrl: (path: string) => string,
): string | null {
  const p = photos?.[0];
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  return getPublicUrl(p);
}

type Props = {
  match: Match;
  getPublicUrl: (path: string) => string;
  onChat: () => void;
  onViewProfile: () => void;
  onPass?: () => void;
  mutual?: boolean;
};

export const MatchListCard = React.memo(function MatchListCard({
  match,
  getPublicUrl,
  onChat,
  onViewProfile,
  onPass,
  mutual = false,
}: Props) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const uri = resolvePhotoUri(match.matchedUser.photos, getPublicUrl);
  const initials = (match.matchedUser.displayName ?? "?").slice(0, 2).toUpperCase();
  const archLabel = archetypeDisplayTitle(match.matchedUser.archetype ?? null, t);
  const cardHeight = Math.round((screenWidth - maakTokens.screenPaddingHorizontal * 2) * 1.35);

  return (
    <Pressable onPress={onViewProfile} style={[styles.card, { height: cardHeight }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top"
          cachePolicy="disk"
          transition={200}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={styles.placeholderText}>{initials}</Text>
        </View>
      )}

      {mutual ? <View style={styles.mutualBadge}>
        <Ionicons name="heart" size={14} color={maakTokens.primaryForeground} />
        <Text style={styles.mutualText}>{t("matches.mutual_label", { defaultValue: "Mutual" })}</Text>
      </View> : null}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.88)"]}
        locations={[0, 0.4, 0.72, 1]}
        style={styles.gradient}
        pointerEvents="box-none"
      >
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {match.matchedUser.displayName ?? t("matches.anonymous")}
          </Text>

          <View style={styles.detailRow}>
            {archLabel ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{archLabel}</Text>
              </View>
            ) : null}
            <View style={styles.chip}>
              <Text style={styles.chipText}>{Math.round(match.matchScore)}%</Text>
            </View>
            <View style={[styles.chip, match.matchType === "similar" ? styles.chipSimilar : styles.chipComplementary]}>
              <Text style={styles.chipText}>
                {match.matchType === "similar" ? t("matches.similar") : t("matches.complementary")}
              </Text>
            </View>
          </View>

          {match.interests && match.interests.length > 0 ? (
            <View style={styles.interestRow}>
              {match.interests.slice(0, 3).map((interest) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            {onPass ? (
              <Pressable
                style={styles.passBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  onPass();
                }}
                hitSlop={4}
              >
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.chatBtn, mutual && styles.chatBtnMutual]}
              onPress={(e) => {
                e.stopPropagation();
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onChat();
              }}
              hitSlop={4}
            >
              <Ionicons name="chatbubble" size={18} color={maakTokens.primaryForeground} />
              <Text style={styles.chatText}>{t("matches.open_chat")}</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: maakTokens.radius2xl,
    overflow: "hidden",
    backgroundColor: maakTokens.muted,
  },
  placeholder: {
    backgroundColor: maakTokens.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "700",
    color: maakTokens.primary,
    opacity: 0.5,
  },
  mutualBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: maakTokens.coral,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  mutualText: {
    fontSize: 12,
    fontWeight: "700",
    color: maakTokens.primaryForeground,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  info: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  chipSimilar: {
    backgroundColor: `${maakTokens.primary}44`,
    borderColor: `${maakTokens.primary}66`,
  },
  chipComplementary: {
    backgroundColor: `${maakTokens.coral}44`,
    borderColor: `${maakTokens.coral}66`,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  interestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  interestChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  interestText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  passBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 22,
    backgroundColor: maakTokens.primary,
  },
  chatBtnMutual: {
    backgroundColor: maakTokens.coral,
  },
  chatText: {
    fontSize: 15,
    fontWeight: "700",
    color: maakTokens.primaryForeground,
  },
});
