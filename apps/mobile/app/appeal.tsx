import { WebInfoScreen } from "@/components/settings/WebInfoScreen";
import { useTranslation } from "react-i18next";

export default function AppealScreen() {
  const { t } = useTranslation();
  return (
    <WebInfoScreen
      title={t("appeal.title")}
      webPath="/appeal"
      intro={t("appeal.intro")}
    />
  );
}
