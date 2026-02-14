import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/useAuth';
import { useOnlineCount } from '@/hooks/useOnlineCount';
import { hasValidSupabaseConfig } from '@/integrations/supabase/client';

/**
 * Live user counter – visible across the app.
 * Shows "Just nu är det X användare online" in a fixed bar at the top.
 */
export function OnlineCountBar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const count = useOnlineCount(user?.id);

  if (!hasValidSupabaseConfig) return null;

  const formatted = count.toLocaleString('sv-SE');

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center py-2 px-3 bg-primary/90 text-primary-foreground shadow-md safe-area-top"
        role="status"
        aria-live="polite"
        aria-label={t('common.online_now_full', { count: formatted })}
      >
        <p className="text-sm font-bold text-center">
          {t('common.online_now_full', { count: formatted })}
        </p>
      </div>
      {/* Spacer so main content starts below the bar */}
      <div className="h-10 flex-shrink-0" aria-hidden="true" />
    </>
  );
}
