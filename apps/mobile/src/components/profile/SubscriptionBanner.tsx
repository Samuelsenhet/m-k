import { useSubscription } from "@/hooks/useSubscription";
import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Compact upgrade banner shown on the profile view for free/basic users.
 * Placement: between "Edit profile" and "Visa mer" in ProfileViewRN.
 * Inspired by Tinder Gold / Bumble Premium profile banners.
 *
 * Hidden for Premium users.
 */
export function SubscriptionBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tier, isPremium } = useSubscription();

  // Already on highest tier - hide banner
  if (isPremium) return null;

  const isBasic = tier === "basic";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/paywall" })}
      accessibilityRole="button"
      accessibilityLabel={
        isBasic
          ? t("mobile.paywall.banner_upgrade_premium")
          : t("mobile.paywall.banner_upgrade")
      }
      style={styles.wrap}
    >
      <LinearGradient
        colors={["#3D5A3E", "#5A8C5E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="star" size={18} color="#E8C547" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>
            {isBasic
              ? t("mobile.paywall.banner_upgrade_premium")
              : t("mobile.paywall.banner_upgrade")}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {isBasic
              ? t("mobile.paywall.banner_sub_premium")
              : t("mobile.paywall.banner_sub_free")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, marginBottom: 4 },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: maakTokens.radiusLg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  sub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
});
