import { useSupabase } from "@/contexts/SupabaseProvider";
import { posthog } from "@/lib/posthog";
import { THIRD_PARTY_SERVICES } from "@/lib/thirdPartyServices";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EXPORT_MAX_BYTES = 900_000;

export default function SharedDataScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;

  const [analyticsOptOut, setAnalyticsOptOut] = useState<boolean | null>(null);
  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadAnalyticsPref = useCallback(async () => {
    if (!user) return;
    try {
      const key = await resolveProfilesAuthKey(supabase, user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("analytics_opt_out")
        .eq(key, user.id)
        .maybeSingle();
      if (error) throw error;
      setAnalyticsOptOut(data?.analytics_opt_out ?? false);
    } catch (e) {
      if (__DEV__) console.warn("[shared-data loadAnalyticsPref]", e);
      setAnalyticsOptOut(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    void loadAnalyticsPref();
  }, [loadAnalyticsPref]);

  const allowAnalytics = analyticsOptOut === null ? true : !analyticsOptOut;

  const handleToggleAnalytics = async (next: boolean) => {
    if (!user || savingAnalytics) return;
    const nextOptOut = !next;
    const previous = analyticsOptOut;
    setAnalyticsOptOut(nextOptOut);
    setSavingAnalytics(true);
    try {
      const key = await resolveProfilesAuthKey(supabase, user.id);
      const { error } = await supabase
        .from("profiles")
        .update({ analytics_opt_out: nextOptOut })
        .eq(key, user.id);
      if (error) throw error;
      if (nextOptOut) {
        posthog.optOut();
      } else {
        posthog.optIn();
        posthog.capture("analytics_opt_in");
      }
    } catch (e) {
      if (__DEV__) console.warn("[shared-data toggle analytics]", e);
      setAnalyticsOptOut(previous);
      Alert.alert(t("common.error"), t("profile.error_saving"));
    } finally {
      setSavingAnalytics(false);
    }
  };

  const handleExport = async () => {
    if (!user || exporting) return;
    setExporting(true);
    try {
      const key = await resolveProfilesAuthKey(supabase, user.id);
      const results = await Promise.all([
        supabase.from("profiles").select("*").eq(key, user.id).maybeSingle(),
        supabase.from("personality_results").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profile_photos").select("id, storage_path, display_order, created_at").eq("user_id", user.id),
        supabase.from("matches").select("*").eq("user_id", user.id),
        supabase.from("user_achievements").select("*").eq("user_id", user.id),
        supabase.from("subscriptions").select("*").eq("user_id", user.id),
      ]);
      const [prof, pers, photos, matches, achievements, subs] = results;

      const payload = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        schema_version: 1,
        profile: prof.data ?? null,
        personality_result: pers.data ?? null,
        profile_photos: photos.data ?? [],
        matches: matches.data ?? [],
        achievements: achievements.data ?? [],
        subscriptions: subs.data ?? [],
      };

      const json = JSON.stringify(payload, null, 2);
      if (json.length > EXPORT_MAX_BYTES) {
        Alert.alert(t("common.error"), t("shared_data.export_too_large"));
        return;
      }

      await Share.share({
        title: t("shared_data.title"),
        message: json,
      });
    } catch (e) {
      if (__DEV__) console.warn("[shared-data export]", e);
      Alert.alert(t("common.error"), t("shared_data.export_error"));
    } finally {
      setExporting(false);
    }
  };

  const handleOpenService = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      if (__DEV__) console.warn("[shared-data openService]", e);
      Alert.alert(t("common.error"), t("shared_data.export_error"));
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons name="chevron-back" size={28} color={maakTokens.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("shared_data.title")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
          paddingBottom: insets.bottom + 32,
          paddingTop: 16,
          gap: 20,
        }}
      >
        <Text style={styles.intro}>{t("shared_data.description")}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("shared_data.analytics_title")}</Text>
          <Text style={styles.cardBody}>{t("shared_data.analytics_description")}</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {t("shared_data.analytics_toggle_label")}
            </Text>
            {analyticsOptOut === null ? (
              <ActivityIndicator color={maakTokens.primary} />
            ) : (
              <Switch
                value={allowAnalytics}
                disabled={savingAnalytics}
                onValueChange={(v) => void handleToggleAnalytics(v)}
                trackColor={{ false: maakTokens.border, true: `${maakTokens.primary}99` }}
                thumbColor={allowAnalytics ? maakTokens.primary : maakTokens.mutedForeground}
                accessibilityLabel={t("shared_data.analytics_toggle_label")}
              />
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("shared_data.export_title")}</Text>
          <Text style={styles.cardBody}>{t("shared_data.export_description")}</Text>
          <Pressable
            style={[styles.primaryBtn, exporting && { opacity: 0.6 }]}
            onPress={() => void handleExport()}
            disabled={exporting}
            accessibilityRole="button"
            accessibilityLabel={t("shared_data.export_button")}
          >
            {exporting ? (
              <ActivityIndicator color={maakTokens.primaryForeground} />
            ) : (
              <Ionicons
                name="download-outline"
                size={20}
                color={maakTokens.primaryForeground}
              />
            )}
            <Text style={styles.primaryBtnTxt}>
              {exporting ? t("shared_data.export_creating") : t("shared_data.export_button")}
            </Text>
          </Pressable>
          <Text style={styles.footnote}>{t("shared_data.export_messages_note")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("shared_data.services_title")}</Text>
          <Text style={styles.cardBody}>{t("shared_data.services_description")}</Text>
          {THIRD_PARTY_SERVICES.map((service, idx) => {
            const purpose = t(service.purposeKey);
            const isLast = idx === THIRD_PARTY_SERVICES.length - 1;
            return (
              <Pressable
                key={service.id}
                style={[styles.serviceRow, isLast && { borderBottomWidth: 0 }]}
                onPress={() => void handleOpenService(service.privacyUrl)}
                accessibilityRole="link"
                accessibilityLabel={`${service.name}, ${purpose}`}
              >
                <View style={styles.serviceTextCol}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePurpose}>{purpose}</Text>
                </View>
                <Ionicons
                  name="open-outline"
                  size={18}
                  color={maakTokens.mutedForeground}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
  },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    gap: 12,
  },
  switchLabel: {
    fontSize: 15,
    color: maakTokens.foreground,
    flex: 1,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    backgroundColor: maakTokens.primary,
    marginTop: 4,
  },
  primaryBtnTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: maakTokens.primaryForeground,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
    color: maakTokens.mutedForeground,
    marginTop: 4,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
    gap: 12,
  },
  serviceTextCol: { flex: 1, minWidth: 0 },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: maakTokens.foreground,
  },
  servicePurpose: {
    fontSize: 13,
    color: maakTokens.mutedForeground,
    marginTop: 2,
  },
});
