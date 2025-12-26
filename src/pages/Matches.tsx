import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/useMatches';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORY_INFO, ARCHETYPE_INFO, ArchetypeCode } from '@/types/personality';
import { Heart, X, Sparkles, Users, RefreshCw, MessageCircle, User, MapPin, Briefcase } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ProfileCompletionPrompt } from '@/components/profile/ProfileCompletionPrompt';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { MatchCountdown } from '@/components/matches/MatchCountdown';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function getPhotoUrl(storagePath: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${storagePath}`;
}

export default function Matches() {
  const { user, loading: authLoading } = useAuth();
  const { matches, loading, error, refreshMatches, likeMatch, passMatch } = useMatches();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/phone-auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const pendingMatches = matches.filter((m) => m.status === 'pending');
  const mutualMatches = matches.filter((m) => m.status === 'mutual');

  return (
    <div className="min-h-screen gradient-hero pb-20">
      <div className="container max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold">Dagens matchningar</h1>
            <p className="text-sm text-muted-foreground">
              3 liknande + 2 kompletterande
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={refreshMatches}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Completion Prompt */}
        <div className="mb-6">
          <ProfileCompletionPrompt />
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 text-center text-destructive">
              {error}
              <Link to="/" className="block mt-2 text-primary underline">
                Ta personlighetstestet
              </Link>
            </CardContent>
          </Card>
        )}

        {mutualMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-serif font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" fill="currentColor" />
              Ömsesidiga matchningar ({mutualMatches.length})
            </h2>
            <div className="space-y-4">
              {mutualMatches.map((match) => {
                const archetype = match.matchedUser.archetype as ArchetypeCode | undefined;
                const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype] : null;
                const categoryInfo = CATEGORY_INFO[match.matchedUser.category];
                const primaryPhoto = match.matchedUser.photos?.[0];

                return (
                  <Card key={match.id} className="border-primary/30 bg-primary/5 shadow-glow overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {primaryPhoto ? (
                          <img 
                            src={getPhotoUrl(primaryPhoto)} 
                            alt={match.matchedUser.displayName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                            {archetypeInfo?.emoji || categoryInfo?.emoji || '💫'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{match.matchedUser.displayName}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <span>{archetypeInfo?.emoji || categoryInfo?.emoji}</span>
                            <span>{archetypeInfo?.title || categoryInfo?.title}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        asChild
                        size="sm" 
                        className="gap-2 gradient-primary text-primary-foreground border-0"
                      >
                        <Link to={`/chat?match=${match.id}`}>
                          <MessageCircle className="w-4 h-4" />
                          Chatta
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {pendingMatches.length > 0 && (
          <div className="space-y-6">
            {pendingMatches.map((match, index) => {
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
                  <Card className="shadow-card overflow-hidden">
                    {/* Photo section */}
                    {primaryPhoto ? (
                      <div className="relative aspect-[4/3] bg-muted">
                        <img 
                          src={getPhotoUrl(primaryPhoto)} 
                          alt={match.matchedUser.displayName}
                          className="w-full h-full object-cover"
                        />
                        {/* Photo count indicator */}
                        {photos.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            1/{photos.length}
                          </div>
                        )}
                        {/* Match type badge */}
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          match.matchType === 'similar' 
                            ? 'bg-primary/80 text-primary-foreground' 
                            : 'bg-accent/80 text-accent-foreground'
                        }`}>
                          {match.matchType === 'similar' ? (
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Liknande</span>
                          ) : (
                            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Kompletterande</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-2">{archetypeInfo?.emoji || categoryInfo?.emoji || '💫'}</div>
                          <p className="text-sm text-muted-foreground">Inga foton ännu</p>
                        </div>
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                          match.matchType === 'similar' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-accent/10 text-accent'
                        }`}>
                          {match.matchType === 'similar' ? (
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Liknande</span>
                          ) : (
                            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Kompletterande</span>
                          )}
                        </div>
                      </div>
                    )}

                    <CardContent className="p-5">
                      {/* Name and archetype */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold">{match.matchedUser.displayName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg">{archetypeInfo?.emoji || categoryInfo?.emoji}</span>
                            <span className="text-sm font-medium text-primary">
                              {archetypeInfo?.title || categoryInfo?.title}
                            </span>
                            {archetypeInfo && (
                              <span className="text-xs text-muted-foreground">
                                ({archetypeInfo.name})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{match.matchScore}%</div>
                          <div className="text-xs text-muted-foreground">matchning</div>
                          <MatchCountdown expiresAt={match.expiresAt} className="mt-1 justify-end" />
                        </div>
                      </div>

                      {/* Archetype description */}
                      {archetypeInfo && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {archetypeInfo.description}
                        </p>
                      )}

                      {/* Strengths */}
                      {archetypeInfo && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {archetypeInfo.strengths.slice(0, 3).map((strength, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full"
                            >
                              {strength}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bio */}
                      {match.matchedUser.bio && (
                        <p className="text-sm text-muted-foreground mb-4 italic">
                          "{match.matchedUser.bio}"
                        </p>
                      )}

                      {/* Match score bar */}
                      <div className="mb-4">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full gradient-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${match.matchScore}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2"
                          onClick={() => passMatch(match.id)}
                        >
                          <X className="w-4 h-4" />
                          Passa
                        </Button>
                        <Button 
                          className="flex-1 gap-2 gradient-primary text-primary-foreground border-0"
                          onClick={() => likeMatch(match.id)}
                        >
                          <Heart className="w-4 h-4" />
                          Gilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {!error && pendingMatches.length === 0 && mutualMatches.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Inga matchningar just nu</p>
              <p className="text-sm text-muted-foreground mt-2">Kom tillbaka imorgon!</p>
            </CardContent>
          </Card>
        )}
      </div>
      <NotificationPrompt />
      <BottomNav />
    </div>
  );
}
