import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp, FadeOutUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Button, Input } from "@/components/native";
import { usePhoneAuth } from "@/hooks/usePhoneAuth";
import { toast } from "@/components/native/Toast";

const COLORS = {
  background: "#0A0A0A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
};

export default function PhoneAuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { sendOtp, verifyOtp, loading, error } = usePhoneAuth();

  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      toast.error(t("auth.invalid_phone"));
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await sendOtp(phone);
    if (success) {
      setStep("verify");
      toast.success(t("auth.code_sent"));
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      toast.error(t("auth.invalid_code"));
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await verifyOtp(phone, code);
    if (success) {
      toast.success(t("auth.login_success"));
      router.replace("/(tabs)");
    }
  };

  const handleBack = () => {
    if (step === "verify") {
      setStep("phone");
      setCode("");
    } else {
      router.back();
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
      </View>

      <View style={styles.content}>
        {step === "phone" ? (
          <Animated.View
            entering={FadeInUp.duration(400)}
            exiting={FadeOutUp.duration(300)}
            style={styles.stepContainer}
          >
            <Text style={styles.title}>{t("auth.enter_phone")}</Text>
            <Text style={styles.subtitle}>{t("auth.phone_subtitle")}</Text>

            <Input
              label={t("auth.phone_number")}
              placeholder="+46 70 123 45 67"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              containerStyle={styles.input}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title={t("auth.send_code")}
              onPress={handleSendCode}
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              style={styles.button}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.stepContainer}
          >
            <Text style={styles.title}>{t("auth.verify_code")}</Text>
            <Text style={styles.subtitle}>
              {t("auth.code_sent_to", { phone })}
            </Text>

            <Input
              label={t("auth.verification_code")}
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              containerStyle={styles.input}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title={t("auth.verify")}
              onPress={handleVerifyCode}
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              style={styles.button}
            />

            <Pressable onPress={handleSendCode} disabled={loading}>
              <Text style={styles.resendText}>{t("auth.resend_code")}</Text>
            </Pressable>
          </Animated.View>
        )}
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
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  stepContainer: {
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    textDecorationLine: "underline",
  },
});
