import { SelectField } from "@/components/onboarding/SelectField";
import {
  ALCOHOL_OPTIONS,
  GENDER_OPTIONS,
  LOOKING_FOR_OPTIONS,
  POLITICS_OPTIONS,
  PRONOUN_OPTIONS,
  RELIGION_OPTIONS,
  SEXUALITY_OPTIONS,
  SMOKING_OPTIONS,
} from "@/components/onboarding/onboardingOptions";
import { ProfilePhotosSection } from "@/components/profile/ProfilePhotosSection";
import { ProfileSettingsSheet } from "@/components/profile/ProfileSettingsSheet";
import { ProfileViewRN } from "@/components/profile/ProfileViewRN";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { archetypeDisplayTitle } from "@/lib/archetypeTitle";
import { localizeSelectOptions } from "@/lib/localizeSelectOptions";
import { consumeReopenSettingsAfterSubscreen } from "@/lib/reopenSettingsAfterSubscreen";
import { maakTokens } from "@maak/core";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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

  // Basics
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [gender, setGender] = useState("");
  const [sexuality, setSexuality] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [height, setHeight] = useState("");

  // Social
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Background
  const [hometown, setHometown] = useState("");
  const [work, setWork] = useState("");
  const [education, setEducation] = useState("");
  const [religion, setReligion] = useState("");
  const [politics, setPolitics] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [smoking, setSmoking] = useState("");

  // Privacy toggles
  const [showAge, setShowAge] = useState(true);
  const [showJob, setShowJob] = useState(true);
  const [showEducation, setShowEducation] = useState(true);
  const [showLastName, setShowLastName] = useState(true);

  // Meta
  const [archetype, setArchetype] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(0);

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
      const [prof, arch, photos] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "display_name, bio, pronouns, gender, sexuality, looking_for, height, instagram, linkedin, hometown, work, education, religion, politics, alcohol, smoking, show_age, show_job, show_education, show_last_name",
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("personality_results")
          .select("archetype")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_photos")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      const p = prof.data;
      setDisplayName(p?.display_name ?? "");
      setBio(p?.bio ?? "");
      setPronouns(p?.pronouns ?? "");
      setGender(p?.gender ?? "");
      setSexuality(p?.sexuality ?? "");
      setLookingFor(p?.looking_for ?? "");
      setHeight(p?.height != null ? String(p.height) : "");
      setInstagram(p?.instagram ?? "");
      setLinkedin(p?.linkedin ?? "");
      setHometown(p?.hometown ?? "");
      setWork(p?.work ?? "");
      setEducation(p?.education ?? "");
      setReligion(p?.religion ?? "");
      setPolitics(p?.politics ?? "");
      setAlcohol(p?.alcohol ?? "");
      setSmoking(p?.smoking ?? "");
      setShowAge(p?.show_age ?? true);
      setShowJob(p?.show_job ?? true);
      setShowEducation(p?.show_education ?? true);
      setShowLastName(p?.show_last_name ?? true);
      setArchetype(arch.data?.archetype ?? null);
      setPhotoCount(photos.count ?? 0);
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

  // Mirrors OnboardingWizardRN.calculateCompletion (9-point scale).
  const calculateCompletion = () => {
    let filled = 0;
    const total = 9;
    if (displayName.trim()) filled++;
    if (gender) filled++;
    if (sexuality) filled++;
    if (lookingFor) filled++;
    if (archetype) filled++;
    if (photoCount >= 1) filled++;
    if (photoCount >= 4) filled++;
    if (hometown.trim() || work.trim() || education.trim()) filled++;
    if (pronouns || height.trim()) filled++;
    return Math.round((filled / total) * 100);
  };

  const save = async () => {
    if (!user || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const heightInt = height.trim() ? parseInt(height, 10) : null;
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          pronouns: pronouns || null,
          gender: gender || null,
          sexuality: sexuality || null,
          looking_for: lookingFor || null,
          height: Number.isFinite(heightInt) ? heightInt : null,
          instagram: instagram.trim() || null,
          linkedin: linkedin.trim() || null,
          hometown: hometown.trim() || null,
          work: work.trim() || null,
          education: education.trim() || null,
          religion: religion || null,
          politics: politics || null,
          alcohol: alcohol || null,
          smoking: smoking || null,
          show_age: showAge,
          show_job: showJob,
          show_education: showEducation,
          show_last_name: showLastName,
          profile_completion: calculateCompletion(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      posthog.capture("profile_saved", {
        has_display_name: !!displayName.trim(),
        has_bio: !!bio.trim(),
        completion: calculateCompletion(),
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

  const selectPlaceholder = t("mobile.select.placeholder");

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
        paddingTop: insets.top + 16,
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

          {/* Grundläggande */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("profile.section_basics", { defaultValue: "Grundläggande" })}
            </Text>

            <Text style={styles.label}>{t("profile.displayName")}</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t("onboarding.step_name")}
              placeholderTextColor={maakTokens.mutedForeground}
            />

            <Text style={[styles.label, styles.labelTop]}>{t("profile.bio")}</Text>
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

            <View style={styles.fieldTop}>
              <SelectField
                label={t("mobile.wizard.pronouns")}
                value={pronouns}
                placeholder={selectPlaceholder}
                options={localizeSelectOptions(PRONOUN_OPTIONS, "pronoun", t)}
                onValueChange={setPronouns}
              />
            </View>
            <View style={styles.fieldTop}>
              <SelectField
                label={t("mobile.wizard.identify_as")}
                value={gender}
                placeholder={selectPlaceholder}
                options={localizeSelectOptions(GENDER_OPTIONS, "gender", t)}
                onValueChange={setGender}
              />
            </View>
            <View style={styles.fieldTop}>
              <SelectField
                label={t("mobile.wizard.sexuality")}
                value={sexuality}
                placeholder={selectPlaceholder}
                options={localizeSelectOptions(SEXUALITY_OPTIONS, "sexuality", t)}
                onValueChange={setSexuality}
              />
            </View>
            <View style={styles.fieldTop}>
              <SelectField
                label={t("mobile.wizard.looking_for")}
                value={lookingFor}
                placeholder={selectPlaceholder}
                options={localizeSelectOptions(LOOKING_FOR_OPTIONS, "looking_for", t)}
                onValueChange={setLookingFor}
              />
            </View>

            <Text style={[styles.label, styles.labelTop]}>{t("mobile.wizard.height_cm")}</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={(v) => setHeight(v.replace(/\D/g, ""))}
              placeholder={t("mobile.wizard.height_cm_ph")}
              placeholderTextColor={maakTokens.mutedForeground}
              keyboardType="number-pad"
              maxLength={3}
            />

            {archetype ? (
              <>
                <Text style={[styles.label, styles.labelTop]}>{t("personality.archetype")}</Text>
                <Text style={styles.readonly}>{archetypeDisplayTitle(archetype, t)}</Text>
              </>
            ) : null}
          </View>

          {/* Socialt */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("profile.section_social", { defaultValue: "Socialt" })}
            </Text>

            <Text style={styles.label}>{t("mobile.wizard.instagram")}</Text>
            <TextInput
              style={styles.input}
              value={instagram}
              onChangeText={setInstagram}
              placeholder={t("mobile.wizard.username_ph")}
              placeholderTextColor={maakTokens.mutedForeground}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="twitter"
              maxLength={64}
            />

            <Text style={[styles.label, styles.labelTop]}>{t("mobile.wizard.linkedin")}</Text>
            <TextInput
              style={styles.input}
              value={linkedin}
              onChangeText={setLinkedin}
              placeholder={t("mobile.wizard.username_ph")}
              placeholderTextColor={maakTokens.mutedForeground}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="twitter"
              maxLength={128}
            />
          </View>

          {/* Bakgrund */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("profile.section_background", { defaultValue: "Bakgrund" })}
            </Text>

            <Text style={styles.label}>{t("mobile.wizard.hometown")}</Text>
            <TextInput
              style={styles.input}
              value={hometown}
              onChangeText={setHometown}
              placeholder={t("mobile.wizard.hometown_ph")}
              placeholderTextColor={maakTokens.mutedForeground}
              maxLength={120}
            />

            <Text style={[styles.label, styles.labelTop]}>{t("mobile.wizard.work")}</Text>
            <TextInput
              style={styles.input}
              value={work}
              onChangeText={setWork}
              placeholderTextColor={maakTokens.mutedForeground}
              maxLength={120}
            />

            <Text style={[styles.label, styles.labelTop]}>{t("mobile.wizard.education")}</Text>
            <TextInput
              style={styles.input}
              value={education}
              onChangeText={setEducation}
              placeholderTextColor={maakTokens.mutedForeground}
              maxLength={120}
            />

            <View style={styles.fieldTop}>
              <SelectField
                label={t("mobile.wizard.religion")}
                value={religion}
                placeholder={selectPlaceholder}
                options={localizeSelectOptions(RELIGION_OPTIONS, "religion", t)}
                onValueChange={setReligion}
              />
            </View>
            <View style={styles.fieldTop}>
              <SelectField
                label={t("mobile.wizard.politics")}
                value={politics}
                placeholder={selectPlaceholder}
                options={localizeSelectOptions(POLITICS_OPTIONS, "politics", t)}
                onValueChange={setPolitics}
              />
            </View>
            <View style={styles.fieldTop}>
              <SelectField
                label={t("mobile.wizard.alcohol")}
                value={alcohol}
                placeholder={selectPlaceholder}
                options={localizeSelectOptions(ALCOHOL_OPTIONS, "alcohol", t)}
                onValueChange={setAlcohol}
              />
            </View>
            <View style={styles.fieldTop}>
              <SelectField
                label={t("mobile.wizard.smoking")}
                value={smoking}
                placeholder={selectPlaceholder}
                options={localizeSelectOptions(SMOKING_OPTIONS, "smoking", t)}
                onValueChange={setSmoking}
              />
            </View>
          </View>

          {/* Integritet */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("profile.section_privacy", { defaultValue: "Integritet" })}
            </Text>

            <PrivacyToggle
              label={t("mobile.wizard.show_age")}
              value={showAge}
              onValueChange={setShowAge}
            />
            <PrivacyToggle
              label={t("mobile.wizard.show_job")}
              value={showJob}
              onValueChange={setShowJob}
            />
            <PrivacyToggle
              label={t("mobile.wizard.show_education")}
              value={showEducation}
              onValueChange={setShowEducation}
            />
            <PrivacyToggle
              label={t("mobile.wizard.show_last_name")}
              value={showLastName}
              onValueChange={setShowLastName}
            />
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
    </KeyboardAvoidingView>
  );
}

function PrivacyToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: maakTokens.primary, false: maakTokens.border }}
        accessibilityLabel={label}
      />
    </View>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 12,
  },
  label: { fontSize: 12, fontWeight: "600", color: maakTokens.mutedForeground, textTransform: "uppercase" },
  labelTop: { marginTop: 16 },
  fieldTop: { marginTop: 16 },
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  switchLabel: { fontSize: 15, color: maakTokens.foreground, flex: 1, paddingRight: 12 },
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
