import { AppealRN } from "@/components/support/AppealRN";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AppealScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("appeal.title") }} />
      <AppealRN />
    </>
  );
}
