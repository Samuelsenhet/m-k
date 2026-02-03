import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LogOut, Settings, X, Trophy, Sparkles, Trash2, ShieldCheck, ChevronDown, ChevronRight, HelpCircle, BookOpen } from 'lucide-react';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { BottomNav } from '@/components/navigation/BottomNav';
import { AchievementsPanel } from '@/components/achievements/AchievementsPanel';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { LanguageToggle } from '@/components/settings/LanguageToggle';
import { MatchingSettings } from '@/components/settings/MatchingSettings';
import { IdVerificationStep } from '@/components/onboarding/IdVerificationStep';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getProfilesAuthKey } from '@/lib/profiles';

interface PersonalityResultRow {
  id: string;
  archetype?: string;
}

const SETTINGS_SUBPAGES = ['/terms', '/privacy', '/reporting', '/about', '/report', '/report-history', '/appeal', '/admin/reports'];

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const prevPathRef = useRef(location.pathname);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verifyIdOpen, setVerifyIdOpen] = useState(false);
  const [privacyManageOpen, setPrivacyManageOpen] = useState(false);
  const [isModerator, setIsModerator] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/phone-auth');
    }
  }, [user, loading, navigate]);

  // When navigating back to Profile with openSettings state (from Terms, Report, etc.), open Inställningar.
  useEffect(() => {
    const state = location.state as { openSettings?: boolean } | null;
    if (location.pathname === '/profile' && state?.openSettings) {
      setSettingsOpen(true);
      // Clear state so refresh doesn't reopen the sheet
      window.history.replaceState({ ...state, openSettings: undefined }, '');
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, location.state]);

  const fetchArchetype = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('personality_results')
      .select('archetype, scores')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.archetype) {
      setArchetype(data.archetype);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchArchetype();
    }
  }, [user, fetchArchetype]);

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('settings.logout'));
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete user data from all tables
      // Order matters due to foreign key constraints
      const deleteOperations = [
        supabase.from('messages').delete().eq('sender_id', user.id),
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('matches').delete().eq('user_id', user.id),
        supabase.from('personality_results').delete().eq('user_id', user.id),
        supabase.from('profile_photos').delete().eq('user_id', user.id),
      ];

      // Execute all deletes and check for errors
      const results = await Promise.all(deleteOperations);
      const errors = results.filter(r => r.error).map(r => r.error);
      
      if (errors.length > 0) {
        if (import.meta.env.DEV) {
          console.error('Errors during account deletion:', errors);
        }
        // Continue anyway - some tables might not exist or be empty
      }

      // Delete profile last (has foreign key constraints)
      const profileKey = await getProfilesAuthKey(user.id);
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq(profileKey, user.id);
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw new Error(t('profile.error_saving'));
      }
      
      // Sign out the user (the auth user will remain but profile is deleted)
      await signOut();
      
      toast.success(t('settings.delete_account_title'));
      navigate('/');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting account:', error);
      }
      toast.error(t('common.error') + '. ' + t('common.retry'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Settings Sheet - Accessible from ProfileView action buttons */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent aria-describedby="settings-description" className="flex flex-col p-0 h-full overflow-hidden min-h-0">
          <SheetHeader className="shrink-0 border-b border-border px-6 py-4">
            <SheetTitle className="font-serif">{t('settings.title')}</SheetTitle>
            <SheetDescription id="settings-description" className="sr-only">
              {t('settings.account')} {t('settings.language')} {t('settings.notifications')} {t('settings.privacy')} {t('settings.achievements')}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 min-h-0 max-h-[70vh] w-full">
            <div className="px-6 py-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('settings.account')}</CardTitle>
                  {displayName && (
                    <p className="text-sm font-medium text-primary">
                      @{displayName.toLowerCase().replace(/\s+/g, '_')}
                    </p>
                  )}
                  <CardDescription className="text-sm">{user.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/personality-guide'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/personality-guide'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm flex items-center gap-2 font-normal">
                      <BookOpen className="w-4 h-4" />
                      {t('settings.learn_personality', 'Läs om personlighet & arketyper')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm">{t('settings.language')}</span>
                    <LanguageToggle />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/notifications'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/notifications'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm font-normal">{t('settings.notifications')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm">{t('settings.privacy')}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPrivacyManageOpen(true)}>
                      {t('settings.manage')}
                    </Button>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); setShowAchievements(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); setShowAchievements(true); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm flex items-center gap-2 font-normal">
                      <Trophy className="w-4 h-4" />
                      {t('settings.achievements')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/terms'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/terms'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm font-normal">{t('settings.terms')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/terms#integritet'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/terms#integritet'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm font-normal">{t('settings.privacy_policy')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/reporting'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/reporting'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm font-normal">{t('settings.reporting')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/about'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/about'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm font-normal">{t('settings.about_us')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
              {/* Matching settings – Age & Distance sliders + Submit */}
              <Card className="rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <MatchingSettings />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('settings.support_and_reports')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/report-history'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/report-history'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm font-normal">{t('report.history_title')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/report'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/report'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm font-normal">{t('report.report_problem')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSettingsOpen(false); navigate('/appeal'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/appeal'); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                  >
                    <span className="text-sm font-normal">{t('appeal.title')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                  {isModerator === true && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => { setSettingsOpen(false); navigate('/admin/reports'); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSettingsOpen(false); navigate('/admin/reports'); } }}
                      className="flex items-center justify-between py-2 w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm text-foreground no-underline"
                    >
                      <span className="text-sm font-normal">{t('admin.reports_title')}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  )}
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
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Verify ID Sheet - for users who skipped during onboarding */}
      <Sheet open={verifyIdOpen} onOpenChange={setVerifyIdOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif">{t('settings.verify_id')}</SheetTitle>
            <SheetDescription id="verify-id-description" className="sr-only">
              Upload your ID to verify your account
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 pb-8">
            <IdVerificationStep onSubmit={() => setVerifyIdOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy manage sheet */}
      <Sheet open={privacyManageOpen} onOpenChange={setPrivacyManageOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif">{t('settings.privacy')}</SheetTitle>
            <SheetDescription className="sr-only">
              {t('settings.privacy')} – {t('settings.manage')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Hantera vilka som ser din profil, dina foton och dina aktiviteter. Mer alternativ kommer snart.
            </p>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm">Profilsynlighet</span>
              <Button variant="outline" size="sm" disabled>Kommer snart</Button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm">Deldata</span>
              <Button variant="outline" size="sm" disabled>Kommer snart</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative w-full h-screen">
        {showAIAssistant ? (
          <div className="absolute inset-0 bg-black z-30 p-4">
            <AIAssistantPanel onClose={() => setShowAIAssistant(false)} />
          </div>
        ) : showAchievements ? (
          <div className="absolute inset-0 bg-black z-30 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-xl text-white">{t('achievements.title')}</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowAchievements(false)}
                className="text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <AchievementsPanel />
          </div>
        ) : isEditing ? (
          <div className="absolute inset-0 bg-black z-30 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-xl text-white">{t('profile.edit_profile')}</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditing(false)}
                className="text-white"
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
            onSettings={() => setSettingsOpen(true)}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
