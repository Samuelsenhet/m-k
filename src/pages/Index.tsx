import { useState, useEffect } from 'react';
import { LandingPage } from '@/components/landing/LandingPage';
import { PersonalityTest } from '@/components/personality/PersonalityTest';
import { PersonalityResult } from '@/components/personality/PersonalityResult';
import type { PersonalityTestResult, ArchetypeCode, DimensionKey, PersonalityCategory } from '@/types/personality';
import { getCategoryFromArchetype } from '@/types/personality';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppState = 'landing' | 'test' | 'result' | 'loading';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [testResult, setTestResult] = useState<PersonalityTestResult | null>(null);
  const [hasExistingResult, setHasExistingResult] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Check if user already has a personality result
  useEffect(() => {
    const checkExistingResult = async () => {
      if (authLoading) return;
      
      if (!user) {
        setAppState('landing');
        return;
      }

      const { data, error } = await supabase
        .from('personality_results')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && !error) {
        // User already has a result - show it
        const savedScores = data.scores as Record<DimensionKey, number> | null;
        const scores: Record<DimensionKey, number> = savedScores || {
          ei: 50,
          sn: 50,
          tf: 50,
          jp: 50,
          at: 50
        };
        const archetype = data.archetype as ArchetypeCode || 'INFJ';
        const category = data.category as PersonalityCategory || getCategoryFromArchetype(archetype);
        
        setTestResult({
          scores,
          category,
          archetype,
          answers: [],
        });
        setHasExistingResult(true);
        setAppState('result');
      } else {
        setAppState('landing');
      }
    };

    checkExistingResult();
  }, [user, authLoading]);

  const handleStartTest = () => {
    // If user is logged in and already has a result, show message
    if (user && hasExistingResult) {
      toast.info('Du har redan gjort personlighetstestet. Ditt resultat visas på din profil.');
      return;
    }
    setAppState('test');
  };

  const handleTestComplete = async (result: PersonalityTestResult) => {
    setTestResult(result);
    setAppState('result');
    
    // Save result if user is logged in
    if (user) {
      // Double-check they don't already have a result
      const { data: existing } = await supabase
        .from('personality_results')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.info('Du har redan ett sparat resultat.');
        return;
      }

      const { error } = await supabase
        .from('personality_results')
        .insert({
          user_id: user.id,
          scores: result.scores,
          archetype: result.archetype,
          category: result.category
        });
      
      if (error) {
        toast.error('Kunde inte spara resultatet');
      } else {
        toast.success('Resultatet har sparats till din profil!');
        setHasExistingResult(true);
      }
    }
  };


  if (appState === 'loading') {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>MÄÄK - Personlighetsbaserad Dejting | Hitta Din Perfekta Matchning</title>
        <meta 
          name="description" 
          content="MÄÄK är Sveriges smartaste dejtingapp med AI-driven personlighetsmatchning. Ta vårt 30-frågor personlighetstest och hitta någon som verkligen passar dig." 
        />
        <meta name="keywords" content="dejting, personlighetstest, matchning, AI, Sverige, singlar" />
        <link rel="canonical" href="https://maak.app" />
      </Helmet>

      {appState === 'landing' && <LandingPage onStart={handleStartTest} />}
      {appState === 'test' && <PersonalityTest onComplete={handleTestComplete} />}
      {appState === 'result' && testResult && (
        <PersonalityResult 
          result={testResult} 
          isExistingResult={hasExistingResult}
        />
      )}
    </>
  );
};

export default Index;
