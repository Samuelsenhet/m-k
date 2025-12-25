import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalityResult {
  id: string;
  category: string;
  scores: Record<string, number> | unknown;
  created_at: string;
}

interface Profile {
  display_name: string | null;
}

const categoryInfo: Record<string, { emoji: string; title: string; color: string }> = {
  DIPLOMAT: { emoji: '🕊️', title: 'Diplomaten', color: 'bg-diplomat' },
  STRATEGER: { emoji: '🎯', title: 'Strategen', color: 'bg-strateger' },
  BYGGARE: { emoji: '🔧', title: 'Byggaren', color: 'bg-byggare' },
  UPPTÄCKARE: { emoji: '🌍', title: 'Upptäckaren', color: 'bg-upptackare' },
};

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<PersonalityResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoadingData(true);
    
    const [profileRes, resultsRes] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('user_id', user.id).single(),
      supabase.from('personality_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (resultsRes.data) setResults(resultsRes.data as PersonalityResult[]);
    
    setLoadingData(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Logga ut
          </Button>
        </div>

        <Card className="mb-8 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-xl font-display">{profile?.display_name || 'Användare'}</div>
                <div className="text-sm text-muted-foreground font-normal">{user?.email}</div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold">Dina personlighetsresultat</h2>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Uppdatera
            </Button>
          </div>

          {results.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">Du har inte gjort testet ännu.</p>
                <Button asChild>
                  <Link to="/">Gör personlighetstestet</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            results.map((result) => {
              const info = categoryInfo[result.category] || { emoji: '❓', title: result.category, color: 'bg-muted' };
              return (
                <Card key={result.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-2xl', info.color)}>
                        {info.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-display font-semibold text-lg">{info.title}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(result.created_at).toLocaleDateString('sv-SE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Poäng</div>
                        <div className="font-mono text-sm">
                          {typeof result.scores === 'object' && result.scores !== null && Object.entries(result.scores as Record<string, number>).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="mr-2">{key}: {value}</span>
                          )).slice(0, 3)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
