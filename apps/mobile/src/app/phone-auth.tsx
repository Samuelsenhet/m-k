import { AgeVerificationRN } from "@/components/AgeVerificationRN";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { usePhoneAuth } from "@/hooks/usePhoneAuth";
import { calculateAge } from "@/lib/age";
import { maakTokens, resolveProfilesAuthKey } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { usePostHog } from "posthog-react-native";

/** Same grouping as web `PhoneInput` (Swedish mobile: 07X XXX XX XX). */
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
};

export default function PhoneAuthScreen() {
  const { t, i18n } = useTranslation();

  const phoneSchema = useMemo(
    () =>
      z
        .string()
        .min(9, t("auth.phone_invalid_min"))
        .max(10, t("auth.phone_invalid_max"))
        .regex(/^0?7[0-9]{8}$/, t("auth.phone_invalid_se")),
    [t, i18n.language],
  );

  const otpSchema = useMemo(() => z.string().length(6, t("auth.otp_length")), [t, i18n.language]);

  const profileSchema = useMemo(
    () =>
      z.object({
        dateOfBirth: z.object({
          day: z.string().min(1, t("auth.pick_day")),
          month: z.string().min(1, t("auth.pick_month")),
          year: z.string().min(1, t("auth.pick_year")),
        }),
      }),
    [t, i18n.language],
  );
  const router = useRouter();
  const posthog = usePostHog();
  const { supabase, session } = useSupabase();
  const {
    step,
    loading,
    error,
    sendOtp,
    verifyOtp,
    resendOtp,
    setStep,
    clearError,
    hasValidSupabaseConfig,
  } = usePhoneAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState({ day: "", month: "", year: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!session?.user || isCompletingProfile) return;
      const profileKey = await resolveProfilesAuthKey(supabase, session.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, date_of_birth")
        .eq(profileKey, session.user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        posthog.identify(session.user.id, {
          $set: { phone_verified: true },
        });
        router.replace("/(tabs)");
        return;
      }
      if (profile?.date_of_birth) {
        posthog.identify(session.user.id, {
          $set: { phone_verified: true },
        });
        router.replace("/onboarding");
        return;
      }
      setStep("profile");
    };
    void checkUserStatus();
  }, [session, supabase, router, isCompletingProfile, setStep]);

  useEffect(() => {
    if (countdown > 0) {
      const tmr = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(tmr);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    try {
      phoneSchema.parse(phone);
      setErrors({});
      clearError();
      const ok = await sendOtp(phone);
      if (ok) {
        posthog.capture('otp_requested');
        Alert.alert("", `${t("auth.sendCode")}!`);
        setCountdown(60);
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors({ phone: e.issues[0]?.message ?? t("auth.invalid_number") });
      }
    }
  };

  const handleVerifyOtp = async () => {
    try {
      otpSchema.parse(otp);
      setErrors({});
      clearError();
      const ok = await verifyOtp(phone, otp);
      if (ok) {
        posthog.capture('otp_verified');
        Alert.alert("", `${t("auth.verify")}!`);
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors({ otp: e.issues[0]?.message ?? t("auth.invalid_code") });
      }
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    clearError();
    const ok = await resendOtp(phone);
    if (ok) {
      Alert.alert("", `${t("auth.resendCode")}!`);
      setCountdown(60);
    }
  };

  const handleCompleteProfile = async () => {
    try {
      profileSchema.parse({ dateOfBirth });
      const age = calculateAge(dateOfBirth.day, dateOfBirth.month, dateOfBirth.year);
      if (age < 20) {
        setErrors({ age: t("auth.error_too_young") });
        return;
      }
      setErrors({});
      setIsCompletingProfile(true);

      const dobString = `${dateOfBirth.year}-${dateOfBirth.month.padStart(2, "0")}-${dateOfBirth.day.padStart(2, "0")}`;
      const formattedPhone = phone.startsWith("0") ? `+46${phone.slice(1)}` : `+46${phone}`;

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        Alert.alert(t("common.error"), t("common.retry"));
        setStep("phone");
        setIsCompletingProfile(false);
        return;
      }

      const sessionUserId = sess.session.user.id;
      const profileKey = await resolveProfilesAuthKey(supabase, sessionUserId);
      const patch = {
        date_of_birth: dobString,
        phone: formattedPhone,
        phone_verified_at: new Date().toISOString(),
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(patch)
        .eq(profileKey, sessionUserId)
        .select("date_of_birth, onboarding_completed")
        .maybeSingle();

      let savedProfile = updatedProfile;

      if (updateError || !savedProfile) {
        const insertWithKey = async (key: "id" | "user_id") => {
          const insertPayload =
            key === "id"
              ? { id: sessionUserId, ...patch }
              : { user_id: sessionUserId, ...patch };
          return supabase
            .from("profiles")
            .insert(insertPayload)
            .select("date_of_birth, onboarding_completed")
            .single();
        };

        let { data: insertedProfile, error: insertError } = await insertWithKey(profileKey);
        if (insertError) {
          const fallbackKey: "id" | "user_id" = profileKey === "id" ? "user_id" : "id";
          const fallbackRes = await insertWithKey(fallbackKey);
          insertedProfile = fallbackRes.data;
          insertError = fallbackRes.error;
        }

        if (insertError) {
          const details =
            (insertError as { message?: string }).message ||
            (updateError as { message?: string } | null)?.message;
          Alert.alert(
            t("profile.error_saving"),
            __DEV__ && details ? details : undefined,
          );
          setIsCompletingProfile(false);
          return;
        }
        savedProfile = insertedProfile;
      }

      posthog.identify(sessionUserId, {
        $set: { phone_verified: true },
        $set_once: { first_seen: new Date().toISOString() },
      });
      posthog.capture('profile_created', { is_new_user: !updatedProfile });
      Alert.alert("", t("auth.profile_created"));

      if (!savedProfile?.date_of_birth) {
        Alert.alert(t("common.error"), t("common.retry"));
        setIsCompletingProfile(false);
        return;
      }

      if (savedProfile.onboarding_completed) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        const next: Record<string, string> = {};
        for (const issue of e.issues) {
          next[issue.path.join(".")] = issue.message;
        }
        setErrors(next);
      }
    } finally {
      setIsCompletingProfile(false);
    }
  };

  const goBack = () => {
    if (step === "phone") {
      router.replace("/landing");
    } else {
      setStep("phone");
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={goBack} style={styles.backRow}>
            <Text style={styles.backText}>{t("common.back")}</Text>
          </Pressable>

          {!hasValidSupabaseConfig && step === "phone" && (
            <View style={styles.bannerWarn}>
              <Text style={styles.bannerText}>{t("auth.supabase_banner")}</Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconHeart}>♥</Text>
            </View>
            <Text style={styles.title}>
              {step === "phone" && t("auth.phoneTitle")}
              {step === "verify" && t("auth.verifyTitle")}
              {step === "profile" && t("auth.ageTitle")}
            </Text>
            <Text style={styles.subtitle}>
              {step === "phone" && t("auth.phoneDescription")}
              {step === "verify" && `${t("auth.verifyDescription")} +46 ${phone}`}
              {step === "profile" && t("auth.ageDescription")}
            </Text>

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            {step === "phone" && (
              <View style={styles.section}>
                <Text style={styles.inputLabel}>{t("auth.label_phone")}</Text>
                <View
                  style={[styles.phoneRow, errors.phone && styles.phoneRowError]}
                >
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={maakTokens.mutedForeground}
                    style={styles.phoneIcon}
                  />
                  <Text style={styles.phonePrefix}>+46</Text>
                  <TextInput
                    value={formatPhoneNumber(phone)}
                    onChangeText={(text) =>
                      setPhone(text.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder={t("auth.phone_placeholder")}
                    placeholderTextColor={maakTokens.mutedForeground}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    style={styles.phoneRowInput}
                  />
                </View>
                {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
                <Pressable
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void handleSendOtp()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={maakTokens.primaryForeground} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{t("auth.sendCode")}</Text>
                  )}
                </Pressable>
              </View>
            )}

            {step === "verify" && (
              <View style={styles.section}>
                <Text style={styles.inputLabel}>{t("auth.sms_code")}</Text>
                <TextInput
                  value={otp}
                  onChangeText={(x) => setOtp(x.replace(/\D/g, "").slice(0, 6))}
                  placeholder={t("auth.otp_placeholder")}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, styles.otpInput, errors.otp && styles.inputError]}
                />
                {errors.otp ? <Text style={styles.fieldError}>{errors.otp}</Text> : null}
                <Pressable
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={() => void handleVerifyOtp()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={maakTokens.primaryForeground} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{t("auth.verify")}</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.btnGhost, countdown > 0 && styles.btnDisabled]}
                  onPress={() => void handleResendOtp()}
                  disabled={countdown > 0 || loading}
                >
                  <Text style={styles.btnGhostText}>
                    {countdown > 0
                      ? t("auth.resendIn", { seconds: countdown })
                      : t("auth.resendCode")}
                  </Text>
                </Pressable>
              </View>
            )}

            {step === "profile" && (
              <View style={styles.section}>
                <AgeVerificationRN
                  dateOfBirth={dateOfBirth}
                  onChange={setDateOfBirth}
                  error={errors["dateOfBirth.day"]}
                />
                {errors.age ? <Text style={styles.fieldError}>{errors.age}</Text> : null}
                <Pressable
                  style={[styles.btnPrimary, isCompletingProfile && styles.btnDisabled]}
                  onPress={() => void handleCompleteProfile()}
                  disabled={isCompletingProfile}
                >
                  {isCompletingProfile ? (
                    <ActivityIndicator color={maakTokens.primaryForeground} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{t("auth.completeProfile")}</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: maakTokens.background },
  scroll: {
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    paddingBottom: 32,
  },
  backRow: { marginBottom: 16, alignSelf: "flex-start" },
  backText: { color: maakTokens.mutedForeground, fontSize: 15 },
  bannerWarn: {
    backgroundColor: `${maakTokens.destructive}14`,
    borderRadius: maakTokens.radiusLg,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${maakTokens.destructive}44`,
  },
  bannerText: { fontSize: 13, color: maakTokens.foreground },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius2xl,
    padding: 24,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: maakTokens.primary,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconHeart: { fontSize: 28, color: maakTokens.primaryForeground },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: maakTokens.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: maakTokens.mutedForeground,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: `${maakTokens.destructive}18`,
    color: maakTokens.destructive,
    padding: 10,
    borderRadius: maakTokens.radiusMd,
    marginBottom: 12,
    fontSize: 13,
  },
  section: { gap: 12 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: maakTokens.foreground },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: maakTokens.muted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  phoneRowError: { borderColor: maakTokens.destructive },
  phoneIcon: { marginRight: 6 },
  phonePrefix: {
    fontSize: 16,
    fontWeight: "500",
    color: maakTokens.mutedForeground,
    marginRight: 8,
  },
  phoneRowInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 16,
    color: maakTokens.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: maakTokens.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: maakTokens.foreground,
    backgroundColor: maakTokens.muted,
  },
  inputError: { borderColor: maakTokens.destructive },
  otpInput: { letterSpacing: 8, textAlign: "center", fontSize: 22 },
  fieldError: { fontSize: 13, color: maakTokens.destructive },
  btnPrimary: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
    marginTop: 4,
  },
  btnPrimaryText: {
    color: maakTokens.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  btnGhost: { paddingVertical: 12, alignItems: "center" },
  btnGhostText: { color: maakTokens.primary, fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});
