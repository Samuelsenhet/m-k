import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      checkOnboardingStatus();
    }
  }, [user, loading, navigate]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, date_of_birth')
      .eq('user_id', user.id)
      .single();

    if (error || !profile) {
      // No profile yet, redirect to phone-auth to complete age verification
      navigate('/phone-auth');
      return;
    }

    if (!profile.date_of_birth) {
      // Age not verified yet, go back to phone-auth
      navigate('/phone-auth');
      return;
    }

    if (profile.onboarding_completed) {
      // Already completed onboarding, redirect to home
      navigate('/');
      return;
    }
    
    setCheckingStatus(false);
  };

  const handleComplete = () => {
    navigate('/');
  };

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  return <OnboardingWizard onComplete={handleComplete} />;
}
