import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { useMatchStatus } from '@/hooks/useMatchStatus';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_INFO, ARCHETYPE_INFO, ArchetypeCode } from '@/types/personality';
import { Sparkles, Users, RefreshCw, MessageCircle, Brain, Clock, Zap } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ProfileCompletionPrompt } from '@/components/profile/ProfileCompletionPrompt';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { MatchCountdown } from '@/components/matches/MatchCountdown';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { WaitingPhase } from '@/components/journey';
import {
  BestMatchCard,
  ButtonGhost,
  ButtonCoral,
  ButtonSecondary,
  ButtonPrimary,
  ButtonIcon,
  CardV2,
  CardV2Content,
  MatchCelebration,
} from '@/components/ui-v2';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
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
    console.error('Error getting photo URL:', error);
    return '';
  }
}

/** Map API category to ui-v2 ArchetypeKey (diplomat, strateger, byggare, upptackare) */
function toArchetypeKey(category: string | undefined): 'diplomat' | 'strateger' | 'byggare' | 'upptackare' | undefined {
  if (!category) return undefined;
  const key = category.toLowerCase();
  if (key === 'diplomat' || key === 'strateger' || key === 'byggare' || key === 'upptackare') return key;
  return undefined;
}

const getCategoryBadgeClass = (category: string) => {
  const classes: Record<string, string> = {
    DIPLOMAT: 'badge-diplomat',
    STRATEGER: 'badge-strateger',
    BYGGARE: 'badge-byggare',
    UPPTÄCKARE: 'badge-upptackare',
  };
  return classes[category] || 'bg-secondary text-secondary-foreground';
};

export default function Matches() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { matches, loading, error, refreshMatches, passMatch } = useMatches();
  const { status: matchStatus, isLoading: statusLoading } = useMatchStatus();
  const achievementsCtx = useAchievementsContextOptional();
  const navigate = useNavigate();
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [celebrationMatch, setCelebrationMatch] = useState<typeof matches[0] | null>(null);
  const emptyMatchesMascot = useMascot(MASCOT_SCREEN_STATES.EMPTY_MATCHES);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
    }
  }, [user, authLoading, navigate]);

  // Show MatchCelebration when any match has special_effects "celebration"
  useEffect(() => {
    if (matches.length > 0) {
      const withCelebration = matches.find((m) => m.special_effects?.includes('celebration'));
      if (withCelebration) setCelebrationMatch(withCelebration);
    }
  }, [matches]);
  useEffect(() => {
    const mutualCount = matches.filter((m) => m.status === 'mutual').length;
    if (mutualCount >= 1 && achievementsCtx) {
      achievementsCtx.checkAndAwardAchievement('first_match');
    }
  }, [matches, achievementsCtx]);

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

  // Honest error state: backend failed (e.g. 401) – do not show happy empty state
  if (error) {
    return (
      <>
        <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-6 pb-24">
          <CardV2 className="w-full max-w-md border border-destructive/50 bg-destructive/10">
            <CardV2Content className="p-6 text-center space-y-4">
              <p className="font-semibold text-destructive">
                Vi har problem att hämta matchningar just nu
              </p>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
              <ButtonPrimary onClick={() => refreshMatches()} fullWidth className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Försök igen
              </ButtonPrimary>
            </CardV2Content>
          </CardV2>
        </div>
        <BottomNav />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
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
      {/* Match celebration modal (when special_effects includes "celebration") */}
      {celebrationMatch && (
        <MatchCelebration
          matchId={celebrationMatch.id}
          displayName={celebrationMatch.matchedUser.displayName}
          avatarSrc={celebrationMatch.matchedUser.photos?.[0] ? getPhotoUrl(celebrationMatch.matchedUser.photos[0]) : null}
          personalityInsight={celebrationMatch.personalityInsight}
          onClose={() => setCelebrationMatch(null)}
          onChatta={() => navigate(`/chat?match=${celebrationMatch.id}`)}
          chattaLabel="Chatta"
        />
      )}

      <div className="min-h-screen bg-gradient-premium pb-24 safe-area-bottom">
        <div className="container max-w-lg mx-auto px-4 py-6">
          {/* Premium Header */}
          <div className="flex items-center justify-between mb-6 animate-slide-in-right">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-1">
                Dagens matchningar
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-primary" />
                24h löpande • Kvalitetsfokus
              </p>
            </div>
            <div className="flex gap-1">
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
        </div>

        {/* Premium Matching System Info Card */}
        <div className="mb-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-premium p-5 bg-card/90 border-border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-primary">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1.5 text-foreground">Smart Personlighetsanalys</h3>
                <p className="text-xs text-muted-foreground mb-3 font-medium">
                  Baserad på 30 frågor • 16 arketyper • 4 kategorier
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 bg-primary/15 text-primary px-3 py-1.5 rounded-full text-xs font-semibold border border-primary/30">
                    <Users className="w-3.5 h-3.5" />
                    {similarMatches.length} Likhets
                  </span>
                  <span className="flex items-center gap-1.5 bg-accent/15 text-accent px-3 py-1.5 rounded-full text-xs font-semibold border border-accent/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    {complementaryMatches.length} Motsats
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <AIAssistantPanel onClose={() => setShowAIPanel(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Completion Prompt */}
        <div className="mb-4">
          <ProfileCompletionPrompt />
        </div>

        {mutualMatches.length > 0 && (
          <motion.div
            className="mb-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            <motion.h2
              className="text-2xl font-bold mb-5 flex items-center gap-2.5"
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-rose-glow flex items-center justify-center shadow-glow-rose">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-gradient">
                Ömsesidiga matchningar ({mutualMatches.length})
              </span>
            </motion.h2>
            <div className="space-y-3">
              {mutualMatches.map((match, index) => {
                const archetype = match.matchedUser.archetype as ArchetypeCode | undefined;
                const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype] : null;
                const categoryInfo = CATEGORY_INFO[match.matchedUser.category];
                const primaryPhoto = match.matchedUser.photos?.[0];

                return (
                  <motion.div
                    key={match.id}
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="card-premium p-4 bg-card/90 border-border rounded-2xl vibe-card-hover"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {primaryPhoto ? (
                          <div className="relative">
                            <img 
                              src={getPhotoUrl(primaryPhoto)} 
                              alt={match.matchedUser.displayName}
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30 shadow-lg"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-card shadow-lg" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-3xl shadow-glow-primary text-primary-foreground">
                            {archetypeInfo?.emoji || categoryInfo?.emoji || '💫'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-lg text-foreground">{match.matchedUser.displayName}</p>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                            <span className="text-lg">{archetypeInfo?.emoji || categoryInfo?.emoji}</span>
                            <span>{archetypeInfo?.title || categoryInfo?.title}</span>
                          </div>
                        </div>
                      </div>
                      <ButtonCoral
                        asChild
                        size="sm"
                        className="gap-2"
                      >
                        <Link to={`/chat?match=${match.id}`}>
                          <MessageCircle className="w-4 h-4" />
                          Chatta
                        </Link>
                      </ButtonCoral>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {pendingMatches.length > 0 && (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  Alla ({pendingMatches.length})
                </TabsTrigger>
                <TabsTrigger value="similar" className="text-xs gap-1">
                  <Users className="w-3 h-3" />
                  Likhets ({similarMatches.length})
                </TabsTrigger>
                <TabsTrigger value="complementary" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  Motsats ({complementaryMatches.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Premium Match explanation */}
            <div className="text-center py-3 mb-2">
              {activeTab === 'similar' && (
                <p className="text-sm text-muted-foreground font-medium">
                  Personer med liknande värderingar och personlighet
                </p>
              )}
              {activeTab === 'complementary' && (
                <p className="text-sm text-muted-foreground font-medium">
                  Kompletterande personligheter för balans
                </p>
              )}
              {activeTab === 'all' && (
                <p className="text-sm text-muted-foreground font-medium">
                  Synkflöde + Vågflöde matchningar
                </p>
              )}
            </div>

            {/* Match cards V2: BestMatchCard + Passa → Chatta → Se profil */}
            <div className="space-y-6">
              {filteredMatches.map((match, index) => {
                const primaryPhoto = match.matchedUser.photos?.[0];
                const imageSrc = primaryPhoto ? getPhotoUrl(primaryPhoto) : null;
                const archetypeKey = toArchetypeKey(match.matchedUser.category);

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="space-y-3"
                  >
                    <BestMatchCard
                      name={match.matchedUser.displayName}
                      imageSrc={imageSrc}
                      imageAlt={match.matchedUser.displayName}
                      interests={match.interests}
                      archetype={archetypeKey}
                      matchType={match.matchType}
                      className="hover:shadow-elevation-2"
                    />
                    <div className="flex flex-wrap gap-2">
                      <ButtonGhost onClick={() => passMatch(match.id)} className="flex-1 min-w-[80px]">
                        {t('matches.pass')}
                      </ButtonGhost>
                      <ButtonCoral asChild className="flex-1 min-w-[80px]">
                        <Link to={`/chat?match=${match.id}`} className="inline-flex items-center justify-center gap-2">
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          Chatta
                        </Link>
                      </ButtonCoral>
                      <ButtonSecondary onClick={() => navigate(`/view-match?match=${match.id}`)} className="shrink-0">
                        Se profil
                      </ButtonSecondary>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {!error && pendingMatches.length === 0 && mutualMatches.length === 0 && (
          <motion.div
            className="rounded-2xl border border-border bg-card shadow-elevation-1 text-center py-12 px-6"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <Mascot {...emptyMatchesMascot} className="mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-1">{t('matches.noMatches')}</p>
            <p className="text-sm text-muted-foreground font-medium mb-6">
              Kom tillbaka imorgon för nya matchningar!
            </p>
            {isDemoEnabled && (
              <ButtonGhost asChild size="sm" className="gap-2 border border-border">
                <Link to="/demo-seed">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  Se demo – matchningar & chatt
                </Link>
              </ButtonGhost>
            )}
          </motion.div>
        )}
        </div>
      </div>
      <NotificationPrompt />
      <BottomNav />
    </>
  );
}
