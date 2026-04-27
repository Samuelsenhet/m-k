import { useSupabase } from "@/contexts/SupabaseProvider";
import { useNotificationFeedRN } from "@/hooks/useNotificationFeedRN";
import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatTimeAgo(
  iso: string,
  t: (key: string, opts?: { count?: number }) => string,
): string {
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (mins < 1) return t("notifications.just_now");
  if (mins < 60) return t("notifications.minutes_ago", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notifications.hours_ago", { count: hours });
  const days = Math.floor(hours / 24);
  return t("notifications.days_ago", { count: days });
}

type Prefs = {
  push_new_matches: boolean;
  push_messages: boolean;
  email_new_matches: boolean;
  email_messages: boolean;
};

type NotificationKind = "profile_view" | "new_interest" | "message" | "generic";

function mascotForNotification(kind: NotificationKind) {
  if (kind === "new_interest") return MascotAssets.lightingLantern;
  if (kind === "message") return MascotAssets.practicingMirror;
  if (kind === "profile_view") return MascotAssets.waitingTea;
  return MascotAssets.onboarding;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const {
    profileViews,
    interests,
    loading,
    error,
    acceptInterest,
    rejectInterest,
  } = useNotificationFeedRN();

  const [prefs, setPrefs] = useState<Prefs | null>(null);

  const loadPrefs = useCallback(async () => {
    if (!user) return;
    try {
      const key = await resolveProfilesAuthKey(supabase, user.id);
      const { data, error: qErr } = await supabase
        .from("profiles")
        .select("push_new_matches, push_messages, email_new_matches, email_messages")
        .eq(key, user.id)
        .maybeSingle();
      if (qErr) throw qErr;
      if (data) {
        setPrefs({
          push_new_matches: data.push_new_matches ?? true,
          push_messages: data.push_messages ?? true,
          email_new_matches: data.email_new_matches ?? true,
          email_messages: data.email_messages ?? true,
        });
      } else {
        setPrefs({
          push_new_matches: true,
          push_messages: true,
          email_new_matches: true,
          email_messages: true,
        });
      }
    } catch (e) {
      if (__DEV__) console.warn("[notifications prefs]", e);
      setPrefs({
        push_new_matches: true,
        push_messages: true,
        email_new_matches: true,
        email_messages: true,
      });
    }
  }, [supabase, user]);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const updatePref = async (
    field: keyof Prefs,
    value: boolean,
  ) => {
    if (!user || prefs === null) return;
    const previous = { ...prefs };
    setPrefs((p) => (p ? { ...p, [field]: value } : null));
    try {
      const key = await resolveProfilesAuthKey(supabase, user.id);
      const { error: uErr } = await supabase.from("profiles").update({ [field]: value }).eq(key, user.id);
      if (uErr) throw uErr;
    } catch (e) {
      if (__DEV__) console.warn("[updatePref]", e);
      setPrefs(previous);
      Alert.alert(t("common.error"), t("profile.error_saving"));
    }
  };

  const hasFeed = profileViews.length > 0 || interests.length > 0;

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
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
          paddingBottom: insets.bottom + 32,
          paddingTop: 16,
        }}
      >
        <Text style={styles.intro}>{t("notifications.intro")}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("notifications.today")}</Text>
          {loading ? (
            <ActivityIndicator color={maakTokens.primary} style={{ marginVertical: 16 }} />
          ) : null}
          {error ? <Text style={styles.err}>{error}</Text> : null}
          {!loading && !hasFeed ? (
            <Text style={styles.muted}>{t("notifications.no_notifications")}</Text>
          ) : null}

          {profileViews.map((v) => (
            <View key={v.id} style={styles.feedRow}>
              <View style={styles.mascotBubble}>
                <Image
                  source={mascotForNotification(v.notification_type)}
                  style={styles.mascotImg}
                  contentFit="contain"
                />
              </View>
              <View style={styles.avatar}>
                {v.viewer_avatar_url ? (
                  <Image
                    source={{ uri: v.viewer_avatar_url }}
                    style={styles.avatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarLetter}>
                    {(v.viewer_display_name || "?").slice(0, 1)}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.feedName} numberOfLines={1}>
                  {v.viewer_display_name || "-"}{" "}
                  <Text style={styles.feedMeta}>{t("notifications.your_view_this")}</Text>
                </Text>
                <Text style={styles.time}>
                  {formatTimeAgo(v.created_at, t)}
                </Text>
              </View>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => router.push(`/user/${encodeURIComponent(v.viewer_id)}`)}
              >
                <Text style={styles.secondaryBtnTxt}>{t("settings.view")}</Text>
              </Pressable>
            </View>
          ))}

          {interests.map((i) => (
            <View key={i.id} style={styles.feedRow}>
              <View style={styles.mascotBubble}>
                <Image
                  source={mascotForNotification(i.notification_type)}
                  style={styles.mascotImg}
                  contentFit="contain"
                />
              </View>
              <View style={styles.avatar}>
                {i.sender_avatar_url ? (
                  <Image
                    source={{ uri: i.sender_avatar_url }}
                    style={styles.avatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarLetter}>
                    {(i.sender_display_name || "?").slice(0, 1)}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.feedName} numberOfLines={1}>
                  {i.sender_display_name || "-"}{" "}
                  <Text style={styles.feedMeta}>{t("notifications.your_match_request")}</Text>
                </Text>
                <Text style={styles.time}>
                  {formatTimeAgo(i.created_at, t)}
                </Text>
              </View>
              <View style={styles.interestActions}>
                <Pressable
                  style={styles.rejectBtn}
                  onPress={() => void rejectInterest(i.id)}
                >
                  <Text style={styles.rejectTxt}>{t("notifications.reject")}</Text>
                </Pressable>
                <Pressable
                  style={styles.acceptBtn}
                  onPress={() => {
                    void (async () => {
                      try {
                        await acceptInterest(i.id);
                        router.replace("/(tabs)");
                      } catch {
                        Alert.alert(t("common.error"), t("notifications.accept_error"));
                      }
                    })();
                  }}
                >
                  <Text style={styles.acceptTxt}>{t("notifications.accept")}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.cardTitle}>{t("notifications.push_and_email")}</Text>
          {prefs === null ? (
            <ActivityIndicator color={maakTokens.primary} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <RowSwitch
                label={t("notifications.push_new_matches")}
                value={prefs.push_new_matches}
                onValueChange={(v) => void updatePref("push_new_matches", v)}
              />
              <RowSwitch
                label={t("notifications.push_messages")}
                value={prefs.push_messages}
                onValueChange={(v) => void updatePref("push_messages", v)}
              />
              <RowSwitch
                label={t("notifications.email_new_matches")}
                value={prefs.email_new_matches}
                onValueChange={(v) => void updatePref("email_new_matches", v)}
              />
              <RowSwitch
                label={t("notifications.email_messages")}
                value={prefs.email_messages}
                onValueChange={(v) => void updatePref("email_messages", v)}
                last
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function RowSwitch({
  label,
  value,
  onValueChange,
  last,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.switchRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: maakTokens.border, true: `${maakTokens.primary}99` }}
        thumbColor={value ? maakTokens.primary : maakTokens.mutedForeground}
      />
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
  intro: { fontSize: 14, color: maakTokens.mutedForeground, marginBottom: 16 },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 12,
  },
  muted: { fontSize: 14, color: maakTokens.mutedForeground },
  err: { fontSize: 14, color: maakTokens.destructive, marginBottom: 8 },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: maakTokens.muted,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarLetter: { fontSize: 16, fontWeight: "600", color: maakTokens.mutedForeground },
  mascotBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${maakTokens.primary}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotImg: { width: 28, height: 28 },
  feedName: { fontSize: 14, fontWeight: "600", color: maakTokens.foreground },
  feedMeta: { fontWeight: "400", color: maakTokens.mutedForeground },
  time: { fontSize: 12, color: maakTokens.mutedForeground, marginTop: 2 },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    backgroundColor: maakTokens.muted,
  },
  secondaryBtnTxt: { fontSize: 13, fontWeight: "600", color: maakTokens.foreground },
  interestActions: { flexDirection: "row", gap: 8, flexShrink: 0 },
  rejectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: maakTokens.radiusMd,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  rejectTxt: { fontSize: 13, fontWeight: "600", color: maakTokens.foreground },
  acceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: maakTokens.primary,
  },
  acceptTxt: { fontSize: 13, fontWeight: "700", color: maakTokens.primaryForeground },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  switchLabel: { fontSize: 14, color: maakTokens.foreground, flex: 1, paddingRight: 12 },
});
