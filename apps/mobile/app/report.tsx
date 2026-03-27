import { WebInfoScreen } from "@/components/settings/WebInfoScreen";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function ReportScreen() {
  const { t } = useTranslation();
  const { userId, matchId, context } = useLocalSearchParams<{
    userId?: string;
    matchId?: string;
    context?: string;
  }>();

  const webPath = useMemo(() => {
    const q = new URLSearchParams();
    if (typeof userId === "string" && userId) q.set("userId", userId);
    if (typeof matchId === "string" && matchId) q.set("matchId", matchId);
    if (typeof context === "string" && context) q.set("context", context);
    const qs = q.toString();
    return qs ? `/report?${qs}` : "/report";
  }, [userId, matchId, context]);

  return (
    <WebInfoScreen
      title={t("report.report_problem")}
      webPath={webPath}
      intro={t("report.mobile_submit_web")}
    />
  );
}
