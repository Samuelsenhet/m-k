import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, ArrowLeft, LogOut, Calendar, Sparkles, User, MessageCircle, Settings } from 'lucide-react';
import { CATEGORY_INFO, ARCHETYPE_INFO, DimensionKey, PersonalityCategory, ArchetypeCode } from '@/types/personality';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { toast } from 'sonner';

interface PersonalityResultRow {
  id: string;
  user_id: string;
  scores: unknown;
  category: string;
  archetype?: string;
  created_at: string;
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<PersonalityResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

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
      setResults((data as unknown as PersonalityResultRow[]) || []);
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

  const latestResult = results[0];
  const archetypeInfo = latestResult?.archetype ? ARCHETYPE_INFO[latestResult.archetype as ArchetypeCode] : null;
  const categoryInfo = latestResult?.category ? CATEGORY_INFO[latestResult.category as PersonalityCategory] : null;

  return (
    <div className="min-h-screen gradient-hero">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <nav className="flex justify-between items-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Tillbaka</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/chat">
              <Button variant="ghost" size="icon">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </nav>

        {/* Profile Header with Archetype */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center shadow-glow mx-auto mb-4">
            {archetypeInfo ? (
              <span className="text-3xl">{archetypeInfo.emoji}</span>
            ) : (
              <Heart className="w-10 h-10 text-primary-foreground" fill="currentColor" />
            )}
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">
            {archetypeInfo ? archetypeInfo.title : 'Min profil'}
          </h1>
          {archetypeInfo && (
            <p className="text-sm text-muted-foreground">
              {categoryInfo?.emoji} {categoryInfo?.title} • {archetypeInfo.name}
            </p>
          )}
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="personality" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Personlighet</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Inställningar</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab - Edit Profile */}
          <TabsContent value="profile" className="animate-fade-in">
            <ProfileEditor />
          </TabsContent>

          {/* Personality Tab */}
          <TabsContent value="personality" className="animate-fade-in space-y-4">
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
              <div className="space-y-4">
                {/* Latest Result Highlight */}
                {latestResult && archetypeInfo && (
                  <Card className="shadow-glow border-primary/20 overflow-hidden">
                    <div className="gradient-primary p-4 text-primary-foreground">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{archetypeInfo.emoji}</span>
                        <div>
                          <h3 className="font-serif text-xl font-bold">{archetypeInfo.title}</h3>
                          <p className="text-sm opacity-90">{archetypeInfo.name} • {categoryInfo?.title}</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-4 space-y-4">
                      <p className="text-sm text-muted-foreground">{archetypeInfo.description}</p>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Kärleksstil</h4>
                        <p className="text-sm text-muted-foreground">{archetypeInfo.loveStyle}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Styrkor</h4>
                        <div className="flex flex-wrap gap-2">
                          {archetypeInfo.strengths.map((strength) => (
                            <span 
                              key={strength} 
                              className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                            >
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Score Bars */}
                      <div className="pt-2">
                        <h4 className="text-sm font-semibold mb-3">Dina dimensioner</h4>
                        <div className="space-y-3">
                          {(Object.entries(latestResult.scores as Record<DimensionKey, number>)).map(([key, score]) => {
                            const dimension = key as DimensionKey;
                            const labels = {
                              ei: { left: 'I', right: 'E' },
                              sn: { left: 'N', right: 'S' },
                              tf: { left: 'F', right: 'T' },
                              jp: { left: 'P', right: 'J' },
                              at: { left: 'T', right: 'A' },
                            };
                            return (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{labels[dimension].left}</span>
                                  <span>{labels[dimension].right}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all duration-500 rounded-full"
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Previous Results */}
                {results.length > 1 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Tidigare resultat</h4>
                    {results.slice(1).map((result) => {
                      const info = CATEGORY_INFO[result.category as PersonalityCategory];
                      return (
                        <Card key={result.id} className="shadow-soft">
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{info?.emoji || '🧩'}</span>
                                <span className="text-sm font-medium">{info?.title || result.category}</span>
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(result.created_at).toLocaleDateString('sv-SE')}
                              </span>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <Button asChild variant="outline" className="w-full">
                  <Link to="/">Gör testet igen</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="animate-fade-in">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Kontoinställningar</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Notifikationer</p>
                    <p className="text-sm text-muted-foreground">Få meddelanden om nya matchningar</p>
                  </div>
                  <Button variant="outline" size="sm">Hantera</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Integritet</p>
                    <p className="text-sm text-muted-foreground">Kontrollera vad andra ser</p>
                  </div>
                  <Button variant="outline" size="sm">Hantera</Button>
                </div>
                <div className="pt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logga ut
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
