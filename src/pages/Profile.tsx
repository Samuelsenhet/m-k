import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { X, Trophy } from 'lucide-react';
import { ProfileView } from '@/components/profile/ProfileView';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { BottomNav } from '@/components/navigation/BottomNav';
import { AchievementsPanel } from '@/components/achievements/AchievementsPanel';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { IdVerificationStep } from '@/components/onboarding/IdVerificationStep';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getProfilesAuthKey } from '@/lib/profiles';
import { useProfileData } from '@/hooks/useProfileData';
import { useLocalSettings } from '@/hooks/useLocalSettings';
import { Switch } from '@/components/ui/switch';

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const prevPathRef = useRef(location.pathname);
  const { archetype, displayName, isModerator } = useProfileData(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verifyIdOpen, setVerifyIdOpen] = useState(false);
  const [notificationsManageOpen, setNotificationsManageOpen] = useState(false);
  const [privacyManageOpen, setPrivacyManageOpen] = useState(false);
  const localSettings = useLocalSettings();

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

  // Refetch profile data when settings sheet opens so display name is fresh (e.g. after edit).
  useEffect(() => {
    if (settingsOpen && user) {
      refetch();
    }
  }, [settingsOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- refetch on open only

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
      <ProfileSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
        displayName={displayName}
        isModerator={isModerator}
        onOpenAchievements={() => setShowAchievements(true)}
        onOpenNotifications={() => setNotificationsManageOpen(true)}
        onOpenPrivacy={() => setPrivacyManageOpen(true)}
        onSignOut={handleSignOut}
        onDeleteAccount={handleDeleteAccount}
        isDeleting={isDeleting}
      />

      {/* Verify ID Sheet - for users who skipped during onboarding */}
      <Sheet open={verifyIdOpen} onOpenChange={setVerifyIdOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto" aria-describedby="verify-id-description">
          <SheetHeader>
            <SheetTitle className="font-serif">{t('settings.verify_id')}</SheetTitle>
            <SheetDescription id="verify-id-description" className="sr-only">
              {t('settings.verify_id_description')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 pb-8">
            <IdVerificationStep onSubmit={() => setVerifyIdOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications manage sheet */}
      <Sheet open={notificationsManageOpen} onOpenChange={setNotificationsManageOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto" aria-describedby="notifications-sheet-desc">
          <SheetHeader>
            <SheetTitle className="font-serif">{t('settings.notifications')}</SheetTitle>
            <SheetDescription id="notifications-sheet-desc" className="sr-only">
              {t('settings.notifications')} – {t('settings.manage')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('settings.notifications_description')}
            </p>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm">{t('settings.notifications_new_matches')}</span>
              <Switch
                checked={localSettings.notificationsNewMatches}
                onCheckedChange={localSettings.setNotificationsNewMatches}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm">{t('chat.messages')}</span>
              <Switch
                checked={localSettings.notificationsMessages}
                onCheckedChange={localSettings.setNotificationsMessages}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy manage sheet */}
      <Sheet open={privacyManageOpen} onOpenChange={setPrivacyManageOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto" aria-describedby="privacy-sheet-desc">
          <SheetHeader>
            <SheetTitle className="font-serif">{t('settings.privacy')}</SheetTitle>
            <SheetDescription id="privacy-sheet-desc" className="sr-only">
              {t('settings.privacy')} – {t('settings.manage')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('settings.privacy_description')}
            </p>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm">{t('settings.profile_visibility')}</span>
              <Switch
                checked={localSettings.privacyProfileVisibility}
                onCheckedChange={localSettings.setPrivacyProfileVisibility}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm">{t('settings.shared_data')}</span>
              <Switch
                checked={localSettings.privacySharedData}
                onCheckedChange={localSettings.setPrivacySharedData}
              />
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
                className="text-white flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5 shrink-0" />
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
                className="text-white flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5 shrink-0" />
              </Button>
            </div>
            <ProfileEditor onComplete={() => { refetch(); setIsEditing(false); }} />
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
