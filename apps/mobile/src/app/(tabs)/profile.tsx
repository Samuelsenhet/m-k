import { ProfilePhotosSection } from "@/components/profile/ProfilePhotosSection";
import { ProfileSettingsSheet } from "@/components/profile/ProfileSettingsSheet";
import { ProfileViewRN } from "@/components/profile/ProfileViewRN";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { archetypeDisplayTitle } from "@/lib/archetypeTitle";
import { consumeReopenSettingsAfterSubscreen } from "@/lib/reopenSettingsAfterSubscreen";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

type ProfileMode = "view" | "edit";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session, isReady } = useSupabase();
  const user = session?.user;
  const posthog = usePostHog();

  const [mode, setMode] = useState<ProfileMode>("view");
  const [viewKey, setViewKey] = useState(0);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [archetype, setArchetype] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setSaveError(null);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const [prof, arch] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, bio")
          .eq(profileKey, user.id)
          .maybeSingle(),
        supabase
          .from("personality_results")
          .select("archetype")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setDisplayName(prof.data?.display_name ?? "");
      setBio(prof.data?.bio ?? "");
      setArchetype(arch.data?.archetype ?? null);
    } catch (e) {
      if (__DEV__) console.error("[profile tab]", e);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/phone-auth");
      return;
    }
  }, [isReady, user, router]);

  useEffect(() => {
    if (!isReady || !user || mode !== "edit") return;
    void load();
  }, [isReady, user, mode, load]);

  useFocusEffect(
    useCallback(() => {
      if (consumeReopenSettingsAfterSubscreen()) {
        setSettingsOpen(true);
      }
    }, []),
  );

  const save = async () => {
    if (!user || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
        })
        .eq(profileKey, user.id);
      if (error) throw error;
      posthog.capture('profile_saved', {
        has_display_name: !!displayName.trim(),
        has_bio: !!bio.trim(),
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      setViewKey((k) => k + 1);
      setMode("view");
    } catch (e) {
      setSaveError(t("profile.error_saving"));
      if (__DEV__) console.error("[profile save]", e);
      posthog.capture("profile_save_failed", {
        error_message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    // Wrapped so a flaky network or router failure surfaces as a dialog
    // instead of crashing the tab. Happy path still redirects away.
    try {
      posthog.capture("user_signed_out");
      posthog.reset();
      await supabase.auth.signOut();
      router.replace("/phone-auth");
    } catch (e) {
      if (__DEV__) console.error("[profile signOut]", e);
      posthog.capture("sign_out_failed", {
        error_message: e instanceof Error ? e.message : String(e),
      });
      // Surface a friendly dialog rather than letting the exception bubble.
      const { Alert } = await import("react-native");
      Alert.alert(
        t("common.error", { defaultValue: "Något gick fel" }),
        t("profile.error_sign_out", {
          defaultValue: "Kunde inte logga ut. Kontrollera din anslutning och försök igen.",
        }),
      );
    }
  };

  if (!isReady || (!user && isReady)) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={maakTokens.primary} />
      </View>
    );
  }

  if (mode === "view") {
    return (
      <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
        <ProfileViewRN
          key={viewKey}
          onEdit={() => setMode("edit")}
          onSettings={() => setSettingsOpen(true)}
        />
        <ProfileSettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        /* Tab scene sits above the bar - no tabBarHeight. Extra tail so photo grid clears the tab bar when scrolled. */
        paddingBottom: insets.bottom + 56,
        paddingHorizontal: maakTokens.screenPaddingHorizontal,
      }}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t("nav.profile")}</Text>
        <Pressable
          onPress={() => setSettingsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t("settings.title")}
          hitSlop={12}
        >
          <Text style={styles.gear}>⚙</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setMode("view")} style={styles.backToView} hitSlop={8}>
        <Text style={styles.backToViewText}>{t("profile.view_profile")}</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={maakTokens.primary} />
      ) : (
        <>
          {user ? (
            <ProfilePhotosSection userId={user.id} onPhotosUpdated={() => void load()} />
          ) : null}
          <View style={styles.card}>
            <Text style={styles.label}>{t("profile.displayName")}</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t("onboarding.step_name")}
              placeholderTextColor={maakTokens.mutedForeground}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>{t("profile.bio")}</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder={t("profile.bio_placeholder")}
              placeholderTextColor={maakTokens.mutedForeground}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />

            {archetype ? (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>{t("personality.archetype")}</Text>
                <Text style={styles.readonly}>{archetypeDisplayTitle(archetype, t)}</Text>
              </>
            ) : null}
          </View>

          {saveError ? <Text style={styles.err}>{saveError}</Text> : null}
          {savedFlash ? (
            <Text style={styles.saved}>{t("profile.changes_saved")}</Text>
          ) : null}

          <Pressable
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={() => void save()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={maakTokens.primaryForeground} />
            ) : (
              <Text style={styles.primaryBtnText}>{t("common.save")}</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => void signOut()}>
            <Text style={styles.secondaryBtnText}>{t("settings.logout")}</Text>
          </Pressable>
        </>
      )}

      <ProfileSettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: maakTokens.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: maakTokens.foreground,
    flex: 1,
  },
  gear: { fontSize: 22, color: maakTokens.primary },
  backToView: { alignSelf: "flex-start", marginBottom: 12 },
  backToViewText: { fontSize: 15, fontWeight: "600", color: maakTokens.primary },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 18,
    marginTop: 12,
  },
  label: { fontSize: 12, fontWeight: "600", color: maakTokens.mutedForeground, textTransform: "uppercase" },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusLg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: maakTokens.foreground,
  },
  bioInput: { minHeight: 100, paddingTop: 12 },
  readonly: { fontSize: 16, fontWeight: "600", color: maakTokens.foreground, marginTop: 6 },
  err: { color: maakTokens.destructive, marginTop: 12 },
  saved: { color: maakTokens.primary, fontWeight: "600", marginTop: 12 },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: maakTokens.primaryForeground, fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    alignItems: "center",
  },
  secondaryBtnText: { color: maakTokens.primary, fontWeight: "700", fontSize: 16 },
});
