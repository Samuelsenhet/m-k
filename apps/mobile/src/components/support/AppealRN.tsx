import { useSupabase } from "@/contexts/SupabaseProvider";
import { SupportHeader } from "@/components/support/SupportHeader";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export function AppealRN() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      router.replace("/phone-auth");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("", t("appeal.fill_reason"));
      return;
    }
    setSubmitting(true);
    try {
      const { data: newAppeal, error } = await supabase
        .from("appeals")
        .insert({
          user_id: user.id,
          reason: reason.trim(),
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;

      const userEmail = user.email?.trim();
      const isPlaceholderEmail = userEmail?.includes("@phone.maak.app") ?? true;
      if (userEmail && !isPlaceholderEmail && newAppeal?.id) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: userEmail,
              template: "appeal_received",
              data: { appeal_id: newAppeal.id },
              language: i18n.language?.startsWith("en") ? "en" : "sv",
            },
          });
        } catch (e) {
          if (__DEV__) console.warn("[AppealRN] email", e);
        }
      }
      setSubmitted(true);
      Alert.alert("", t("appeal.received"));
    } catch (e) {
      if (__DEV__) console.warn("[AppealRN]", e);
      Alert.alert("", t("appeal.submit_error"));
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
        <SupportHeader title={t("appeal.received_title")} />
        <View style={styles.card}>
          <Text style={styles.muted}>{t("appeal.received_message")}</Text>
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
      <SupportHeader title={t("appeal.title")} />
      <Text style={styles.intro}>{t("appeal.intro")}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("appeal.form_title")}</Text>
        <Text style={styles.label}>{t("appeal.reason")} *</Text>
        <TextInput
          style={styles.textArea}
          value={reason}
          onChangeText={setReason}
          placeholder={t("appeal.reason_placeholder")}
          placeholderTextColor={maakTokens.mutedForeground}
          multiline
          textAlignVertical="top"
          numberOfLines={6}
        />
        <Pressable
          style={[styles.primaryBtn, (submitting || !reason.trim()) && styles.primaryBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={submitting || !reason.trim()}
        >
          {submitting ? (
            <ActivityIndicator color={maakTokens.primaryForeground} />
          ) : (
            <Text style={styles.primaryBtnTxt}>{t("appeal.submit")}</Text>
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
  label: { fontSize: 13, fontWeight: "600", color: maakTokens.foreground, marginBottom: 6 },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    padding: 12,
    fontSize: 15,
    color: maakTokens.foreground,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
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
