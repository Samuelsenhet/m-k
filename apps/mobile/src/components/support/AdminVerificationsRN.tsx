import { useSupabase } from "@/contexts/SupabaseProvider";
import { SupportHeader } from "@/components/support/SupportHeader";
import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type VerificationRow = {
  id: string;
  display_name: string | null;
  id_verification_status: string;
  selfie_path: string | null;
  updated_at: string;
};

export function AdminVerificationsRN() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;

  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VerificationRow | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [decisionInFlight, setDecisionInFlight] = useState(false);

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
        .from("profiles")
        .select("id, display_name, id_verification_status, selfie_path, updated_at")
        .eq("id_verification_status", "pending")
        .not("selfie_path", "is", null)
        .order("updated_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        if (__DEV__) console.warn("[AdminVerificationsRN]", error);
        setRows([]);
      } else {
        setRows((data ?? []) as VerificationRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user, isModerator]);

  const openSelfie = async (row: VerificationRow) => {
    setSelected(row);
    setSignedUrl(null);
    if (!row.selfie_path) return;
    setLoadingImage(true);
    const { data, error } = await supabase.storage
      .from("id-documents")
      .createSignedUrl(row.selfie_path, 600);
    setLoadingImage(false);
    if (error || !data?.signedUrl) {
      if (__DEV__) console.warn("[AdminVerificationsRN] signedUrl", error);
      Alert.alert(t("common.error"), t("admin.verifications_signed_url_failed"));
      return;
    }
    setSignedUrl(data.signedUrl);
  };

  const closeSelfie = () => {
    setSelected(null);
    setSignedUrl(null);
    setLoadingImage(false);
  };

  const submitDecision = async (decision: "approved" | "rejected") => {
    if (!selected || decisionInFlight) return;
    setDecisionInFlight(true);
    const { error } = await supabase.functions.invoke("moderate-verification", {
      body: { targetUserId: selected.id, decision },
    });
    setDecisionInFlight(false);
    if (error) {
      if (__DEV__) console.warn("[AdminVerificationsRN] decision", error);
      Alert.alert(t("common.error"), t("admin.verifications_decision_failed"));
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== selected.id));
    closeSelfie();
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(
        i18n.language.startsWith("en") ? "en-GB" : "sv-SE",
        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
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
        <SupportHeader title={t("admin.verifications_title")} />
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
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
        }}
      >
        <SupportHeader title={t("admin.verifications_title")} />

        {loading ? (
          <ActivityIndicator style={styles.loader} color={maakTokens.primary} />
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>{t("admin.no_pending_verifications")}</Text>
        ) : (
          <View style={styles.list}>
            {rows.map((row) => (
              <View key={row.id} style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.name} numberOfLines={1}>
                    {row.display_name || t("profile.placeholder_name")}
                  </Text>
                  <Text style={styles.date}>{formatDate(row.updated_at)}</Text>
                </View>
                <Text style={styles.hint}>
                  {t("admin.verifications_pending_since")}
                </Text>
                <Pressable
                  style={styles.viewBtn}
                  onPress={() => openSelfie(row)}
                  accessibilityRole="button"
                >
                  <Ionicons name="eye-outline" size={18} color={maakTokens.primary} />
                  <Text style={styles.viewBtnTxt}>
                    {t("admin.verifications_view_selfie")}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!selected}
        animationType="slide"
        transparent={false}
        onRequestClose={closeSelfie}
      >
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={closeSelfie} hitSlop={12}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selected?.display_name || t("profile.placeholder_name")}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.modalImageWrap}>
            {loadingImage ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : signedUrl ? (
              <Image source={{ uri: signedUrl }} style={styles.modalImage} resizeMode="contain" />
            ) : (
              <Text style={styles.modalError}>
                {t("admin.verifications_signed_url_failed")}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.modalFooter,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <Pressable
              style={[styles.footerBtn, styles.rejectBtn]}
              disabled={decisionInFlight}
              onPress={() => void submitDecision("rejected")}
            >
              {decisionInFlight ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={22} color="#fff" />
                  <Text style={styles.footerBtnTxt}>
                    {t("admin.verifications_reject")}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.footerBtn, styles.approveBtn]}
              disabled={decisionInFlight}
              onPress={() => void submitDecision("approved")}
            >
              {decisionInFlight ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                  <Text style={styles.footerBtnTxt}>
                    {t("admin.verifications_approve")}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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
  empty: {
    fontSize: 15,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginTop: 16,
  },
  list: { gap: 12 },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 14,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  name: { flex: 1, fontSize: 15, fontWeight: "700", color: maakTokens.foreground },
  date: { fontSize: 11, color: maakTokens.mutedForeground },
  hint: { fontSize: 12, color: maakTokens.mutedForeground, marginBottom: 10 },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.primary,
    backgroundColor: `${maakTokens.primary}0f`,
  },
  viewBtnTxt: { fontSize: 14, fontWeight: "600", color: maakTokens.primary },
  primaryBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  primaryBtnTxt: { color: maakTokens.primaryForeground, fontWeight: "700", fontSize: 16 },
  modalRoot: { flex: 1, backgroundColor: "#0a0a0a" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  modalImageWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalImage: { width: "100%", height: "100%" },
  modalError: { color: "#fff", fontSize: 14, textAlign: "center" },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: maakTokens.radiusLg,
  },
  rejectBtn: { backgroundColor: maakTokens.destructive },
  approveBtn: { backgroundColor: maakTokens.primary },
  footerBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
