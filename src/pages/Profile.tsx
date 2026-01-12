import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LogOut, Settings, X, Trophy, Sparkles, Trash2 } from 'lucide-react';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { BottomNav } from '@/components/navigation/BottomNav';
import { AchievementsPanel } from '@/components/achievements/AchievementsPanel';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { LanguageToggle } from '@/components/settings/LanguageToggle';
import { MatchingSettings } from '@/components/settings/MatchingSettings';
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
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/phone-auth');
    }
  }, [user, loading, navigate]);

  const fetchArchetype = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('personality_scores')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    // personality_scores doesn't have archetype field
    // This feature needs to be implemented with the correct table structure
    if (data) {
      setArchetype('explorer'); // Placeholder
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchArchetype();
    }
  }, [user, fetchArchetype]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Du har loggat ut');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete user data from all tables
      // Order matters due to foreign key constraints
      await supabase.from('messages').delete().eq('sender_id', user.id);
      await supabase.from('achievements').delete().eq('user_id', user.id);
      await supabase.from('notifications').delete().eq('user_id', user.id);
      await supabase.from('matches').delete().eq('user_id', user.id);
      await supabase.from('personality_scores').delete().eq('user_id', user.id);
      await supabase.from('dealbreakers').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      
      // Sign out the user (the auth user will remain but profile is deleted)
      await signOut();
      
      toast.success('Ditt konto har raderats');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Kunde inte radera kontot. Försök igen.');
    } finally {
      setIsDeleting(false);
    }
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
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('settings.delete_account')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('settings.delete_account_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('settings.delete_account_description')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? t('settings.deleting') : t('settings.delete_account_confirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        {/* Profile Content */}
        {showAIAssistant ? (
          <div className="space-y-4">
            <AIAssistantPanel onClose={() => setShowAIAssistant(false)} />
          </div>
        ) : showAchievements ? (
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
          <div className="space-y-4">
            <ProfileView 
              onEdit={() => setIsEditing(true)} 
              archetype={archetype}
            />
            
            {/* Matching Settings */}
            <MatchingSettings />
            
            {/* AI Assistant Quick Access */}
            <Button
              onClick={() => setShowAIAssistant(true)}
              className="w-full gradient-primary text-primary-foreground border-0 shadow-glow gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Få AI-förslag
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
