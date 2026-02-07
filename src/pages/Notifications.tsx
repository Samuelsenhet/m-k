import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/useAuth';
import { useNotificationFeed } from '@/hooks/useNotificationFeed';
import { supabase } from '@/integrations/supabase/client';
import { getProfilesAuthKey } from '@/lib/profiles';
import { useState, useEffect } from 'react';

function formatTimeAgo(iso: string, t: (key: string, opts?: { count?: number }) => string): string {
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (mins < 60) return t('notifications.minutes_ago', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function Notifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    profileViews,
    interests,
    loading,
    error,
    acceptInterest,
    rejectInterest,
  } = useNotificationFeed();

  const [prefs, setPrefs] = useState<{
    push_new_matches: boolean;
    push_messages: boolean;
    email_new_matches: boolean;
    email_messages: boolean;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const key = await getProfilesAuthKey(user.id);
      const { data } = await supabase
        .from('profiles')
        .select('push_new_matches, push_messages, email_new_matches, email_messages')
        .eq(key, user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          push_new_matches: data.push_new_matches ?? true,
          push_messages: data.push_messages ?? true,
          email_new_matches: data.email_new_matches ?? true,
          email_messages: data.email_messages ?? true,
        });
      } else {
        setPrefs({
          push_new_matches: true,
          push_messages: true,
          email_new_matches: true,
          email_messages: true,
        });
      }
    };
    load();
  }, [user]);

  const updatePref = async (
    field: 'push_new_matches' | 'push_messages' | 'email_new_matches' | 'email_messages',
    value: boolean
  ) => {
    if (!user || prefs === null) return;
    setPrefs((p) => (p ? { ...p, [field]: value } : null));
    const key = await getProfilesAuthKey(user.id);
    await supabase.from('profiles').update({ [field]: value }).eq(key, user.id);
  };

  const hasFeed = profileViews.length > 0 || interests.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold">{t('notifications.title')}</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <p className="text-sm text-muted-foreground">{t('notifications.intro')}</p>

        {/* Feed: Today */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base">{t('notifications.today')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {!loading && !hasFeed && (
              <p className="text-sm text-muted-foreground">{t('notifications.no_notifications')}</p>
            )}
            {!loading && profileViews.length > 0 && (
              <div className="space-y-2">
                {profileViews.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {v.viewer_avatar_url ? (
                        <img src={v.viewer_avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                          {(v.viewer_display_name || '?').slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {v.viewer_display_name || 'Someone'}{' '}
                        <span className="text-muted-foreground font-normal">{t('notifications.your_view_this')}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(v.created_at, t)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link to={`/match/${v.viewer_id}`}>{t('settings.view')}</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!loading && interests.length > 0 && (
              <div className="space-y-2">
                {interests.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {i.liker_avatar_url ? (
                        <img src={i.liker_avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                          {(i.liker_display_name || '?').slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {i.liker_display_name || 'Someone'}{' '}
                        <span className="text-muted-foreground font-normal">{t('notifications.your_love_this')}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(i.created_at, t)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectInterest(i.id)}
                      >
                        {t('notifications.reject')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          await acceptInterest(i.id);
                          navigate('/matches');
                        }}
                      >
                        {t('notifications.accept')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Push & email toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base">{t('notifications.push_and_email')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prefs === null && (
              <div className="flex justify-center py-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            {prefs !== null && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm">{t('notifications.push_new_matches')}</span>
                  <Switch
                    checked={prefs.push_new_matches}
                    onCheckedChange={(v) => updatePref('push_new_matches', v)}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm">{t('notifications.push_messages')}</span>
                  <Switch
                    checked={prefs.push_messages}
                    onCheckedChange={(v) => updatePref('push_messages', v)}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm">{t('notifications.email_new_matches')}</span>
                  <Switch
                    checked={prefs.email_new_matches}
                    onCheckedChange={(v) => updatePref('email_new_matches', v)}
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm">{t('notifications.email_messages')}</span>
                  <Switch
                    checked={prefs.email_messages}
                    onCheckedChange={(v) => updatePref('email_messages', v)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
