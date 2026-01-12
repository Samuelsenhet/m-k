import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [displayName, setDisplayName] = useState<string | undefined>();

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, date_of_birth, display_name')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // No profile yet, redirect to phone-auth to complete age verification
      navigate('/phone-auth');
      return;
    }

    if (!data.date_of_birth) {
      // Missing date_of_birth, redirect to phone-auth to complete
      navigate('/phone-auth');
      return;
    }

    if (data.onboarding_completed) {
      // Already completed onboarding, redirect to home
      navigate('/');
      return;
    }
    
    setDisplayName(data.display_name || undefined);
    setCheckingStatus(false);
  }, [navigate, user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/phone-auth');
      return;
    }

    if (user) {
      checkOnboardingStatus();
    }
  }, [user, loading, navigate, checkOnboardingStatus]);

  const handleComplete = async () => {
    // Re-fetch to get the updated display_name after wizard completion
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      
      setDisplayName(data?.display_name?.split(' ')[0] || undefined);
    }
    setShowWelcome(true);
  };

  const handleWelcomeContinue = () => {
    navigate('/matches');
  };

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  if (showWelcome) {
    return <WelcomeScreen displayName={displayName} onContinue={handleWelcomeContinue} />;
  }

  return <OnboardingWizard onComplete={handleComplete} />;
}
