import { PrivacyControlsSheet } from "@/components/profile/PrivacyControlsSheet";
import { MatchingSettingsRN } from "@/components/settings/MatchingSettingsRN";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { useSubscription } from "@/hooks/useSubscription";
import { appLocaleTag } from "@/lib/appLocale";
import { LANG_STORAGE_KEY } from "@/lib/languageStorage";
import { markReopenSettingsAfterSubscreen } from "@/lib/reopenSettingsAfterSubscreen";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ProfileSettingsSheet({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session, hasValidSupabaseConfig } = useSupabase();
  const user = session?.user;

  const onlineCount = useOnlineCount(user?.id, hasValidSupabaseConfig);
  const { isPremium } = useSubscription();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const [profRes, modRes] = await Promise.all([
        supabase.from("profiles").select("display_name").eq(profileKey, user.id).maybeSingle(),
        supabase.from("moderator_roles").select("user_id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profRes.data?.display_name) setDisplayName(profRes.data.display_name);
      else setDisplayName(null);
      setIsModerator(!!modRes.data);
    } catch (e) {
      if (__DEV__) console.warn("[ProfileSettingsSheet] loadAccount", e);
    } finally {
      setProfileLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (visible && user) void loadAccount();
  }, [visible, user, loadAccount]);

  useEffect(() => {
    if (!visible) setPrivacyOpen(false);
  }, [visible]);

  const handle = displayName
    ? `@${displayName.toLowerCase().replace(/\s+/g, "_")}`
    : null;
  const u = user as { email?: string; phone?: string; id: string } | undefined;
  const accountLine = u?.email ?? u?.phone ?? u?.id ?? "-";

  const setLang = async (lng: "sv" | "en") => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem(LANG_STORAGE_KEY, lng);
  };

  const go = (path: Parameters<typeof router.push>[0]) => {
    markReopenSettingsAfterSubscreen();
    onClose();
    router.push(path);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    onClose();
    router.replace("/phone-auth");
  };

  const deleteAccount = () => {
    if (!user || deleting) return;
    Alert.alert(
      t("settings.delete_account_title"),
      t("settings.delete_account_description"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.delete_account_confirm"),
          style: "destructive",
          onPress: () => void runDeleteAccount(),
        },
      ],
    );
  };

  const runDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const uid = user.id;
      await Promise.all([
        supabase.from("messages").delete().eq("sender_id", uid),
        supabase.from("user_achievements").delete().eq("user_id", uid),
        supabase.from("matches").delete().eq("user_id", uid),
        supabase.from("personality_results").delete().eq("user_id", uid),
        supabase.from("profile_photos").delete().eq("user_id", uid),
      ]);
      const profileKey = await resolveProfilesAuthKey(supabase, uid);
      const { error: profileError } = await supabase.from("profiles").delete().eq(profileKey, uid);
      if (profileError) throw profileError;
      await supabase.auth.signOut();
      onClose();
      router.replace("/phone-auth");
      Alert.alert("", t("settings.delete_account_title"));
    } catch (e) {
      if (__DEV__) console.warn("[delete account]", e);
      Alert.alert(t("common.error"), t("profile.error_saving"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.headerRow}>
              <View style={{ width: 40 }} />
              <Text style={styles.headerTitle}>{t("settings.title")}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={{ width: 40, alignItems: "flex-end" }}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <Ionicons name="close" size={26} color={maakTokens.foreground} />
              </Pressable>
            </View>
            <View style={styles.headerRule} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {hasValidSupabaseConfig ? (
                <View style={styles.onlinePill} accessibilityRole="text">
                  <Text style={styles.onlinePillText}>
                    {t("common.online_now_full", {
                      count: onlineCount.toLocaleString(appLocaleTag(i18n.language)),
                    })}
                  </Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardSection}>{t("settings.account")}</Text>
                {profileLoading ? (
                  <ActivityIndicator color={maakTokens.primary} style={{ marginVertical: 8 }} />
                ) : null}
                {handle ? <Text style={styles.handle}>{handle}</Text> : null}
                <Text style={styles.emailLine}>{accountLine}</Text>

                <View style={styles.divider} />

                <MenuRow
                  icon="shield-checkmark-outline"
                  label={t("mobile.verification.settings_row")}
                  onPress={() => go({ pathname: "/verification" })}
                />
                <MenuRow
                  icon={isPremium ? "sparkles" : "star-outline"}
                  label={
                    isPremium
                      ? t("mobile.paywall.settings_manage_row")
                      : t("mobile.paywall.settings_upgrade_row")
                  }
                  onPress={() => go({ pathname: "/paywall" })}
                />
                <MenuRow
                  icon="book-outline"
                  label={t("settings.learn_personality")}
                  onPress={() => go("/personality-guide")}
                />
                <View style={styles.rowSplit}>
                  <View style={styles.rowLeft}>
                    <Ionicons name="language-outline" size={20} color={maakTokens.foreground} />
                    <Text style={styles.rowLabel}>{t("settings.language")}</Text>
                  </View>
                  <View style={styles.langFlags}>
                    <Pressable
                      onPress={() => void setLang("sv")}
                      style={[styles.flagChip, i18n.language.startsWith("sv") && styles.flagChipOn]}
                    >
                      <Text style={styles.flagTxt}>🇸🇪</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void setLang("en")}
                      style={[styles.flagChip, i18n.language.startsWith("en") && styles.flagChipOn]}
                    >
                      <Text style={styles.flagTxt}>🇬🇧</Text>
                    </Pressable>
                  </View>
                </View>
                <MenuRow
                  label={t("settings.notifications")}
                  onPress={() => go("/notifications")}
                />
                <View style={styles.rowSplit}>
                  <Text style={styles.rowLabel}>{t("settings.privacy_controls")}</Text>
                  <Pressable
                    onPress={() => setPrivacyOpen(true)}
                    style={styles.manageBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.manageBtnTxt}>{t("settings.manage")}</Text>
                  </Pressable>
                </View>
                <MenuRow
                  icon="trophy-outline"
                  label={t("settings.achievements")}
                  onPress={() => go("/achievements")}
                />
                {/* Värdar program entries - both available to everyone. Non-hosts
                    see an empty inbox but can still browse träffar feeds. */}
                <MenuRow
                  icon="calendar-outline"
                  label={t("settings.traffar", { defaultValue: "Träffar" })}
                  onPress={() => go("/traffar" as unknown as "/")}
                />
                <MenuRow
                  icon="mail-unread-outline"
                  label={t("settings.intro_inbox", {
                    defaultValue: "Introduktioner",
                  })}
                  onPress={() => go("/host/inbox" as unknown as "/")}
                />
                <MenuRow label={t("settings.terms")} onPress={() => go("/terms")} />
                <MenuRow label={t("settings.privacy_policy")} onPress={() => go("/privacy")} />
                <MenuRow label={t("settings.reporting")} onPress={() => go("/reporting")} />
                <MenuRow label={t("settings.about_us")} onPress={() => go("/about")} />
              </View>

              <View style={styles.cardPad0}>
                <MatchingSettingsRN />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSection}>{t("settings.support_and_reports")}</Text>
                <MenuRow
                  label={t("report.history_title")}
                  onPress={() => go("/report-history")}
                />
                <MenuRow
                  label={t("report.report_problem")}
                  onPress={() => go("/report")}
                />
                <MenuRow label={t("appeal.title")} onPress={() => go("/appeal")} />
                {isModerator ? (
                  <>
                    <MenuRow
                      label={t("admin.reports_title")}
                      onPress={() => go("/admin-reports")}
                    />
                    <MenuRow
                      label={t("admin.verifications_title")}
                      onPress={() => go("/admin-verifications")}
                    />
                  </>
                ) : null}
              </View>

              <Pressable
                onPress={() => void signOut()}
                style={({ pressed }) => [pressed && { opacity: 0.92 }]}
              >
                <LinearGradient
                  colors={[...maakTokens.gradientPrimary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoutBtn}
                >
                  <Ionicons name="log-out-outline" size={22} color={maakTokens.primaryForeground} />
                  <Text style={styles.logoutTxt}>{t("settings.logout")}</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.deleteBtn}
                onPress={deleteAccount}
                disabled={deleting}
              >
                <Ionicons name="trash-outline" size={20} color={maakTokens.destructive} />
                <Text style={styles.deleteTxt}>
                  {deleting ? t("settings.deleting") : t("settings.delete_account")}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      <PrivacyControlsSheet
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        onOpenPrivacyPolicy={() => go("/privacy")}
        onOpenSharedData={() => go("/shared-data" as unknown as "/")}
      />
    </Modal>
  );
}

function MenuRow({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={styles.rowLeft}>
        {icon ? (
          <Ionicons name={icon} size={20} color={maakTokens.foreground} />
        ) : (
          <View style={{ width: 20 }} />
        )}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={maakTokens.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: maakTokens.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: maakTokens.border,
    marginHorizontal: 20,
  },
  scroll: { maxHeight: "100%" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  onlinePill: {
    backgroundColor: maakTokens.primary,
    borderRadius: maakTokens.radius2xl,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  onlinePillText: {
    color: maakTokens.primaryForeground,
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPad0: {
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    overflow: "hidden",
    backgroundColor: maakTokens.card,
  },
  cardSection: {
    fontSize: 16,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 8,
  },
  handle: {
    fontSize: 15,
    fontWeight: "600",
    color: maakTokens.primary,
    marginTop: 4,
  },
  emailLine: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: maakTokens.border,
    marginVertical: 12,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  rowSplit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rowLabel: { fontSize: 15, color: maakTokens.foreground, flex: 1 },
  langFlags: { flexDirection: "row", gap: 8 },
  flagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: maakTokens.border,
    backgroundColor: maakTokens.muted,
  },
  flagChipOn: {
    borderColor: maakTokens.primary,
    backgroundColor: `${maakTokens.primary}18`,
  },
  flagTxt: { fontSize: 18 },
  manageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: maakTokens.radiusLg,
    backgroundColor: maakTokens.muted,
  },
  manageBtnTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: maakTokens.primary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
  },
  logoutTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: maakTokens.primaryForeground,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: `${maakTokens.destructive}66`,
    backgroundColor: `${maakTokens.destructive}12`,
  },
  deleteTxt: {
    fontSize: 15,
    fontWeight: "600",
    color: maakTokens.destructive,
  },
});
