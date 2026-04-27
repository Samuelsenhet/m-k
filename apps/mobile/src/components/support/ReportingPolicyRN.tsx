import { SupportHeader } from "@/components/support/SupportHeader";
import { maakTokens } from "@maak/core";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTION_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function ReportingPolicyRN() {
  const { t } = useTranslation();
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
      <SupportHeader title={t("reporting.page_title")} />
      <Text style={styles.intro}>{t("reporting.policy_intro")}</Text>

      {SECTION_KEYS.map((n) => (
        <View key={n} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t(`reporting.policy_s${n}_title` as const)}
          </Text>
          <Text style={styles.sectionBody}>
            {t(`reporting.policy_s${n}_body` as const)}
          </Text>
        </View>
      ))}

      <View style={styles.commitment}>
        <Text style={styles.commitmentTitle}>{t("reporting.commitment_title")}</Text>
        <Text style={styles.commitmentBody}>{t("reporting.commitment_body")}</Text>
      </View>

      <Text style={styles.contactHeading}>{t("reporting.contact_heading")}</Text>
      <Text style={styles.contactLine}>{t("reporting.contact_email")}</Text>
      <Text style={styles.contactNote}>{t("reporting.contact_note")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: maakTokens.mutedForeground,
    marginBottom: 20,
  },
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
  commitment: {
    backgroundColor: `${maakTokens.primary}12`,
    borderRadius: maakTokens.radiusLg,
    borderWidth: 1,
    borderColor: `${maakTokens.primary}44`,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  commitmentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 8,
  },
  commitmentBody: {
    fontSize: 14,
    lineHeight: 21,
    color: maakTokens.mutedForeground,
    fontStyle: "italic",
  },
  contactHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 6,
  },
  contactLine: { fontSize: 14, color: maakTokens.primary, marginBottom: 4 },
  contactNote: { fontSize: 13, color: maakTokens.mutedForeground, marginBottom: 8 },
});
