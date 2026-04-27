import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/useAuth";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { hasValidSupabaseConfig } from "@/integrations/supabase/client";
import { OnlineBannerV2 } from "@/components/ui-v2";

/**
 * Live user counter – visible across the app.
 * FAS 5 – Uses OnlineBannerV2 (token colors, motion).
 */
export function OnlineCountBar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const count = useOnlineCount(user?.id);

  if (!hasValidSupabaseConfig) return null;

  const label = t("common.online_now_full", { count: count.toLocaleString("sv-SE") });

  return (
    <OnlineBannerV2
      count={count}
      label={label}
      aria-label={label}
    />
  );
}
