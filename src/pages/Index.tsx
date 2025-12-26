import { useState } from 'react';
import { LandingPage } from '@/components/landing/LandingPage';
import { PersonalityTest } from '@/components/personality/PersonalityTest';
import { PersonalityResult } from '@/components/personality/PersonalityResult';
import type { PersonalityTestResult } from '@/types/personality';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppState = 'landing' | 'test' | 'result';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [testResult, setTestResult] = useState<PersonalityTestResult | null>(null);
  const { user } = useAuth();

  const handleStartTest = () => {
    setAppState('test');
  };

  const handleTestComplete = async (result: PersonalityTestResult) => {
    setTestResult(result);
    setAppState('result');
    
    // Save result if user is logged in
    if (user) {
      const { error } = await supabase
        .from('personality_results')
        .insert({
          user_id: user.id,
          scores: result.scores,
          category: result.category,
        });
      
      if (error) {
        toast.error('Kunde inte spara resultatet');
      } else {
        toast.success('Resultatet har sparats till din profil!');
      }
    }
  };

  const handleRestart = () => {
    setTestResult(null);
    setAppState('landing');
  };

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
        <PersonalityResult result={testResult} onRestart={handleRestart} />
      )}
    </>
  );
};

export default Index;
