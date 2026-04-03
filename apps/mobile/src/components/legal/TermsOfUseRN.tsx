import { SupportHeader } from "@/components/support/SupportHeader";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TERMS_SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

type Props = {
  showPrivacyLink?: boolean;
};

export function TermsOfUseRN({ showPrivacyLink = true }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: maakTokens.screenPaddingHorizontal,
      }}
    >
      <SupportHeader title={t("legal.terms_page_title")} />
      <Text style={styles.meta}>{t("legal.last_updated")}</Text>
      <Text style={styles.intro}>{t("legal.terms_intro_1")}</Text>
      <Text style={[styles.intro, styles.introGap]}>{t("legal.terms_intro_2")}</Text>

      {TERMS_SECTIONS.map((n) => (
        <View key={n} style={styles.section}>
          <Text style={styles.sectionTitle}>{t(`legal.terms_s${n}_title` as const)}</Text>
          <Text style={styles.sectionBody}>{t(`legal.terms_s${n}_body` as const)}</Text>
        </View>
      ))}

      {showPrivacyLink ? (
        <Pressable
          onPress={() => router.push("/privacy")}
          style={styles.linkWrap}
          accessibilityRole="link"
          accessibilityLabel={t("legal.see_privacy_policy")}
        >
          <Text style={styles.link}>{t("legal.see_privacy_policy")} →</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  meta: {
    fontSize: 13,
    lineHeight: 19,
    color: maakTokens.mutedForeground,
    marginBottom: 16,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: maakTokens.mutedForeground,
  },
  introGap: { marginTop: 12, marginBottom: 20 },
  section: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 10,
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: maakTokens.mutedForeground,
  },
  linkWrap: {
    marginTop: 8,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  link: {
    fontSize: 16,
    fontWeight: "600",
    color: maakTokens.primary,
  },
});
