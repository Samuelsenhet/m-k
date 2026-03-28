import { ReportHistoryRN } from "@/components/support/ReportHistoryRN";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function ReportHistoryScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("report.history_title") }} />
      <ReportHistoryRN />
    </>
  );
}
