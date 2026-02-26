import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { useMatchStatus } from '@/hooks/useMatchStatus';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, RefreshCw, Brain } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ProfileCompletionPrompt } from '@/components/profile/ProfileCompletionPrompt';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { MatchCountdown } from '@/components/matches/MatchCountdown';
import { MatchesErrorState } from '@/components/matches/MatchesErrorState';
import { MatchesSuccessState } from '@/components/matches/MatchesSuccessState';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { WaitingPhase } from '@/components/journey';
import {
  ButtonIcon,
  LoadingStateWithMascot,
  EmptyStateWithMascot,
} from '@/components/ui-v2';
import { PageHeader } from '@/components/layout';
import { SCREEN_CONTAINER_CLASS } from '@/layout/screenLayout';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { isDemoEnabled } from '@/config/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useAchievementsContextOptional } from '@/contexts/AchievementsContext';

function getPhotoUrl(storagePath: string) {
  if (!storagePath) return '';
  try {
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
    return data?.publicUrl || '';
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error getting photo URL:', error);
    return '';
  }
}

function getNextMidnightISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getTimeRemainingUntil(iso: string | undefined): string {
  if (!iso) return '24h';
  const now = Date.now();
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return '24h';
  const diff = end - now;
  if (diff <= 0) return '0m';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Fallback waiting view when match-status is null but we have no error and no matches (e.g. backend not responding WAITING yet). */
function MatchesFallbackWaiting() {
  const [nextReset] = useState(() => getNextMidnightISO());
  const [timeRemaining, setTimeRemaining] = useState(() => getTimeRemainingUntil(nextReset));

  useEffect(() => {
    const update = () => setTimeRemaining(getTimeRemainingUntil(nextReset));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [nextReset]);

  return (
    <WaitingPhase
      timeRemaining={timeRemaining}
      nextMatchAvailable={nextReset}
    />
  );
}

export default function Matches() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { matches, loading, error, refreshMatches, passMatch } = useMatches();
  const { status: matchStatus, isLoading: statusLoading } = useMatchStatus();
  const achievementsCtx = useAchievementsContextOptional();
  const navigate = useNavigate();
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
    }
  }, [user, authLoading, navigate]);

  // FAS Relationship Depth: mutual match does NOT trigger celebration UI; only relationshipLevel.
  // (MatchCelebration modal removed – depth shown via list/profile/chat accents only.)
  useEffect(() => {
    const mutualCount = matches.filter((m) => m.status === 'mutual').length;
    if (mutualCount >= 1 && achievementsCtx) {
      achievementsCtx.checkAndAwardAchievement('first_match');
    }
  }, [matches, achievementsCtx]);

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show waiting phase if user is in WAITING journey phase (with nav so user can leave)
  if (matchStatus?.journey_phase === 'WAITING') {
    return (
      <>
        <WaitingPhase
          timeRemaining={matchStatus.time_remaining}
          nextMatchAvailable={matchStatus.next_reset_time}
        />
        <BottomNav />
      </>
    );
  }

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // 401: session invalid – redirect to sign-in rather than showing a cryptic error
  const is401Error = error && /401|unauthorized|token|auth/i.test(error);
  if (is401Error) {
    navigate('/phone-auth');
    return null;
  }

  // Honest error state: backend failed – do not show happy empty state
  if (error) {
    return (
      <MatchesErrorState
        message={t('matches.error_title')}
        reassure={t('matches.error_reassure')}
        detail={import.meta.env.DEV ? error : undefined}
        retryLabel={t('matches.retry')}
        onRetry={refreshMatches}
      />
    );
  }

  // Fallback waiting view: match-status didn't return WAITING (e.g. null/failed) but we have no error and no matches yet
  if (matchStatus === null && !loading && matches.length === 0) {
    return (
      <>
        <MatchesFallbackWaiting />
        <BottomNav />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-premium pb-24 safe-area-bottom flex flex-col">
          <LoadingStateWithMascot
            message={t('maak.waiting')}
            className="flex-1"
            emotionalConfig={{ screen: "matches", hasMatches: false }}
          />
        </div>
        <BottomNav />
      </>
    );
  }

  const pendingMatches = matches.filter((m) => m.status === 'pending');
  const mutualMatches = matches.filter((m) => m.status === 'mutual');
  const similarMatches = pendingMatches.filter((m) => m.matchType === 'similar');
  const complementaryMatches = pendingMatches.filter((m) => m.matchType === 'complementary');

  const getFilteredMatches = () => {
    switch (activeTab) {
      case 'similar':
        return similarMatches;
      case 'complementary':
        return complementaryMatches;
      default:
        return pendingMatches;
    }
  };

  const filteredMatches = getFilteredMatches();

  return (
    <>
      <div className="min-h-screen bg-gradient-premium pb-24 safe-area-bottom">
        <div className={SCREEN_CONTAINER_CLASS}>
          <div className="space-y-6">
            <PageHeader
              title={t('matches.title')}
              subtitle={t('matches.subtitle')}
              actions={
                <div className="flex gap-1 shrink-0">
                  {isDemoEnabled && (
                    <ButtonIcon asChild className="text-primary" aria-label="Se demo">
                      <Link to="/demo-seed">
                        <Sparkles className="w-5 h-5" />
                      </Link>
                    </ButtonIcon>
                  )}
                  <ButtonIcon
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className={cn(showAIPanel && "bg-primary/10 text-primary")}
                    aria-label="AI-panel"
                  >
                    <Brain className="w-5 h-5" />
                  </ButtonIcon>
                  <ButtonIcon onClick={refreshMatches} aria-label="Uppdatera">
                    <RefreshCw className="w-5 h-5" />
                  </ButtonIcon>
                </div>
              }
            />

            <AnimatePresence>
              {showAIPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <AIAssistantPanel onClose={() => setShowAIPanel(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            <ProfileCompletionPrompt />

            {(pendingMatches.length > 0 || mutualMatches.length > 0) ? (
              <MatchesSuccessState
                pendingMatches={pendingMatches}
                mutualMatches={mutualMatches}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onChat={(matchId) => navigate(`/chat?match=${matchId}`)}
                onViewProfile={(matchId) => navigate(`/view-match?match=${matchId}`)}
                getPhotoUrl={getPhotoUrl}
                isDemoEnabled={isDemoEnabled}
                hideHeader
              />
            ) : (
              <motion.div
                className="rounded-2xl border border-border bg-card shadow-elevation-1"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <EmptyStateWithMascot
                  screenState={MASCOT_SCREEN_STATES.EMPTY_MATCHES}
                  title={t('matches.noMatches')}
                  description={t('matches.noMatchesDescription')}
                  emotionalConfig={{ screen: "matches", hasMatches: false }}
                  action={
                    isDemoEnabled
                      ? {
                          label: 'Se demo – matchningar & chatt',
                          onClick: () => navigate('/demo-seed'),
                        }
                      : undefined
                  }
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <NotificationPrompt />
      <BottomNav />
    </>
  );
}
