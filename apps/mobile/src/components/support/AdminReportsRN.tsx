import { useSupabase } from "@/contexts/SupabaseProvider";
import { SupportHeader } from "@/components/support/SupportHeader";
import { maakTokens } from "@maak/core";
import { Picker } from "@react-native-picker/picker";
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
  reporter_id: string;
  reported_user_id: string | null;
  context: string;
  violation_type: string;
  description: string;
  status: ReportStatus;
  created_at: string;
}

const STATUSES: ReportStatus[] = ["pending", "reviewing", "resolved", "dismissed"];

export function AdminReportsRN() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("moderator_roles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setIsModerator(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!user || !isModerator) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, reporter_id, reported_user_id, context, violation_type, description, status, created_at")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        if (__DEV__) console.warn("[AdminReportsRN]", error);
        setReports([]);
      } else {
        setReports((data ?? []) as ReportRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user, isModerator]);

  const updateStatus = async (reportId: string, status: ReportStatus) => {
    setUpdatingId(reportId);
    const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
    if (error) {
      if (__DEV__) console.warn("[AdminReportsRN] update", error);
    } else {
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    }
    setUpdatingId(null);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(
        i18n.language.startsWith("en") ? "en-GB" : "sv-SE",
        { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" },
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

  if (isModerator === false) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
        }}
      >
        <SupportHeader title={t("admin.reports_title")} />
        <Text style={styles.denied}>{t("admin.access_denied")}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnTxt}>{t("common.back")}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (isModerator === null) {
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
      <SupportHeader title={t("admin.reports_title")} />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={maakTokens.primary} />
      ) : reports.length === 0 ? (
        <Text style={styles.empty}>{t("admin.no_reports")}</Text>
      ) : (
        <View style={styles.list}>
          {reports.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.violation} numberOfLines={2}>
                  {t(`report.violation_${r.violation_type}`, { defaultValue: r.violation_type })}
                </Text>
                <Text style={styles.date}>{formatDate(r.created_at)}</Text>
              </View>
              <Text style={styles.desc} numberOfLines={4}>
                {r.description}
              </Text>
              <Text style={styles.ctx}>
                {t("report.context_evidence")}: {r.context}
              </Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>{t("admin.status")}</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={r.status}
                    enabled={updatingId !== r.id}
                    onValueChange={(v) => void updateStatus(r.id, v as ReportStatus)}
                    style={styles.picker}
                  >
                    {STATUSES.map((s) => (
                      <Picker.Item
                        key={s}
                        label={t(`report.status_${s}`)}
                        value={s}
                      />
                    ))}
                  </Picker>
                </View>
                {updatingId === r.id ? (
                  <ActivityIndicator size="small" color={maakTokens.primary} />
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loader: { marginVertical: 24 },
  denied: {
    fontSize: 15,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 20,
  },
  empty: { fontSize: 15, color: maakTokens.mutedForeground, textAlign: "center", marginTop: 16 },
  list: { gap: 12 },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 14,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  violation: { flex: 1, fontSize: 14, fontWeight: "700", color: maakTokens.foreground },
  date: { fontSize: 11, color: maakTokens.mutedForeground },
  desc: { fontSize: 13, color: maakTokens.mutedForeground, marginBottom: 8 },
  ctx: { fontSize: 12, color: maakTokens.mutedForeground, marginBottom: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  statusLabel: { fontSize: 12, color: maakTokens.mutedForeground },
  pickerWrap: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: { width: "100%" },
  primaryBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  primaryBtnTxt: { color: maakTokens.primaryForeground, fontWeight: "700", fontSize: 16 },
});
