import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/useAuth';
import { BottomNav } from '@/components/navigation/BottomNav';
import { cn } from '@/lib/utils';

export type NotificationType = 'view' | 'love';

export interface AppNotification {
  id: string;
  type: NotificationType;
  name: string;
  /** For type 'view': e.g. matched with name */
  subtitle?: string;
  minutesAgo: number;
  read?: boolean;
  /** For type 'love': optional match/user id for accept/reject */
  targetUserId?: string;
}

// Mock data – replace with real fetch from Supabase when notifications table exists
const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', type: 'view', name: 'Ariana', subtitle: 'Jane Cooper', minutesAgo: 10, read: false },
  { id: '2', type: 'view', name: 'Mira', subtitle: 'Jane Cooper', minutesAgo: 10, read: false },
  { id: '3', type: 'view', name: 'Tom', subtitle: 'Jane Cooper', minutesAgo: 12, read: false },
  { id: '4', type: 'love', name: 'Ariana', minutesAgo: 10, read: false, targetUserId: 'u1' },
  { id: '5', type: 'love', name: 'Lina', minutesAgo: 12, read: false, targetUserId: 'u2' },
];

export default function Notifications() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  const handleBack = () => navigate(-1);

  const handleAccept = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // TODO: call API to accept like / create match
  };

  const handleReject = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // TODO: call API to reject / pass
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    navigate('/phone-auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Header: back + title – Määk Eucalyptus Grove */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-3 py-3 safe-area-top bg-background border-b border-border">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-[var(--duration-normal)]"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-serif text-lg font-semibold text-foreground">
          {t('notifications.title')}
        </h1>
        <div className="w-10" />
      </header>

      {/* Section: Today */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {t('notifications.today')}
        </p>
      </div>

      {/* List – cards with soft shadow */}
      <div className="flex-1 px-4">
        <ul className="space-y-3">
          {notifications.length === 0 ? (
            <li className="py-12 text-center text-sm text-muted-foreground rounded-xl bg-card/50 border border-border">
              {t('notifications.no_notifications')}
            </li>
          ) : (
            notifications.map((n) =>
              n.type === 'view' ? (
                <li
                  key={n.id}
                  className={cn(
                    'rounded-xl border border-border bg-card p-4 flex gap-3 shadow-[var(--shadow-soft)]',
                    !n.read && 'ring-1 ring-primary/20'
                  )}
                >
                  <div className="relative shrink-0">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5 text-primary">
                      <Bell className="h-5 w-5" />
                    </span>
                    {!n.read && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold text-primary">{n.name}</span>{' '}
                      <span className="text-foreground">{t('notifications.your_view_this')}</span>
                    </p>
                    {n.subtitle && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t('notifications.profile_matched_with', { name: n.subtitle })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('notifications.minutes_ago', { count: n.minutesAgo })}
                    </p>
                  </div>
                </li>
              ) : (
                <li
                  key={n.id}
                  className="rounded-xl border border-border bg-card p-4 flex gap-3 shadow-[var(--shadow-soft)]"
                >
                  <div className="shrink-0">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5 text-primary">
                      <User className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold text-primary">{n.name}</span>{' '}
                      <span className="text-foreground">{t('notifications.your_love_this')}</span>
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex-1 transition-opacity duration-[var(--duration-normal)]"
                        onClick={() => handleAccept(n.id)}
                      >
                        {t('notifications.accept')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-primary/50 text-primary hover:bg-primary/10 flex-1 transition-colors duration-[var(--duration-normal)]"
                        onClick={() => handleReject(n.id)}
                      >
                        {t('notifications.reject')}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('notifications.minutes_ago', { count: n.minutesAgo })}
                    </p>
                  </div>
                </li>
              )
            )
          )}
        </ul>
      </div>

      <BottomNav />
    </div>
  );
}
