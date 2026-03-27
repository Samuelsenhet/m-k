import { WebInfoScreen } from "@/components/settings/WebInfoScreen";
import { useTranslation } from "react-i18next";

export default function ReportHistoryScreen() {
  const { t } = useTranslation();
  return (
    <WebInfoScreen
      title={t("report.history_title")}
      webPath="/report-history"
      intro={t("report.history_intro")}
    />
  );
}
