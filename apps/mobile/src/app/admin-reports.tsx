import { AdminReportsRN } from "@/components/support/AdminReportsRN";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AdminReportsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("admin.reports_title") }} />
      <AdminReportsRN />
    </>
  );
}
