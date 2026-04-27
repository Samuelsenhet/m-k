import { useSupabase } from "@/contexts/SupabaseProvider";
import { SupportHeader } from "@/components/support/SupportHeader";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

interface ReportRow {
  id: string;
  context: string;
  violation_type: string;
  description: string;
  status: ReportStatus;
  created_at: string;
}

type IonName = ComponentProps<typeof Ionicons>["name"];

const STATUS_ICON: Record<ReportStatus, IonName> = {
  pending: "time-outline",
  reviewing: "document-text-outline",
  resolved: "checkmark-circle-outline",
  dismissed: "close-circle-outline",
};

export function ReportHistoryRN() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, context, violation_type, description, status, created_at")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        if (__DEV__) console.warn("[ReportHistoryRN]", error);
        setReports([]);
      } else {
        setReports((data ?? []) as ReportRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(
        i18n.language.startsWith("en") ? "en-GB" : "sv-SE",
        { day: "numeric", month: "short", year: "numeric" },
      );
    } catch {
      return iso;
    }
  };

  if (!user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: maakTokens.screenPaddingHorizontal,
      }}
    >
      <SupportHeader title={t("report.history_title")} />
      <Text style={styles.intro}>{t("report.history_intro")}</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={maakTokens.primary} />
      ) : reports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="alert-circle-outline" size={40} color={maakTokens.mutedForeground} />
          <Text style={styles.emptyTxt}>{t("report.history_empty")}</Text>
          <Pressable style={styles.secondaryBtn} onPress={() => router.push("/report")}>
            <Text style={styles.secondaryBtnTxt}>{t("report.report_problem")}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {reports.map((r) => {
            const st = STATUS_ICON[r.status] ? r.status : "pending";
            const icon = STATUS_ICON[st];
            return (
              <View key={r.id} style={styles.itemCard}>
                <View style={styles.itemHead}>
                  <View style={styles.itemTitleRow}>
                    <Ionicons name={icon} size={18} color={maakTokens.mutedForeground} />
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {t(`report.violation_${r.violation_type}`, {
                        defaultValue: r.violation_type,
                      })}
                    </Text>
                  </View>
                  <Text style={styles.itemDate}>{formatDate(r.created_at)}</Text>
                </View>
                <Text style={styles.itemDesc} numberOfLines={3}>
                  {r.description}
                </Text>
                <Text style={styles.itemStatus}>
                  {t(`report.status_${st}`, { defaultValue: r.status })}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Pressable style={styles.secondaryBtnWide} onPress={() => router.push("/reporting")}>
        <Text style={styles.secondaryBtnTxt}>{t("report.view_policy")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
    marginBottom: 16,
  },
  loader: { marginVertical: 24 },
  emptyCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    gap: 12,
  },
  emptyTxt: { fontSize: 14, color: maakTokens.mutedForeground, textAlign: "center" },
  list: { gap: 12 },
  itemCard: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 16,
  },
  itemHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  itemTitleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: maakTokens.foreground },
  itemDate: { fontSize: 12, color: maakTokens.mutedForeground },
  itemDesc: { fontSize: 14, color: maakTokens.mutedForeground, marginBottom: 8 },
  itemStatus: { fontSize: 12, fontWeight: "600", color: maakTokens.foreground },
  secondaryBtn: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  secondaryBtnWide: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    alignItems: "center",
  },
  secondaryBtnTxt: { fontSize: 16, fontWeight: "600", color: maakTokens.primary },
});
