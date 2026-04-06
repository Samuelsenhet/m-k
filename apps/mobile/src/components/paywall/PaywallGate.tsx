import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  titleKey: string;
  bodyKey: string;
  bullets?: string[];
};

/**
 * Full-screen gate shown when a free-tier user tries to access a paid feature.
 * Rendered in place of the gated screen's content. Upgrade CTA → /paywall.
 */
export function PaywallGate({ titleKey, bodyKey, bullets }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={32} color={maakTokens.primary} />
      </View>
      <Text style={styles.title}>{t(titleKey)}</Text>
      <Text style={styles.body}>{t(bodyKey)}</Text>

      {bullets && bullets.length > 0 ? (
        <View style={styles.bullets}>
          {bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={18} color={maakTokens.primary} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        style={styles.cta}
        onPress={() => router.push({ pathname: "/paywall" })}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>{t("mobile.paywall.gate_cta")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: maakTokens.background,
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    paddingTop: 48,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${maakTokens.primary}1A`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 360,
  },
  bullets: {
    alignSelf: "stretch",
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 18,
    marginBottom: 24,
    gap: 10,
  },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bulletText: { fontSize: 14, color: maakTokens.foreground, flex: 1 },
  cta: {
    alignSelf: "stretch",
    backgroundColor: maakTokens.primary,
    borderRadius: maakTokens.radius2xl,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: {
    color: maakTokens.primaryForeground,
    fontSize: 16,
    fontWeight: "700",
  },
});
