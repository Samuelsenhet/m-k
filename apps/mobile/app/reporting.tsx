import { maakTokens } from "@maak/core";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { openExternalUrl } from "@/lib/openExternalUrl";

const WEB_BASE = (process.env.EXPO_PUBLIC_APP_URL || "https://maakapp.se").replace(/\/$/, "");

export default function ReportingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openFull = () => {
    void openExternalUrl(`${WEB_BASE}/reporting`, { title: t("settings.reporting") });
  };

  return (
    <>
      <Stack.Screen options={{ title: t("settings.reporting") }} />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 32,
        }}
      >
        <Text style={styles.p}>{t("reporting.mobile_body")}</Text>
        <Pressable style={styles.btn} onPress={openFull}>
          <Text style={styles.btnTxt}>{t("settings.view")}</Text>
        </Pressable>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backTxt}>{t("common.back")}</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 15, lineHeight: 22, color: maakTokens.foreground, marginBottom: 16 },
  btn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
    marginBottom: 16,
  },
  btnTxt: { color: maakTokens.primaryForeground, fontWeight: "700", fontSize: 16 },
  back: { paddingVertical: 12 },
  backTxt: { color: maakTokens.primary, fontWeight: "600", fontSize: 16 },
});
