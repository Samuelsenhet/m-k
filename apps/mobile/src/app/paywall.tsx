import { usePurchases } from "@/contexts/PurchasesProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { MascotAssets } from "@/lib/mascotAssets";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

// ─── Feature row data (MÄÄK-aligned) ────────────────────────────────
type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descKey: string;
};

const FEATURES: Feature[] = [
  { icon: "people-outline",        titleKey: "mobile.paywall.feat_groups_title",      descKey: "mobile.paywall.feat_groups_desc" },
  { icon: "sparkles-outline",      titleKey: "mobile.paywall.feat_icebreakers_title", descKey: "mobile.paywall.feat_icebreakers_desc" },
  { icon: "calendar-outline",      titleKey: "mobile.paywall.feat_sunday_title",      descKey: "mobile.paywall.feat_sunday_desc" },
  { icon: "heart-outline",         titleKey: "mobile.paywall.feat_matches_title",     descKey: "mobile.paywall.feat_matches_desc" },
  { icon: "options-outline",       titleKey: "mobile.paywall.feat_filters_title",     descKey: "mobile.paywall.feat_filters_desc" },
  { icon: "mail-open-outline",     titleKey: "mobile.paywall.feat_receipts_title",    descKey: "mobile.paywall.feat_receipts_desc" },
];

type TierKey = "basic" | "premium";

// ─── Screen ─────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshSubscription } = useSubscription();
  const { configured, offering, purchasePackage, restorePurchases } = usePurchases();
  const posthog = usePostHog();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<TierKey>("premium");

  useEffect(() => {
    posthog.capture('paywall_viewed');
  }, []);

  const handleSubscribe = async () => {
    if (!configured || !offering) {
      Alert.alert(t("mobile.paywall.not_configured_title"), t("mobile.paywall.not_configured_body"));
      return;
    }

    // Map tier to RC package: premium → annual (save badge), basic → monthly
    const pkg =
      selected === "premium"
        ? (offering.annual ?? offering.monthly)
        : (offering.monthly ?? offering.weekly);

    if (!pkg) {
      Alert.alert(t("mobile.paywall.not_configured_title"), t("mobile.paywall.not_configured_body"));
      return;
    }

    posthog.capture('subscription_purchase_initiated', { tier: selected });
    setBusy(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.success) {
        posthog.capture('subscription_purchased', { tier: selected });
        await refreshSubscription();
        router.back();
      } else if (!result.cancelled) {
        Alert.alert(
          t("mobile.paywall.error_title", { defaultValue: "Något gick fel" }),
          result.error?.message ?? t("mobile.paywall.error_body", { defaultValue: "Försök igen senare." }),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!configured) {
      Alert.alert(t("mobile.paywall.not_configured_title"), t("mobile.paywall.not_configured_body"));
      return;
    }
    posthog.capture('subscription_restore_initiated');
    setBusy(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        await refreshSubscription();
        Alert.alert(
          t("mobile.paywall.restore_success_title", { defaultValue: "Återställt" }),
          t("mobile.paywall.restore_success_body", { defaultValue: "Ditt köp har återställts." }),
        );
        router.back();
      } else {
        Alert.alert(
          t("mobile.paywall.restore_empty_title"),
          result.error?.message ?? t("mobile.paywall.restore_empty_body", { defaultValue: "Inga tidigare köp hittades." }),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        bounces={false}
      >
        {/* ── Gradient hero with mascot ───────────────────── */}
        <LinearGradient
          colors={["#D6E4D9", maakTokens.background]}
          style={[styles.heroGradient, { paddingTop: insets.top + 12 }]}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={26} color={maakTokens.foreground} />
          </Pressable>

          <Image
            source={MascotAssets.encouraging}
            style={styles.mascot}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.heroTitle}>{t("mobile.paywall.hero_title")}</Text>
          <Text style={styles.heroSubtitle}>{t("mobile.paywall.hero_subtitle")}</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* ── Tier cards ────────────────────────────────── */}
          <TierRow
            label={t("mobile.paywall.premium_name")}
            price="199 kr"
            period={t("mobile.paywall.premium_period_label")}
            sub={t("mobile.paywall.premium_sub")}
            selected={selected === "premium"}
            onSelect={() => { setSelected("premium"); posthog.capture('subscription_tier_selected', { tier: 'premium' }); }}
            badgeText={t("mobile.paywall.save_badge")}
          />
          <TierRow
            label={t("mobile.paywall.basic_name")}
            price="69 kr"
            period={t("mobile.paywall.basic_period_label")}
            sub={t("mobile.paywall.basic_sub")}
            selected={selected === "basic"}
            onSelect={() => { setSelected("basic"); posthog.capture('subscription_tier_selected', { tier: 'basic' }); }}
          />

          {/* ── What You'll Get ────────────────────────────── */}
          <Text style={styles.sectionTitle}>{t("mobile.paywall.what_you_get")}</Text>

          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon} size={20} color={maakTokens.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{t(f.titleKey)}</Text>
                <Text style={styles.featureDesc}>{t(f.descKey)}</Text>
              </View>
              <Ionicons name="checkmark" size={20} color={maakTokens.primary} />
            </View>
          ))}

          {/* ── CTA ───────────────────────────────────────── */}
          <Pressable
            style={[styles.cta, busy && styles.ctaDisabled]}
            onPress={handleSubscribe}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color={maakTokens.primaryForeground} />
            ) : (
              <Text style={styles.ctaText}>{t("mobile.paywall.cta_subscribe")}</Text>
            )}
          </Pressable>

          <Text style={styles.fineprint}>{t("mobile.paywall.auto_renew_notice")}</Text>

          <Pressable onPress={handleRestore} style={styles.restoreBtn} accessibilityRole="button">
            <Text style={styles.restoreText}>{t("mobile.paywall.cta_restore")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Tier row (radio-style, matches Figma) ──────────────────────────
type TierRowProps = {
  label: string;
  price: string;
  period: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
  badgeText?: string;
};

function TierRow({ label, price, period, sub, selected, onSelect, badgeText }: TierRowProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.tierRow, selected && styles.tierRowSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      {badgeText && selected ? (
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>{badgeText}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.tierLabel}>{label}</Text>
        <View style={styles.tierPriceRow}>
          <Text style={styles.tierPrice}>{price}</Text>
          <Text style={styles.tierPeriod}> {period}</Text>
        </View>
        <Text style={styles.tierSub}>{sub}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  heroGradient: {
    alignItems: "center",
    paddingBottom: 28,
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
  },
  closeBtn: { position: "absolute", left: maakTokens.screenPaddingHorizontal, top: 12, zIndex: 1 },
  mascot: { width: 150, height: 150, marginBottom: 14, marginTop: 28 },
  heroTitle: {
    fontSize: 26, fontWeight: "700", color: maakTokens.foreground,
    textAlign: "center", marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15, lineHeight: 22, color: maakTokens.mutedForeground,
    textAlign: "center", maxWidth: 320,
  },
  content: { paddingHorizontal: maakTokens.screenPaddingHorizontal, paddingTop: 16 },
  tierRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl, borderWidth: 2, borderColor: maakTokens.border,
    padding: 16, marginBottom: 10, position: "relative",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tierRowSelected: {
    borderColor: maakTokens.primary,
    shadowColor: maakTokens.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  tierLabel: { fontSize: 14, color: maakTokens.mutedForeground, marginBottom: 2 },
  tierPriceRow: { flexDirection: "row", alignItems: "baseline" },
  tierPrice: { fontSize: 24, fontWeight: "700", color: maakTokens.foreground },
  tierPeriod: { fontSize: 14, color: maakTokens.mutedForeground },
  tierSub: { fontSize: 12, color: maakTokens.primary, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: maakTokens.border, alignItems: "center", justifyContent: "center", marginLeft: 12,
  },
  radioSelected: {
    borderColor: maakTokens.primary,
    backgroundColor: maakTokens.primary,
    borderWidth: 2,
  },
  radioDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff",
  },
  saveBadge: {
    position: "absolute", top: -10, right: 16, backgroundColor: "#FACC15",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  saveBadgeText: { color: "#1a1a1a", fontSize: 11, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: maakTokens.foreground, marginTop: 20, marginBottom: 14 },
  featureRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14,
    marginHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: maakTokens.border, gap: 12,
  },
  featureIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: `${maakTokens.primary}22`, alignItems: "center", justifyContent: "center",
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "600", color: maakTokens.foreground },
  featureDesc: { fontSize: 13, color: maakTokens.mutedForeground, marginTop: 1 },
  cta: {
    backgroundColor: maakTokens.primary, borderRadius: maakTokens.radius2xl,
    paddingVertical: 17, alignItems: "center", marginTop: 24, marginBottom: 10,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: maakTokens.primaryForeground, fontSize: 16, fontWeight: "700" },
  fineprint: { fontSize: 12, lineHeight: 18, color: maakTokens.mutedForeground, textAlign: "center", marginBottom: 8 },
  restoreBtn: { paddingVertical: 12, alignItems: "center" },
  restoreText: { color: maakTokens.primary, fontSize: 15, fontWeight: "600" },
});
