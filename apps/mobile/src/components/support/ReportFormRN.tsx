import { useSupabase } from "@/contexts/SupabaseProvider";
import { readFileAsBase64 } from "@/lib/readFileAsBytes";
import { SupportHeader } from "@/components/support/SupportHeader";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { SelectField } from "@/components/onboarding/SelectField";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VIOLATION_TYPES = [
  "harassment",
  "hate_speech",
  "fraud",
  "nude_content",
  "spam",
  "fake_profile",
  "other",
] as const;

type EvidenceItem = { uri: string; name: string; mimeType: string | null };

export function ReportFormRN() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const { userId, matchId, context: contextParam } = useLocalSearchParams<{
    userId?: string;
    matchId?: string;
    context?: string;
  }>();

  const reportedUserId = typeof userId === "string" ? userId : undefined;
  const matchIdParam = typeof matchId === "string" ? matchId : undefined;
  const rawContext = typeof contextParam === "string" ? contextParam : "general";
  const context = ["profile", "chat", "general"].includes(rawContext) ? rawContext : "general";

  const [violationType, setViolationType] = useState("");
  const [description, setDescription] = useState("");
  const [witnessStatement, setWitnessStatement] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [picking, setPicking] = useState(false);

  const violationItems = useMemo(
    () =>
      VIOLATION_TYPES.map((type) => ({
        value: type,
        label: t(`report.violation_${type}`),
      })),
    [t],
  );

  const addEvidence = useCallback(async () => {
    if (evidence.length >= 5 || picking) return;
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const assets =
        "assets" in result && Array.isArray(result.assets) && result.assets.length > 0
          ? result.assets
          : "uri" in result && typeof (result as { uri?: string }).uri === "string"
            ? [
                {
                  uri: (result as { uri: string }).uri,
                  name: (result as { name?: string }).name ?? "file",
                  mimeType: (result as { mimeType?: string | null }).mimeType ?? null,
                },
              ]
            : [];
      if (assets.length === 0) return;
      const next: EvidenceItem[] = [];
      for (const a of assets) {
        if (evidence.length + next.length >= 5) break;
        const mime = a.mimeType ?? null;
        if (
          mime &&
          !mime.startsWith("image/") &&
          mime !== "application/pdf"
        ) {
          Alert.alert("", t("report.invalid_file_type"));
          continue;
        }
        next.push({
          uri: a.uri,
          name: a.name ?? "file",
          mimeType: mime,
        });
      }
      if (next.length > 0) setEvidence((prev) => [...prev, ...next].slice(0, 5));
    } catch {
      Alert.alert("", t("report.upload_error"));
    } finally {
      setPicking(false);
    }
  }, [evidence.length, picking, t]);

  const removeEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReport = async () => {
    if (!user) {
      router.replace("/phone-auth");
      return;
    }
    if (!violationType || !description.trim()) {
      Alert.alert("", t("report.fill_required"));
      return;
    }

    setSubmitting(true);
    try {
      const evidencePaths: string[] = [];
      for (const file of evidence) {
        const ext = file.name.split(".").pop()?.split("?")[0] || "bin";
        const safeExt = /^[a-z0-9]+$/i.test(ext) ? ext.toLowerCase() : "jpg";
        const uuid = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const path = `${user.id}/${uuid}.${safeExt}`;
        const base64 = await readFileAsBase64(file.uri);
        const contentType =
          file.mimeType ||
          (safeExt === "png"
            ? "image/png"
            : safeExt === "pdf"
              ? "application/pdf"
              : safeExt === "webp"
                ? "image/webp"
                : "image/jpeg");
        // Route via storage-proxy edge function: direct storage.upload is
        // unreliable on this project's storage-api (see PhotoUploadRN).
        const { error: uploadError } = await supabase.functions.invoke(
          "storage-proxy",
          {
            body: {
              action: "upload",
              bucket: "report-evidence",
              path,
              contentType,
              base64,
            },
          },
        );
        if (uploadError) {
          let detail = "";
          try {
            const ctx = (uploadError as { context?: Response }).context;
            if (ctx) detail = await ctx.text();
          } catch {
            /* ignore */
          }
          throw new Error(detail || uploadError.message || t("report.upload_error"));
        }
        evidencePaths.push(path);
      }

      const { data: newReport, error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId ?? null,
          match_id: matchIdParam ?? null,
          context,
          violation_type: violationType,
          description: description.trim(),
          evidence_paths: evidencePaths,
          witness_statement: witnessStatement.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        if (__DEV__) console.warn("[ReportFormRN] insert", error);
        Alert.alert("", t("report.submit_error"));
        setSubmitting(false);
        return;
      }

      const reporterEmail = user.email?.trim();
      const isPlaceholderEmail = reporterEmail?.includes("@phone.maak.app") ?? true;
      if (reporterEmail && !isPlaceholderEmail && newReport?.id) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: reporterEmail,
              template: "report_received",
              data: { report_id: newReport.id },
              language: i18n.language?.startsWith("en") ? "en" : "sv",
            },
          });
        } catch (e) {
          if (__DEV__) console.warn("[ReportFormRN] email", e);
        }
      }

      setSubmitted(true);
      Alert.alert("", t("report.received"));
    } catch (e) {
      if (__DEV__) console.warn("[ReportFormRN]", e);
      Alert.alert("", t("report.submit_error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
      </View>
    );
  }

  if (submitted) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
        }}
      >
        <SupportHeader title={t("report.received_title")} />
        <View style={styles.card}>
          <Text style={styles.muted}>{t("report.received_message")}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnTxt}>{t("common.back")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <ScrollView
      style={styles.root}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: maakTokens.screenPaddingHorizontal,
      }}
    >
      <SupportHeader title={t("report.title")} />
      <Text style={styles.intro}>{t("report.intro")}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("report.form_title")}</Text>

        <SelectField
          label={`${t("report.violation_type")} *`}
          value={violationType}
          placeholder={t("report.select_violation")}
          options={violationItems}
          onValueChange={(v) => setViolationType(v)}
        />

        <Text style={styles.label}>{t("report.context_evidence")} *</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder={t("report.context_placeholder")}
          placeholderTextColor={maakTokens.mutedForeground}
          multiline
          textAlignVertical="top"
          numberOfLines={5}
        />

        <Text style={styles.label}>{t("report.evidence")}</Text>
        <View style={styles.evidenceRow}>
          {evidence.map((f, i) => (
            <View key={`${f.uri}-${i}`} style={styles.evidenceChip}>
              <Text style={styles.evidenceName} numberOfLines={1}>
                {f.name}
              </Text>
              <Pressable
                onPress={() => removeEvidence(i)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t("common.delete")}
              >
                <Ionicons name="close-circle" size={20} color={maakTokens.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
        {evidence.length < 5 ? (
          <Pressable
            style={[styles.attachBtn, picking && styles.attachDisabled]}
            onPress={() => void addEvidence()}
            disabled={picking}
          >
            {picking ? (
              <ActivityIndicator color={maakTokens.primary} />
            ) : (
              <>
                <Ionicons name="attach-outline" size={20} color={maakTokens.primary} />
                <Text style={styles.attachTxt}>{t("report.attach")}</Text>
              </>
            )}
          </Pressable>
        ) : null}
        <Text style={styles.hint}>{t("report.evidence_hint")}</Text>

        <Text style={styles.label}>{t("report.witness_optional")}</Text>
        <TextInput
          style={styles.textAreaSm}
          value={witnessStatement}
          onChangeText={setWitnessStatement}
          placeholder={t("report.witness_placeholder")}
          placeholderTextColor={maakTokens.mutedForeground}
          multiline
          textAlignVertical="top"
          numberOfLines={3}
        />

        <Pressable
          style={[
            styles.primaryBtn,
            (submitting || !violationType || !description.trim()) && styles.primaryBtnDisabled,
          ]}
          onPress={() => void submitReport()}
          disabled={submitting || !violationType || !description.trim()}
        >
          {submitting ? (
            <ActivityIndicator color={maakTokens.primaryForeground} />
          ) : (
            <Text style={styles.primaryBtnTxt}>{t("report.submit")}</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={() => router.push("/reporting")} style={styles.policyLink}>
        <Text style={styles.policyLinkTxt}>{t("report.view_policy")}</Text>
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 16,
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: maakTokens.foreground,
    marginBottom: 6,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    padding: 12,
    fontSize: 15,
    color: maakTokens.foreground,
    marginBottom: 14,
  },
  textAreaSm: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    padding: 12,
    fontSize: 15,
    color: maakTokens.foreground,
    marginBottom: 14,
  },
  evidenceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  evidenceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: maakTokens.muted,
    borderRadius: 8,
  },
  evidenceName: { fontSize: 13, color: maakTokens.foreground, maxWidth: 200 },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    marginBottom: 6,
  },
  attachDisabled: { opacity: 0.6 },
  attachTxt: { fontSize: 15, fontWeight: "600", color: maakTokens.primary },
  hint: { fontSize: 12, color: maakTokens.mutedForeground, marginBottom: 14 },
  primaryBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnTxt: { color: maakTokens.primaryForeground, fontWeight: "700", fontSize: 16 },
  policyLink: { alignItems: "center", paddingVertical: 8 },
  policyLinkTxt: {
    fontSize: 12,
    color: maakTokens.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  muted: { fontSize: 14, lineHeight: 21, color: maakTokens.mutedForeground, marginBottom: 20 },
});
