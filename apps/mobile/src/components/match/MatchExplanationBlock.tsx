import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import type { MatchSubtype } from "@/types/api";
import { MatchTypeBadge } from "./MatchTypeBadge";

/**
 * "Varför ni passar" detail-section. Renders the LLM-voice match story,
 * subtype tagline, and (when relevant) a small notice that this match
 * shipped without an LLM call (template fallback path in match_story_cache).
 */
type Props = {
  subtype: MatchSubtype;
  story: string | null | undefined;
  fallbackUsed?: boolean;
};

export function MatchExplanationBlock({ subtype, story, fallbackUsed }: Props) {
  const { t } = useTranslation();
  if (!story) return null;

  const taglineKey = `matches.type_${subtype}_tagline` as const;

  return (
    <View style={styles.block}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t("matches.section_why_you")}</Text>
        <MatchTypeBadge subtype={subtype} variant="solid" size="sm" />
      </View>
      <Text style={styles.tagline}>{t(taglineKey)}</Text>
      <Text style={styles.story}>{story}</Text>
      {fallbackUsed ? (
        <View style={styles.fallbackPill}>
          <Ionicons name="information-circle-outline" size={14} color={maakTokens.mutedForeground} />
          <Text style={styles.fallbackText}>{t("matches.fallback_notice")}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
    flexShrink: 1,
  },
  tagline: {
    fontSize: 13,
    color: maakTokens.mutedForeground,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  story: {
    fontSize: 16,
    lineHeight: 24,
    color: maakTokens.foreground,
    marginTop: 4,
  },
  fallbackPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: maakTokens.muted,
    alignSelf: "flex-start",
    borderRadius: 999,
  },
  fallbackText: {
    fontSize: 12,
    color: maakTokens.mutedForeground,
  },
});
