import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  /** Visual density. Inline = profile row, Card = big reveal, Compact = list thumbnail corner */
  variant?: "inline" | "card" | "compact";
};

/**
 * Värd-badge - shown on profile rows / cards when the user is an active host.
 *
 * Not a generic "verified" badge - the crown icon + Värd label is specifically
 * about the hosts program. For verified-profile indicators, use the existing
 * VerifiedBadge component.
 */
export function HostBadge({ variant = "inline" }: Props) {
  const { t } = useTranslation();
  const label = t("host.badge.label", { defaultValue: "Värd" });

  if (variant === "compact") {
    return (
      <View style={[styles.base, styles.compact]}>
        <Ionicons name="star" size={10} color="#FFFFFF" />
      </View>
    );
  }

  if (variant === "card") {
    return (
      <View style={[styles.base, styles.card]}>
        <Ionicons name="star" size={14} color={maakTokens.primary} />
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.base, styles.inline]}>
      <Ionicons name="star" size={11} color={maakTokens.primary} />
      <Text style={styles.inlineLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  inline: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#D9EDE4",
    borderWidth: 1,
    borderColor: "rgba(75, 110, 72, 0.15)",
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: maakTokens.primary,
    letterSpacing: 0.2,
  },
  card: {
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#D9EDE4",
    borderWidth: 1,
    borderColor: "rgba(75, 110, 72, 0.2)",
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: maakTokens.primary,
    letterSpacing: 0.3,
  },
  compact: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: maakTokens.primary,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
});
