import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * ID verification step in onboarding - opens the verification wizard.
 * User can also skip and verify later from profile settings.
 */
export function IdVerificationPlaceholderRN({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark" size={40} color={maakTokens.primary} />
      </View>
      <Text style={styles.title}>{t("mobile.id_verify.title")}</Text>
      <Text style={styles.body}>{t("mobile.id_verify.body_updated")}</Text>

      <Pressable
        style={styles.btn}
        onPress={() => router.push({ pathname: "/verification" })}
      >
        <Text style={styles.btnText}>{t("mobile.verification.verify_me")}</Text>
      </Pressable>

      <Pressable onPress={onContinue} style={styles.skipBtn}>
        <Text style={styles.skipText}>{t("mobile.verification.not_now")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 14, alignItems: "center", paddingVertical: 8 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: `${maakTokens.primary}1A`,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: maakTokens.foreground },
  body: {
    fontSize: 14, color: maakTokens.mutedForeground,
    textAlign: "center", lineHeight: 21, maxWidth: 300,
  },
  btn: {
    marginTop: 8, backgroundColor: maakTokens.primary,
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: maakTokens.radius2xl,
  },
  btnText: { color: maakTokens.primaryForeground, fontWeight: "700", fontSize: 16 },
  skipBtn: { paddingVertical: 12 },
  skipText: { color: maakTokens.mutedForeground, fontSize: 15 },
});
