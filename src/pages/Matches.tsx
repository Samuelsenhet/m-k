import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/useMatches';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORY_INFO, ARCHETYPE_INFO, ArchetypeCode } from '@/types/personality';
import { Heart, X, ArrowLeft, Sparkles, Users, RefreshCw, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';
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
    <div className="min-h-screen gradient-hero">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Link>
          <Button variant="ghost" size="icon" onClick={refreshMatches}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <h1 className="text-3xl font-serif font-bold mb-2">Dagens matchningar</h1>
        <p className="text-muted-foreground mb-8">
          3 liknande + 2 kompletterande profiler varje dag
        </p>

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
                const categoryInfo = CATEGORY_INFO[match.matchedUser.category];
                return (
                  <Card key={match.id} className="border-primary/30 bg-primary/5 shadow-glow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                          {categoryInfo?.emoji || '💫'}
                        </div>
                        <div>
                          <p className="font-semibold">{match.matchedUser.displayName}</p>
                          <p className="text-sm text-muted-foreground">{categoryInfo?.title}</p>
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
          <div className="space-y-4">
            {pendingMatches.map((match, index) => {
              const categoryInfo = CATEGORY_INFO[match.matchedUser.category];
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="shadow-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-3xl">
                            {categoryInfo?.emoji || '💫'}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{match.matchedUser.displayName}</p>
                            <p className="text-sm text-muted-foreground">{categoryInfo?.title}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
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

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full gradient-primary rounded-full"
                              style={{ width: `${match.matchScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{match.matchScore}%</span>
                        </div>
                      </div>

                      {match.matchedUser.bio && (
                        <p className="text-sm text-muted-foreground mb-4">"{match.matchedUser.bio}"</p>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => passMatch(match.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Passa
                        </Button>
                        <Button 
                          className="flex-1 gradient-primary text-primary-foreground border-0"
                          onClick={() => likeMatch(match.id)}
                        >
                          <Heart className="w-4 h-4 mr-2" />
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
    </div>
  );
}
