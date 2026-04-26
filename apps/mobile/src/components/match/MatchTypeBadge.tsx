import { maakTokens } from "@maak/core";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import type { MatchSubtype } from "@/types/api";

/**
 * Subtype color palette per spec section "iOS-UI-förändringar":
 *   similar       → sage  (likeness)
 *   complementary → primary forest green (golden complementary)
 *   growth        → gold  (Upptäckare category color, #F9BC06 ≈ HSL(45,95,50))
 *
 * The gold value is hardcoded rather than added to maakTokens — it's only
 * used here, and the rest of the app doesn't yet have a "category accent"
 * token system.
 */
const SUBTYPE_COLORS: Record<MatchSubtype, { fg: string; bg: string; border: string }> = {
  similar: {
    fg: "#FFFFFF",
    bg: maakTokens.sage,
    border: maakTokens.sage,
  },
  complementary: {
    fg: maakTokens.primaryForeground,
    bg: maakTokens.primary,
    border: maakTokens.primary,
  },
  growth: {
    fg: "#3A2C00",
    bg: "#F9BC06",
    border: "#D9A300",
  },
};

type Variant = "solid" | "translucent";

type Props = {
  subtype: MatchSubtype;
  /** "translucent" suits dark photo overlays (e.g. inside MatchStoryCard). */
  variant?: Variant;
  size?: "sm" | "md";
};

export function MatchTypeBadge({ subtype, variant = "solid", size = "md" }: Props) {
  const { t } = useTranslation();
  const colors = SUBTYPE_COLORS[subtype];
  const label = t(`matches.${subtype}`, {
    defaultValue:
      subtype === "growth" ? "Växande" : subtype === "complementary" ? "Kompletterande" : "Liknande",
  });

  const isTranslucent = variant === "translucent";
  const style = [
    styles.badge,
    size === "sm" ? styles.sm : styles.md,
    {
      backgroundColor: isTranslucent ? `${colors.bg}55` : colors.bg,
      borderColor: isTranslucent ? `${colors.bg}AA` : colors.border,
    },
  ];

  return (
    <View style={style}>
      <Text
        style={[
          styles.text,
          size === "sm" ? styles.textSm : styles.textMd,
          { color: isTranslucent ? "#FFFFFF" : colors.fg },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sm: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  textMd: {
    fontSize: 13,
  },
  textSm: {
    fontSize: 12,
  },
});
