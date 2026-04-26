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

import { MatchTypeBadge } from "./MatchTypeBadge";

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

/**
 * Monster Match v1 hero card. Replaces MatchListCard for the daily-match
 * feed. Photo fills the card; the LLM-voice match_story is the primary
 * text; archetype + score + subtype-coloured badge sit underneath; pass
 * and chat actions are pinned to the bottom.
 *
 * Story falls back to personalityInsight (legacy) when match_story is
 * missing — keeps render safe for pre-Monster pool rows still in transit.
 */
export const MatchStoryCard = React.memo(function MatchStoryCard({
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
  const story = match.matchStory ?? match.personalityInsight ?? null;

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

      {mutual ? (
        <View style={styles.mutualBadge}>
          <Ionicons name="heart" size={14} color={maakTokens.primaryForeground} />
          <Text style={styles.mutualText}>{t("matches.mutual_label", { defaultValue: "Mutual" })}</Text>
        </View>
      ) : null}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.20)", "rgba(0,0,0,0.78)", "rgba(0,0,0,0.94)"]}
        locations={[0, 0.32, 0.7, 1]}
        style={styles.gradient}
        pointerEvents="box-none"
      >
        <View style={styles.info}>
          <View style={styles.topMeta}>
            <Text style={styles.name} numberOfLines={1}>
              {match.matchedUser.displayName ?? t("matches.anonymous")}
            </Text>
            <MatchTypeBadge subtype={match.matchSubtype} variant="translucent" size="sm" />
          </View>

          {story ? (
            <Text style={styles.story} numberOfLines={3}>
              {story}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            {archLabel ? <Text style={styles.metaText}>{archLabel}</Text> : null}
            {archLabel ? <Text style={styles.metaDot}>·</Text> : null}
            <Text style={styles.metaText}>{Math.round(match.matchScore)}%</Text>
            {match.interests.length > 0 ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {match.interests.slice(0, 3).join(", ")}
                </Text>
              </>
            ) : null}
          </View>

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
    gap: 10,
  },
  topMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  story: {
    fontSize: 16,
    lineHeight: 22,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  metaDot: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
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
