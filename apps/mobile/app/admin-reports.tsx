import { WebInfoScreen } from "@/components/settings/WebInfoScreen";
import { useTranslation } from "react-i18next";

export default function AdminReportsScreen() {
  const { t } = useTranslation();
  return (
    <WebInfoScreen
      title={t("admin.reports_title")}
      webPath="/admin/reports"
      intro={t("admin.mobile_intro")}
    />
  );
}
