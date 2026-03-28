import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { openExternalUrl } from "@/lib/openExternalUrl";
import { webAppUrl } from "@/lib/webAppBase";

type Props = {
  title: string;
  /** Path on web app, e.g. `/personality-guide` */
  webPath: string;
  intro?: string;
};

export function WebInfoScreen({ title, webPath, intro }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const url = webAppUrl(webPath);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: maakTokens.screenPaddingHorizontal,
      }}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons name="chevron-back" size={28} color={maakTokens.foreground} />
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {intro ? <Text style={styles.intro}>{intro}</Text> : null}

      <Text style={styles.hint}>{t("settings.web_full_page_hint")}</Text>

      <Pressable style={styles.primaryBtn} onPress={() => void openExternalUrl(url, { title })}>
        <Text style={styles.primaryBtnText}>
          {t("settings.view")} (web)
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: maakTokens.foreground,
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    borderRadius: maakTokens.radiusLg,
    alignItems: "center",
  },
  primaryBtnText: {
    color: maakTokens.primaryForeground,
    fontWeight: "700",
    fontSize: 16,
  },
});
