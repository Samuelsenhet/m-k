import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { DimensionBreakdownEntry } from "@/types/api";

/**
 * Renders the legacy `dimension_score_breakdown` shape returned by match-daily
 * (one row per top-3 dimension): name, an alignment icon (high/medium/low
 * impact), and a one-sentence description. The richer LLM "voice" prose
 * lives in match_story (rendered by MatchExplanationBlock above this list).
 */
type Props = {
  items: DimensionBreakdownEntry[];
};

const DIM_LABEL_SV: Record<string, string> = {
  ei: "Energi",
  sn: "Informationsstil",
  tf: "Värderingar",
  jp: "Beslutsstil",
  at: "Stress / lugn",
  personality: "Personlighet",
  archetype: "Arketyp",
  interests: "Intressen",
};

const ALIGNMENT_ICON: Record<DimensionBreakdownEntry["alignment"], keyof typeof Ionicons.glyphMap> = {
  high: "heart",
  medium: "swap-horizontal",
  low: "compass",
};

const ALIGNMENT_COLOR: Record<DimensionBreakdownEntry["alignment"], string> = {
  high: maakTokens.primary,
  medium: maakTokens.sage,
  low: maakTokens.coral,
};

export function DimensionBreakdownList({ items }: Props) {
  if (!items?.length) return null;
  return (
    <View style={styles.list}>
      {items.map((item, idx) => {
        const label = DIM_LABEL_SV[item.dimension] ?? item.dimension;
        return (
          <View key={`${item.dimension}-${idx}`} style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: `${ALIGNMENT_COLOR[item.alignment]}20` }]}>
              <Ionicons
                name={ALIGNMENT_ICON[item.alignment]}
                size={18}
                color={ALIGNMENT_COLOR[item.alignment]}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 2,
  },
  desc: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    lineHeight: 20,
  },
});
