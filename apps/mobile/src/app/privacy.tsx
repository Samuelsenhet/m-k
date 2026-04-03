import { PrivacyPolicyRN } from "@/components/legal/PrivacyPolicyRN";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("settings.privacy_policy") }} />
      <PrivacyPolicyRN />
    </>
  );
}
