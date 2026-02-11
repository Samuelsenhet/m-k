import { useAuth } from '@/contexts/useAuth';
import { useOnlineCount } from '@/hooks/useOnlineCount';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getShowOnlineCount, ONLINE_COUNT_PREF_EVENT } from '@/lib/onlineCountPref';

export function OnlineCountBar() {
  const { user } = useAuth();
  const { count, error } = useOnlineCount(user?.id);
  const { t } = useTranslation();
  const [showBar, setShowBar] = useState(true);

  useEffect(() => {
    setShowBar(getShowOnlineCount());
    const onPrefChange = () => setShowBar(getShowOnlineCount());
    window.addEventListener(ONLINE_COUNT_PREF_EVENT, onPrefChange);
    return () => window.removeEventListener(ONLINE_COUNT_PREF_EVENT, onPrefChange);
  }, []);

  if (!user || !showBar) return null;
  if (error || count === null) return null;

  return (
    <div
      className="fixed bottom-14 left-0 right-0 z-20 flex justify-center pointer-events-none"
      aria-live="polite"
      aria-label={t('common.online_now_full', { count })}
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/95 backdrop-blur border border-border shadow-card text-muted-foreground text-caption">
        <Users className="w-3.5 h-3.5" aria-hidden />
        <span className="text-label">
          {t('common.online_badge', { count })}
        </span>
      </div>
    </div>
  );
}
