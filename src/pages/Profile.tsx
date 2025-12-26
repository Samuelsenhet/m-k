import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, ArrowLeft, LogOut, Calendar, Sparkles } from 'lucide-react';
import { CATEGORY_INFO, DIMENSION_LABELS, DimensionKey, PersonalityCategory } from '@/types/personality';
import { toast } from 'sonner';

interface PersonalityResultRow {
  id: string;
  user_id: string;
  scores: Record<DimensionKey, number>;
  category: string;
  created_at: string;
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<PersonalityResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    if (!user) return;
    
    setLoadingResults(true);
    const { data, error } = await supabase
      .from('personality_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Kunde inte hämta resultat');
    } else {
      setResults((data as PersonalityResultRow[]) || []);
    }
    setLoadingResults(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Du har loggat ut');
    navigate('/');
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container max-w-4xl mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Link>
          <Button variant="ghost" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logga ut
          </Button>
        </nav>

        <div className="mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-glow mb-4">
            <Heart className="w-8 h-8 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Min profil</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Mina personlighetsresultat
          </h2>

          {loadingResults ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-muted-foreground">Laddar resultat...</div>
            </div>
          ) : results.length === 0 ? (
            <Card className="shadow-card border-border">
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Du har inte gjort personlighetstestet ännu</p>
                <Button asChild className="gradient-primary text-primary-foreground border-0">
                  <Link to="/">Gör testet nu</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {results.map((result) => {
                const categoryInfo = CATEGORY_INFO[result.category as PersonalityCategory];
                return (
                  <Card key={result.id} className="shadow-card border-border hover:shadow-glow transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{categoryInfo?.emoji || '🧩'}</span>
                          <div>
                            <CardTitle className="font-serif">{categoryInfo?.title || result.category}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(result.created_at).toLocaleDateString('sv-SE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{categoryInfo?.description}</p>
                      <div className="grid grid-cols-5 gap-2">
                        {(Object.entries(result.scores) as [DimensionKey, number][]).map(([key, score]) => {
                          const label = DIMENSION_LABELS[key];
                          return (
                            <div key={key} className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">{label?.name || key}</div>
                              <div className="text-sm font-semibold text-foreground">{Math.round(score)}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
