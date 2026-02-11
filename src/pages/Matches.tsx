import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { useMatchStatus } from '@/hooks/useMatchStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CATEGORY_INFO, ARCHETYPE_INFO, ArchetypeCode } from '@/types/personality';
import { Heart, X, Sparkles, Users, RefreshCw, MessageCircle, Brain, Clock, Zap, Info } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ProfileCompletionPrompt } from '@/components/profile/ProfileCompletionPrompt';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { MatchCountdown } from '@/components/matches/MatchCountdown';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { WaitingPhase, FirstMatchCelebration } from '@/components/journey';
import { cn } from '@/lib/utils';
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

// Category badge class mapping for psychological color coding
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
  const { user, loading: authLoading } = useAuth();
  const { matches, loading, error, refreshMatches, likeMatch, passMatch } = useMatches();
  const { status: matchStatus, isLoading: statusLoading } = useMatchStatus();
  const achievementsCtx = useAchievementsContextOptional();
  const navigate = useNavigate();
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [specialMessage, setSpecialMessage] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
    }
  }, [user, authLoading, navigate]);

  // Check for first match celebration and first_match achievement
  useEffect(() => {
    if (matches.length > 0) {
      const firstMatch = matches[0];
      // Check if this has special effects (first match ever)
      if (firstMatch.special_effects?.includes('celebration')) {
        setSpecialMessage(firstMatch.special_event_message || '🎉 Dina första matchningar är här!');
        setShowCelebration(true);
      }
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

  if (authLoading || loading || statusLoading) {
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
      {/* First Match Celebration Overlay */}
      {showCelebration && (
        <FirstMatchCelebration
          specialMessage={specialMessage}
          matchCount={matches.length}
          onContinue={() => setShowCelebration(false)}
        />
      )}

      <div className="min-h-screen bg-gradient-premium pb-24 safe-area-bottom">
        <div className="container max-w-lg mx-auto px-4 py-6">
          {/* Premium Header */}
          <div className="flex items-center justify-between mb-6 animate-slide-in-right">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-1">
                Dagens matchningar
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                24h löpande • Kvalitetsfokus
              </p>
            </div>
            <div className="flex gap-1">
              {isDemoEnabled && (
              <Button asChild variant="ghost" size="icon" className="text-primary" title="Se demo">
                <Link to="/demo-seed">
                  <Sparkles className="w-5 h-5" />
                </Link>
              </Button>
            )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={cn(showAIPanel && "bg-primary/10 text-primary")}
              >
                <Brain className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={refreshMatches}>
                <RefreshCw className="w-5 h-5" />
              </Button>
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

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

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
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
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
                      <Button 
                        asChild
                        size="sm" 
                        className="gap-2 bg-gradient-rose-glow text-white border-0 shadow-glow-rose hover:shadow-glow-rose active:scale-95"
                      >
                        <Link to={`/chat?match=${match.id}`}>
                          <MessageCircle className="w-4 h-4" />
                          Chatta
                        </Link>
                      </Button>
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

            {/* Match cards */}
            <div className="space-y-6">
            {filteredMatches.map((match, index) => {
              const archetype = match.matchedUser.archetype as ArchetypeCode | undefined;
              const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype] : null;
              const categoryInfo = CATEGORY_INFO[match.matchedUser.category];
              const photos = match.matchedUser.photos || [];
              const primaryPhoto = photos[0];

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div 
                    className="card-premium overflow-hidden relative animate-scale-in cursor-pointer hover:scale-[1.02] transition-transform" 
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(`/view-match?match=${match.id}`)}
                  >
                    {/* Premium Photo section */}
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/80 rounded-2xl overflow-hidden">
                      {primaryPhoto ? (
                        <img 
                          src={getPhotoUrl(primaryPhoto)} 
                          alt={match.matchedUser.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <div className="text-center">
                            <div className="text-6xl mb-2">{archetypeInfo?.emoji || categoryInfo?.emoji || '💫'}</div>
                            <p className="text-sm text-muted-foreground">Inga foton ännu</p>
                          </div>
                        </div>
                      )}
                      {/* Premium Overlay info */}
                      <div className="absolute bottom-4 left-4 right-4 glass-dark rounded-2xl px-4 py-3 shadow-2xl max-w-[75%]">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="font-bold text-xl text-white">{match.matchedUser.displayName}</span>
                          <span className="text-2xl">{archetypeInfo?.emoji || categoryInfo?.emoji}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryBadgeClass(match.matchedUser.category)}`}>
                            {archetypeInfo?.title || categoryInfo?.title}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-glow-primary">
                            {match.matchScore}% match
                          </span>
                        </div>
                      </div>
                      {/* Premium Match type badge */}
                      <div className={`absolute top-4 left-4 glass-dark px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg ${
                        match.matchType === 'similar' 
                          ? 'text-rose-300 border border-rose-400/30' 
                          : 'text-violet-300 border border-violet-400/30'
                      }`}>
                        {match.matchType === 'similar' ? (
                          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Liknande</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Kompletterande</span>
                        )}
                      </div>
                      {/* Photo count indicator */}
                      {photos.length > 1 && (
                        <div className="absolute top-4 right-20 glass-dark text-white text-xs px-3 py-1.5 rounded-xl font-semibold shadow-lg">
                          1/{photos.length}
                        </div>
                      )}
                      {/* Premium Vertical action buttons */}
                      <div className="flex flex-col gap-3 items-end absolute top-4 right-4 z-10">
                        <button 
                          onClick={() => passMatch(match.id)}
                          className="glass-dark rounded-full p-3 shadow-lg hover:bg-red-500/30 transition-premium active:scale-90 touch-manipulation"
                          aria-label="Passa"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                        <button 
                          asChild
                          className="glass-dark rounded-full p-3 shadow-lg bg-primary hover:opacity-90 transition-premium active:scale-90 touch-manipulation mt-2"
                          aria-label="Chatta"
                        >
                          <Link to={`/chat?match=${match.id}`}>
                            <MessageCircle className="w-5 h-5 text-white" />
                          </Link>
                        </button>
                      </div>
                    </div>

                    <div className="p-6 pt-6 bg-white/90 backdrop-blur-sm">
                      {/* Premium Name and archetype */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{match.matchedUser.displayName}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{archetypeInfo?.emoji || categoryInfo?.emoji}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryBadgeClass(match.matchedUser.category)}`}>
                              {archetypeInfo?.title || categoryInfo?.title}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-gradient">
                            {match.matchScore}%
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">matchning</div>
                          <MatchCountdown expiresAt={match.expiresAt} className="mt-1 justify-end" />
                        </div>
                      </div>

                      {/* Premium Archetype description */}
                      {archetypeInfo && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-2 font-medium leading-relaxed">
                          {archetypeInfo.description}
                        </p>
                      )}

                      {/* Premium Strengths */}
                      {archetypeInfo && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {archetypeInfo.strengths.slice(0, 3).map((strength, i) => (
                            <span 
                              key={i} 
                              className={`px-3 py-1.5 text-xs rounded-xl font-semibold ${getCategoryBadgeClass(match.matchedUser.category)}`}
                            >
                              {strength}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Premium Bio */}
                      {match.matchedUser.bio && (
                        <p className="text-sm text-muted-foreground mb-5 italic font-medium leading-relaxed border-l-4 border-primary pl-4">
                          "{match.matchedUser.bio}"
                        </p>
                      )}

                      {/* AI comment: why likhet/motsatt – attractive card */}
                      {match.personalityInsight && (
                        <div className="mb-5 rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-card">
                          <p className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                              <Sparkles className="h-3.5 w-3.5" />
                            </span>
                            Varför ni matchade
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed pl-9">{match.personalityInsight}</p>
                        </div>
                      )}

                      {/* Premium Match score bar */}
                      <div className="mb-5">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            className="h-full bg-gradient-rose-glow rounded-full shadow-glow-rose"
                            initial={{ width: 0 }}
                            animate={{ width: `${match.matchScore}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 + 0.3, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Premium Action buttons */}
                      <div className="flex gap-3">
                        <button 
                          className="flex-1 gap-2 px-4 py-3 rounded-2xl border-2 border-border bg-card hover:bg-muted hover:border-destructive/50 text-foreground font-semibold transition-premium active:scale-95 touch-manipulation flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            passMatch(match.id);
                          }}
                        >
                          <X className="w-5 h-5" />
                          Passa
                        </button>
                        <button 
                          className="flex-1 gap-2 px-4 py-3 rounded-2xl bg-gradient-rose-glow text-white font-bold shadow-glow-rose hover:shadow-glow-rose hover:scale-[1.02] transition-bounce active:scale-95 touch-manipulation flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            likeMatch(match.id);
                          }}
                        >
                          <Heart className="w-5 h-5 fill-white" />
                          Gilla
                        </button>
                        <button
                          className="px-4 py-3 rounded-2xl border-2 border-primary bg-card hover:bg-primary/5 text-primary font-semibold transition-premium active:scale-95 touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/view-match?match=${match.id}`);
                          }}
                        >
                          Se profil
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </div>
        )}

        {!error && pendingMatches.length === 0 && mutualMatches.length === 0 && (
          <motion.div
            className="card-premium text-center py-16 rounded-2xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-6 rounded-3xl gradient-primary flex items-center justify-center shadow-glow-primary"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <p className="text-lg font-bold text-foreground mb-2">Inga matchningar just nu</p>
            <p className="text-sm text-muted-foreground font-medium mb-6">Kom tillbaka imorgon för nya matchningar! ✨</p>
          </motion.div>
        )}
        </div>
      </div>
      <NotificationPrompt />
      <BottomNav />
    </>
  );
}
