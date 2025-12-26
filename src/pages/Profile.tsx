import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, Settings, Sparkles, X, Trophy } from 'lucide-react';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { BottomNav } from '@/components/navigation/BottomNav';
import { AchievementsPanel } from '@/components/achievements/AchievementsPanel';
import { LanguageToggle } from '@/components/settings/LanguageToggle';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PersonalityResultRow {
  id: string;
  archetype?: string;
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [archetype, setArchetype] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchArchetype();
    }
  }, [user]);

  const fetchArchetype = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('personality_results')
      .select('id, archetype')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.archetype) {
      setArchetype(data.archetype);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Du har loggat ut');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <nav className="flex justify-between items-center mb-4">
          <h1 className="font-serif font-bold text-lg">{t('profile.my_profile')}</h1>
          <div className="flex items-center gap-1">
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-serif">{t('settings.title')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{t('settings.account')}</CardTitle>
                      <CardDescription className="text-sm">{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm">{t('settings.language')}</span>
                        <LanguageToggle />
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm">{t('settings.notifications')}</span>
                        <Button variant="ghost" size="sm">{t('settings.manage')}</Button>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm">{t('settings.privacy')}</span>
                        <Button variant="ghost" size="sm">{t('settings.manage')}</Button>
                      </div>
                      <button 
                        onClick={() => { setSettingsOpen(false); setShowAchievements(true); }}
                        className="flex items-center justify-between py-2 border-b border-border w-full text-left"
                      >
                        <span className="text-sm flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          {t('settings.achievements')}
                        </span>
                        <Button variant="ghost" size="sm">{t('settings.view')}</Button>
                      </button>
                      <Link to="/" className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          {t('settings.personality_test')}
                        </span>
                        <Button variant="ghost" size="sm">{t('settings.start')}</Button>
                      </Link>
                    </CardContent>
                  </Card>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('settings.logout')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        {/* Profile Content */}
        {showAchievements ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-xl">{t('achievements.title')}</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowAchievements(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <AchievementsPanel />
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-xl">{t('profile.edit_profile')}</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <ProfileEditor onComplete={() => setIsEditing(false)} />
          </div>
        ) : (
          <ProfileView 
            onEdit={() => setIsEditing(true)} 
            archetype={archetype}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
