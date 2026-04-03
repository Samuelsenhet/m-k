import { TermsOfUseRN } from "@/components/legal/TermsOfUseRN";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TermsScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("settings.terms") }} />
      <TermsOfUseRN />
    </>
  );
}
