import React from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Button } from "@/components/native";

const COLORS = {
  background: "#0A0A0A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  divider: "#333333",
};

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <Text style={styles.logo}>MĀĀK</Text>
          <Text style={styles.tagline}>{t("auth.tagline")}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
          <Text style={styles.title}>{t("auth.welcome_back")}</Text>
          <Text style={styles.subtitle}>{t("auth.login_subtitle")}</Text>

          <Button
            title={t("auth.login_with_phone")}
            onPress={() => router.push("/(auth)/phone-auth")}
            variant="primary"
            fullWidth
            size="lg"
            style={styles.button}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("auth.or")}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title={t("auth.create_account")}
            onPress={() => router.push("/(auth)/onboarding")}
            variant="outline"
            fullWidth
            size="lg"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
          <Text style={styles.footerText}>
            {t("auth.terms_notice")}
          </Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  form: {
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
  button: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    marginTop: 48,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
});
