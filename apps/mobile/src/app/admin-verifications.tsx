import { AdminVerificationsRN } from "@/components/support/AdminVerificationsRN";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AdminVerificationsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("admin.verifications_title") }} />
      <AdminVerificationsRN />
    </>
  );
}
