import { Link } from 'react-router-dom';
import { ButtonGhost, ButtonCoral, ButtonSecondary, CardV2, CardV2Content, CardV2Header, CardV2Title } from '@/components/ui-v2';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LogOut, Trophy, Trash2, ShieldCheck } from 'lucide-react';
import { LanguageToggle } from '@/components/settings/LanguageToggle';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

export interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  displayName: string | null;
  isModerator: boolean | null;
  profileError?: Error | null;
  onRefetch?: () => void;
  onOpenAchievements: () => void;
  onOpenNotifications: () => void;
  onOpenPrivacy: () => void;
  onOpenVerifyId?: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  isDeleting: boolean;
}

export function ProfileSettings({
  open,
  onOpenChange,
  user,
  displayName,
  isModerator,
  profileError,
  onRefetch,
  onOpenAchievements,
  onOpenNotifications,
  onOpenPrivacy,
  onOpenVerifyId,
  onSignOut,
  onDeleteAccount,
  isDeleting,
}: ProfileSettingsProps) {
  const { t } = useTranslation();
  const deleteDescriptionId = useId();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        aria-describedby="settings-description"
        className="flex flex-col p-0 h-full overflow-hidden min-h-0"
      >
        <SheetHeader className="shrink-0 border-b border-border px-6 py-4">
          <SheetTitle className="font-serif">{t('settings.title')}</SheetTitle>
          <SheetDescription id="settings-description" className="sr-only">
            {t('settings.account')} {t('settings.language')} {t('settings.notifications')}{' '}
            {t('settings.privacy')} {t('settings.achievements')}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 min-h-0 max-h-[70vh] w-full">
          <div className="px-6 py-4 space-y-4">
            <CardV2 padding="none">
              <CardV2Header className="p-6 pb-2">
                <CardV2Title className="text-base">{t('settings.account')}</CardV2Title>
                {displayName && (
                  <p className="text-sm font-medium text-primary">
                    @{displayName.toLowerCase().replace(/\s+/g, '_')}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {profileError && (
                  <p className="text-sm text-destructive mt-1">
                    {t('common.error')}. {onRefetch && (
                      <ButtonGhost type="button" className="p-0 h-auto text-destructive underline" onClick={onRefetch}>
                        {t('common.retry')}
                      </ButtonGhost>
                    )}
                  </p>
                )}
              </CardV2Header>
              <CardV2Content className="p-6 pt-0 space-y-3">
                {onOpenVerifyId && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { onOpenChange(false); onOpenVerifyId(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenChange(false); onOpenVerifyId(); } }}
                    className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm"
                  >
                    <span className="text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      {t('settings.verify_id')}
                    </span>
                    <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm">{t('settings.language')}</span>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm">{t('settings.notifications')}</span>
                  <ButtonGhost size="sm" onClick={onOpenNotifications}>
                    {t('settings.manage')}
                  </ButtonGhost>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm">{t('settings.privacy')}</span>
                  <ButtonGhost size="sm" onClick={onOpenPrivacy}>
                    {t('settings.manage')}
                  </ButtonGhost>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onOpenChange(false);
                    onOpenAchievements();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenChange(false);
                      onOpenAchievements();
                    }
                  }}
                  className="flex items-center justify-between py-2 border-b border-border w-full text-left cursor-pointer hover:bg-muted/50 rounded-sm"
                >
                  <span className="text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 shrink-0" />
                    {t('settings.achievements')}
                  </span>
                  <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                </div>
                <Link
                  to="/terms"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between py-2 border-b border-border w-full text-left hover:bg-muted/50 rounded-sm"
                >
                  <span className="text-sm">{t('settings.terms')}</span>
                  <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                </Link>
                <Link
                  to="/terms#integritet"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between py-2 border-b border-border w-full text-left hover:bg-muted/50 rounded-sm"
                >
                  <span className="text-sm">{t('settings.privacy_policy')}</span>
                  <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                </Link>
                <Link
                  to="/reporting"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between py-2 border-b border-border w-full text-left hover:bg-muted/50 rounded-sm"
                >
                  <span className="text-sm">{t('settings.reporting')}</span>
                  <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                </Link>
              </CardV2Content>
            </CardV2>
            <CardV2 padding="none">
              <CardV2Header className="p-6 pb-2">
                <CardV2Title className="text-base">{t('settings.support_and_reports')}</CardV2Title>
              </CardV2Header>
              <CardV2Content className="p-6 pt-0 space-y-0">
                <Link
                  to="/report-history"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between py-2 border-b border-border w-full text-left hover:bg-muted/50 rounded-sm"
                >
                  <span className="text-sm">{t('report.history_title')}</span>
                  <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                </Link>
                <Link
                  to="/report"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between py-2 border-b border-border w-full text-left hover:bg-muted/50 rounded-sm"
                >
                  <span className="text-sm">{t('report.report_problem')}</span>
                  <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                </Link>
                <Link
                  to="/appeal"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between py-2 border-b border-border w-full text-left hover:bg-muted/50 rounded-sm"
                >
                  <span className="text-sm">{t('appeal.title')}</span>
                  <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                </Link>
                {isModerator === true && (
                  <Link
                    to="/admin/reports"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between py-2 w-full text-left hover:bg-muted/50 rounded-sm"
                  >
                    <span className="text-sm">{t('admin.reports_title')}</span>
                    <span className="text-sm text-muted-foreground">{t('settings.view')}</span>
                  </Link>
                )}
              </CardV2Content>
            </CardV2>
            <ButtonCoral className="w-full" onClick={onSignOut}>
              <LogOut className="w-4 h-4 shrink-0 mr-2" />
              {t('settings.logout')}
            </ButtonCoral>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <ButtonSecondary
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4 shrink-0 mr-2" />
                  {t('settings.delete_account')}
                </ButtonSecondary>
              </AlertDialogTrigger>
              <AlertDialogContent aria-describedby={deleteDescriptionId}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.delete_account_title')}</AlertDialogTitle>
                  <AlertDialogDescription id={deleteDescriptionId}>
                    {t('settings.delete_account_description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDeleteAccount}
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
  );
}
