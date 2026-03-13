import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Button, Input, Select, Checkbox } from "@/components/native";
import { toast } from "@/components/native/Toast";
import { supabase } from "@/integrations/supabase/client";

const COLORS = {
  background: "#0A0A0A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  progressBg: "#333333",
};

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    phone: "",
    age: "",
    gender: "",
    lookingFor: "",
    bio: "",
    acceptTerms: false,
  });

  const updateForm = (key: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === 1) {
      if (!formData.displayName || !formData.email || !formData.password) {
        toast.error(t("onboarding.fill_required_fields"));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.age || !formData.gender) {
        toast.error(t("onboarding.fill_required_fields"));
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (!formData.acceptTerms) {
        toast.error(t("onboarding.accept_terms"));
        return;
      }
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
            phone: formData.phone,
          },
        },
      });

      if (error) throw error;

      toast.success(t("onboarding.account_created"));
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(t("onboarding.signup_error"));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View
            key="step1"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>{t("onboarding.step1_title")}</Text>
            <Text style={styles.stepSubtitle}>{t("onboarding.step1_subtitle")}</Text>

            <Input
              label={t("onboarding.display_name")}
              placeholder={t("onboarding.display_name_placeholder")}
              value={formData.displayName}
              onChangeText={(v) => updateForm("displayName", v)}
              containerStyle={styles.input}
            />
            <Input
              label={t("onboarding.email")}
              placeholder={t("onboarding.email_placeholder")}
              value={formData.email}
              onChangeText={(v) => updateForm("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.input}
            />
            <Input
              label={t("onboarding.password")}
              placeholder={t("onboarding.password_placeholder")}
              value={formData.password}
              onChangeText={(v) => updateForm("password", v)}
              secureTextEntry
              containerStyle={styles.input}
            />
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            key="step2"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>{t("onboarding.step2_title")}</Text>
            <Text style={styles.stepSubtitle}>{t("onboarding.step2_subtitle")}</Text>

            <Input
              label={t("onboarding.age")}
              placeholder="25"
              value={formData.age}
              onChangeText={(v) => updateForm("age", v)}
              keyboardType="number-pad"
              containerStyle={styles.input}
            />
            <Select
              label={t("onboarding.gender")}
              placeholder={t("onboarding.select_gender")}
              value={formData.gender}
              onChange={(v) => updateForm("gender", v)}
              options={[
                { value: "male", label: t("onboarding.male") },
                { value: "female", label: t("onboarding.female") },
                { value: "non_binary", label: t("onboarding.non_binary") },
                { value: "other", label: t("onboarding.other") },
              ]}
              containerStyle={styles.input}
            />
            <Select
              label={t("onboarding.looking_for")}
              placeholder={t("onboarding.select_looking_for")}
              value={formData.lookingFor}
              onChange={(v) => updateForm("lookingFor", v)}
              options={[
                { value: "men", label: t("onboarding.men") },
                { value: "women", label: t("onboarding.women") },
                { value: "everyone", label: t("onboarding.everyone") },
              ]}
              containerStyle={styles.input}
            />
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View
            key="step3"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>{t("onboarding.step3_title")}</Text>
            <Text style={styles.stepSubtitle}>{t("onboarding.step3_subtitle")}</Text>

            <Input
              label={t("onboarding.bio")}
              placeholder={t("onboarding.bio_placeholder")}
              value={formData.bio}
              onChangeText={(v) => updateForm("bio", v)}
              multiline
              numberOfLines={4}
              containerStyle={styles.input}
            />
            <Input
              label={t("onboarding.phone_optional")}
              placeholder="+46 70 123 45 67"
              value={formData.phone}
              onChangeText={(v) => updateForm("phone", v)}
              keyboardType="phone-pad"
              containerStyle={styles.input}
            />
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View
            key="step4"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>{t("onboarding.step4_title")}</Text>
            <Text style={styles.stepSubtitle}>{t("onboarding.step4_subtitle")}</Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t("onboarding.display_name")}</Text>
              <Text style={styles.summaryValue}>{formData.displayName}</Text>

              <Text style={styles.summaryLabel}>{t("onboarding.email")}</Text>
              <Text style={styles.summaryValue}>{formData.email}</Text>

              <Text style={styles.summaryLabel}>{t("onboarding.age")}</Text>
              <Text style={styles.summaryValue}>{formData.age}</Text>
            </View>

            <Checkbox
              label={t("onboarding.accept_terms_label")}
              description={t("onboarding.accept_terms_description")}
              checked={formData.acceptTerms}
              onChange={(v) => updateForm("acceptTerms", v)}
              containerStyle={styles.checkbox}
            />
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {step} / {TOTAL_STEPS}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={step === TOTAL_STEPS ? t("onboarding.create_account") : t("common.continue")}
          onPress={handleNext}
          variant="primary"
          fullWidth
          size="lg"
          loading={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBg: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.progressBg,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  stepContent: {
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  checkbox: {
    marginTop: 8,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    backgroundColor: COLORS.background,
  },
});
