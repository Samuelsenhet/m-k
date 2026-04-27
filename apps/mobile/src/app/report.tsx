import { ReportFormRN } from "@/components/support/ReportFormRN";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function ReportScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("report.title") }} />
      <ReportFormRN />
    </>
  );
}
