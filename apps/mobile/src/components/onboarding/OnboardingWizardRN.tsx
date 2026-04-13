import { Emoji } from "@/components/Emoji";
import { IdVerificationPlaceholderRN } from "@/components/onboarding/IdVerificationPlaceholderRN";
import { PersonalityResultRN } from "@/components/onboarding/PersonalityResultRN";
import { PersonalityTestRN } from "@/components/onboarding/PersonalityTestRN";
import {
  type PhotoSlotRN,
  PhotoUploadRN,
} from "@/components/onboarding/PhotoUploadRN";
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
import { useSupabase } from "@/contexts/SupabaseProvider";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { localizeSelectOptions } from "@/lib/localizeSelectOptions";
import {
  ARCHETYPE_INFO,
  maakTokens,
  resolveProfilesAuthKey,
  type PersonalityTestResult,
} from "@maak/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ProfileData {
  firstName: string;
  lastName: string;
  pronouns: string;
  gender: string;
  height: string;
  instagram: string;
  linkedin: string;
  sexuality: string;
  lookingFor: string;
  hometown: string;
  work: string;
  education: string;
  religion: string;
  politics: string;
  alcohol: string;
  smoking: string;
}

interface PrivacySettings {
  showAge: boolean;
  showJob: boolean;
  showEducation: boolean;
  showLastName: boolean;
}

type Props = { onComplete: () => void; userId: string };

export function OnboardingWizardRN({ onComplete, userId }: Props) {
  const { t, i18n } = useTranslation();
  const { supabase, hasValidSupabaseConfig } = useSupabase();
  const onlineCount = useOnlineCount(userId, hasValidSupabaseConfig);

  const STEPS = useMemo(
    () => [
      t("mobile.wizard.step_basic"),
      t("mobile.wizard.step_personality"),
      t("mobile.wizard.step_background"),
      t("mobile.wizard.step_photos"),
      t("mobile.wizard.step_privacy"),
      t("mobile.wizard.step_id"),
      t("mobile.wizard.step_done"),
    ],
    [t, i18n.language],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    pronouns: "",
    gender: "",
    height: "",
    instagram: "",
    linkedin: "",
    sexuality: "",
    lookingFor: "",
    hometown: "",
    work: "",
    education: "",
    religion: "",
    politics: "",
    alcohol: "",
    smoking: "",
  });

  const [personalityResult, setPersonalityResult] =
    useState<PersonalityTestResult | null>(null);
  const [showPersonalityResult, setShowPersonalityResult] = useState(false);
  const [hasExistingPersonality, setHasExistingPersonality] = useState(false);

  const [photos, setPhotos] = useState<PhotoSlotRN[]>(
    Array.from({ length: 6 }, (_, i) => ({
      storage_path: "",
      display_order: i,
      prompt: "",
    })),
  );

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showAge: true,
    showJob: true,
    showEducation: true,
    showLastName: false,
  });

  const photoCount = photos.filter((p) => p.storage_path).length;

  const checkExistingPersonality = useCallback(async () => {
    const { data } = await supabase
      .from("personality_results")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setHasExistingPersonality(true);
      setPersonalityResult({
        scores: data.scores as PersonalityTestResult["scores"],
        category: data.category as PersonalityTestResult["category"],
        archetype: (data.archetype || "INFJ") as PersonalityTestResult["archetype"],
        answers: [],
      });
    }
  }, [supabase, userId]);

  useEffect(() => {
    void checkExistingPersonality();
  }, [checkExistingPersonality]);

  const calculateCompletion = () => {
    let filled = 0;
    const total = 9;
    if (profile.firstName) filled++;
    if (profile.gender) filled++;
    if (profile.sexuality) filled++;
    if (profile.lookingFor) filled++;
    if (personalityResult) filled++;
    if (photoCount >= 1) filled++;
    if (photoCount >= 4) filled++;
    if (profile.hometown || profile.work || profile.education) filled++;
    if (profile.pronouns || profile.height) filled++;
    return Math.round((filled / total) * 100);
  };

  const updateProfile = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          profile.firstName.trim().length >= 2 &&
          !!profile.gender &&
          !!profile.sexuality &&
          !!profile.lookingFor
        );
      case 1:
        return personalityResult !== null;
      case 2:
      case 4:
      case 5:
      case 6:
        return true;
      case 3:
        return photoCount >= 1;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      void handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  const handleSkip = () => setCurrentStep((p) => p + 1);

  const handlePersonalityComplete = async (result: PersonalityTestResult) => {
    setPersonalityResult(result);
    setShowPersonalityResult(true);
    if (!hasExistingPersonality) {
      await supabase.from("personality_results").insert({
        user_id: userId,
        scores: result.scores,
        category: result.category,
        archetype: result.archetype,
      });
    }
  };

  const handlePersonalityResultContinue = () => {
    setShowPersonalityResult(false);
    handleNext();
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const profileKey = await resolveProfilesAuthKey(supabase, userId);
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name:
            profile.firstName + (profile.lastName ? ` ${profile.lastName}` : ""),
          pronouns: profile.pronouns || null,
          gender: profile.gender,
          height: profile.height ? parseInt(profile.height, 10) : null,
          sexuality: profile.sexuality,
          looking_for: profile.lookingFor,
          hometown: profile.hometown || null,
          work: profile.work || null,
          education: profile.education || null,
          instagram: profile.instagram || null,
          linkedin: profile.linkedin || null,
          religion: profile.religion || null,
          politics: profile.politics || null,
          alcohol: profile.alcohol || null,
          smoking: profile.smoking || null,
          profile_completion: calculateCompletion(),
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
          show_age: privacy.showAge,
          show_job: privacy.showJob,
          show_education: privacy.showEducation,
          show_last_name: privacy.showLastName,
        })
        .eq(profileKey, userId);

      if (error) throw error;
      Alert.alert("", t("mobile.wizard.profile_created"));
      onComplete();
    } catch (e) {
      Alert.alert(t("mobile.wizard.save_failed_title"), e instanceof Error ? e.message : "");
    } finally {
      setSaving(false);
    }
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const completion = calculateCompletion();

  if (currentStep === 1 && !personalityResult) {
    return <PersonalityTestRN onComplete={handlePersonalityComplete} />;
  }

  if (showPersonalityResult && personalityResult) {
    return (
      <PersonalityResultRN
        result={personalityResult}
        onContinue={handlePersonalityResultContinue}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandHeart}>♥</Text>
          <Text style={styles.brand}>MÄÄK</Text>
        </View>
        {hasValidSupabaseConfig ? (
          <Text style={styles.online}>
            {t("common.online_now_full", {
              count: onlineCount.toLocaleString(i18n.language.startsWith("en") ? "en-US" : "sv-SE"),
            })}
          </Text>
        ) : null}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>
        <Text style={styles.stepHint}>
          {t("mobile.wizard.step_indicator", {
            current: currentStep + 1,
            total: STEPS.length,
            label: STEPS[currentStep],
          })}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {currentStep === 0 && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t("mobile.wizard.about_you_title")}</Text>
            <Text style={styles.stepSub}>{t("mobile.wizard.about_you_sub")}</Text>
            <Text style={styles.label}>{t("mobile.wizard.first_name")}</Text>
            <TextInput
              style={styles.input}
              value={profile.firstName}
              onChangeText={(v) => updateProfile("firstName", v)}
              placeholder={t("mobile.wizard.first_name_ph")}
            />
            <Text style={styles.label}>{t("mobile.wizard.last_name")}</Text>
            <TextInput
              style={styles.input}
              value={profile.lastName}
              onChangeText={(v) => updateProfile("lastName", v)}
              placeholder={t("mobile.wizard.optional_ph")}
            />
            <SelectField
              label={t("mobile.wizard.pronouns")}
              value={profile.pronouns}
              placeholder={t("mobile.select.placeholder")}
              options={localizeSelectOptions(PRONOUN_OPTIONS, "pronoun", t)}
              onValueChange={(v) => updateProfile("pronouns", v)}
            />
            <Text style={styles.label}>{t("mobile.wizard.height_cm")}</Text>
            <TextInput
              style={styles.input}
              value={profile.height}
              onChangeText={(v) => updateProfile("height", v.replace(/\D/g, ""))}
              placeholder={t("mobile.wizard.height_cm_ph")}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>{t("mobile.wizard.instagram")}</Text>
            <TextInput
              style={styles.input}
              value={profile.instagram}
              onChangeText={(v) => updateProfile("instagram", v)}
              placeholder={t("mobile.wizard.username_ph")}
            />
            <Text style={styles.label}>{t("mobile.wizard.linkedin")}</Text>
            <TextInput
              style={styles.input}
              value={profile.linkedin}
              onChangeText={(v) => updateProfile("linkedin", v)}
              placeholder={t("mobile.wizard.username_ph")}
            />
            <SelectField
              label={t("mobile.wizard.identify_as")}
              value={profile.gender}
              placeholder={t("mobile.select.placeholder")}
              options={localizeSelectOptions(GENDER_OPTIONS, "gender", t)}
              onValueChange={(v) => updateProfile("gender", v)}
            />
            <SelectField
              label={t("mobile.wizard.sexuality")}
              value={profile.sexuality}
              placeholder={t("mobile.select.placeholder")}
              options={localizeSelectOptions(SEXUALITY_OPTIONS, "sexuality", t)}
              onValueChange={(v) => updateProfile("sexuality", v)}
            />
            <SelectField
              label={t("mobile.wizard.looking_for")}
              value={profile.lookingFor}
              placeholder={t("mobile.select.placeholder")}
              options={localizeSelectOptions(LOOKING_FOR_OPTIONS, "looking_for", t)}
              onValueChange={(v) => updateProfile("lookingFor", v)}
            />
          </View>
        )}

        {currentStep === 1 && personalityResult && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t("mobile.wizard.your_personality")}</Text>
            <Text style={styles.stepSub}>
              {hasExistingPersonality
                ? t("mobile.wizard.already_did_test")
                : t("mobile.wizard.test_done")}
            </Text>
            <View style={styles.card}>
              <Emoji style={styles.bigEmoji}>
                {ARCHETYPE_INFO[personalityResult.archetype].emoji}
              </Emoji>
              <Text style={styles.cardTitle}>
                {ARCHETYPE_INFO[personalityResult.archetype].name}
              </Text>
              <Text style={styles.cardSub}>
                {t(`personality.archetypes.${personalityResult.archetype}.title`, {
                  defaultValue: ARCHETYPE_INFO[personalityResult.archetype].title,
                })}
              </Text>
              <Text style={styles.cardDesc}>
                {t(`personality.archetypes.${personalityResult.archetype}.description`, {
                  defaultValue: ARCHETYPE_INFO[personalityResult.archetype].description,
                })}
              </Text>
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t("mobile.wizard.background_title")}</Text>
            <Text style={styles.stepSub}>{t("mobile.wizard.background_sub")}</Text>
            <Text style={styles.label}>{t("mobile.wizard.hometown")}</Text>
            <TextInput
              style={styles.input}
              value={profile.hometown}
              onChangeText={(v) => updateProfile("hometown", v)}
              placeholder={t("mobile.wizard.hometown_ph")}
            />
            <Text style={styles.label}>{t("mobile.wizard.work")}</Text>
            <TextInput
              style={styles.input}
              value={profile.work}
              onChangeText={(v) => updateProfile("work", v)}
            />
            <Text style={styles.label}>{t("mobile.wizard.education")}</Text>
            <TextInput
              style={styles.input}
              value={profile.education}
              onChangeText={(v) => updateProfile("education", v)}
            />
            <SelectField
              label={t("mobile.wizard.religion")}
              value={profile.religion}
              placeholder={t("mobile.select.placeholder")}
              options={localizeSelectOptions(RELIGION_OPTIONS, "religion", t)}
              onValueChange={(v) => updateProfile("religion", v)}
            />
            <SelectField
              label={t("mobile.wizard.politics")}
              value={profile.politics}
              placeholder={t("mobile.select.placeholder")}
              options={localizeSelectOptions(POLITICS_OPTIONS, "politics", t)}
              onValueChange={(v) => updateProfile("politics", v)}
            />
            <SelectField
              label={t("mobile.wizard.alcohol")}
              value={profile.alcohol}
              placeholder={t("mobile.select.placeholder")}
              options={localizeSelectOptions(ALCOHOL_OPTIONS, "alcohol", t)}
              onValueChange={(v) => updateProfile("alcohol", v)}
            />
            <SelectField
              label={t("mobile.wizard.smoking")}
              value={profile.smoking}
              placeholder={t("mobile.select.placeholder")}
              options={localizeSelectOptions(SMOKING_OPTIONS, "smoking", t)}
              onValueChange={(v) => updateProfile("smoking", v)}
            />
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t("mobile.wizard.show_yourself_title")}</Text>
            <Text style={styles.stepSub}>{t("mobile.wizard.show_yourself_sub")}</Text>
            <PhotoUploadRN userId={userId} photos={photos} onPhotosChange={setPhotos} />
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t("mobile.wizard.privacy_title")}</Text>
            <Text style={styles.stepSub}>{t("mobile.wizard.privacy_sub")}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("mobile.wizard.show_age")}</Text>
              <Switch
                value={privacy.showAge}
                onValueChange={(v) => setPrivacy((p) => ({ ...p, showAge: v }))}
                trackColor={{ true: maakTokens.primary }}
                accessibilityLabel={t("mobile.wizard.show_age")}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("mobile.wizard.show_job")}</Text>
              <Switch
                value={privacy.showJob}
                onValueChange={(v) => setPrivacy((p) => ({ ...p, showJob: v }))}
                trackColor={{ true: maakTokens.primary }}
                accessibilityLabel={t("mobile.wizard.show_job")}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("mobile.wizard.show_education")}</Text>
              <Switch
                value={privacy.showEducation}
                onValueChange={(v) => setPrivacy((p) => ({ ...p, showEducation: v }))}
                trackColor={{ true: maakTokens.primary }}
                accessibilityLabel={t("mobile.wizard.show_education")}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("mobile.wizard.show_last_name")}</Text>
              <Switch
                value={privacy.showLastName}
                onValueChange={(v) => setPrivacy((p) => ({ ...p, showLastName: v }))}
                trackColor={{ true: maakTokens.primary }}
                accessibilityLabel={t("mobile.wizard.show_last_name")}
              />
            </View>
          </View>
        )}

        {currentStep === 5 && (
          <IdVerificationPlaceholderRN onContinue={() => setCurrentStep((p) => p + 1)} />
        )}

        {currentStep === 6 && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>
              {t("mobile.wizard.complete_title", { percent: completion })}
            </Text>
            <Text style={styles.stepSub}>{t("mobile.wizard.complete_sub")}</Text>
            <View style={styles.summaryCard}>
              {photos[0]?.storage_path ? (
                <View style={styles.summaryRow}>
                  <Image
                    source={{ uri: getPhotoUrl(photos[0].storage_path) }}
                    style={styles.summaryImg}
                  />
                  <Text style={styles.summaryName}>
                    {profile.firstName} {profile.lastName}
                  </Text>
                </View>
              ) : (
                <Text style={styles.summaryName}>
                  {profile.firstName} {profile.lastName}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
        <View style={styles.footer}>
          {currentStep > 0 && (
            <Pressable style={styles.ghostBtn} onPress={handleBack}>
              <Text style={styles.ghostText}>{t("mobile.wizard.back")}</Text>
            </Pressable>
          )}
          {(currentStep === 2 || currentStep === 5) && (
            <Pressable style={styles.ghostBtn} onPress={handleSkip}>
              <Text style={styles.ghostText}>{t("mobile.wizard.skip")}</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.primaryBtn, (!canProceed() || saving) && styles.disabled]}
            onPress={() => void (currentStep === STEPS.length - 1 ? handleComplete() : handleNext())}
            disabled={!canProceed() || saving}
          >
            {saving ? (
              <ActivityIndicator color={maakTokens.primaryForeground} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {currentStep === STEPS.length - 1
                  ? t("mobile.wizard.cta_start")
                  : currentStep === 0
                    ? t("mobile.wizard.cta_next_test")
                    : t("mobile.wizard.continue")}
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: maakTokens.background },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  brandHeart: { fontSize: 22, color: maakTokens.primary },
  brand: { fontSize: 20, fontWeight: "700", color: maakTokens.foreground },
  online: {
    textAlign: "center",
    fontSize: 12,
    color: maakTokens.primary,
    fontWeight: "600",
    marginTop: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: maakTokens.muted,
    borderRadius: 4,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: maakTokens.primary, borderRadius: 4 },
  stepHint: {
    fontSize: 12,
    color: maakTokens.mutedForeground,
    marginTop: 6,
    textAlign: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  section: { gap: 12 },
  stepTitle: { fontSize: 20, fontWeight: "700", color: maakTokens.foreground, textAlign: "center" },
  stepSub: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: "600", color: maakTokens.foreground },
  input: {
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    padding: 12,
    fontSize: 16,
    backgroundColor: maakTokens.card,
    color: maakTokens.foreground,
  },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    padding: 20,
    borderWidth: 1,
    borderColor: maakTokens.border,
    alignItems: "center",
  },
  bigEmoji: { fontSize: 48, marginBottom: 8 },
  cardTitle: { fontSize: 22, fontWeight: "700", color: maakTokens.foreground },
  cardSub: { fontSize: 15, color: maakTokens.primary, fontWeight: "600", marginTop: 4 },
  cardDesc: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: maakTokens.border,
  },
  switchLabel: { fontSize: 15, color: maakTokens.foreground, flex: 1, paddingRight: 12 },
  summaryCard: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    padding: 16,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryImg: { width: 64, height: 64, borderRadius: 12 },
  summaryName: { fontSize: 17, fontWeight: "600", color: maakTokens.foreground },
  footerSafe: {
    borderTopWidth: 1,
    borderTopColor: maakTokens.border,
    backgroundColor: maakTokens.card,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  ghostBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: maakTokens.radiusMd,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  ghostText: { color: maakTokens.primary, fontWeight: "600" },
  primaryBtn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: maakTokens.primaryForeground, fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
