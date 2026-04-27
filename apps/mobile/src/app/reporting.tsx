import { ReportingPolicyRN } from "@/components/support/ReportingPolicyRN";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function ReportingScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("reporting.page_title") }} />
      <ReportingPolicyRN />
    </>
  );
}
