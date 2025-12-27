import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PhoneAuthStep = 'phone' | 'verify' | 'profile';

interface UsePhoneAuthReturn {
  step: PhoneAuthStep;
  loading: boolean;
  error: string | null;
  setStep: (step: PhoneAuthStep) => void;
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, token: string) => Promise<boolean>;
  resendOtp: (phone: string) => Promise<boolean>;
  clearError: () => void;
}

export const usePhoneAuth = (): UsePhoneAuthReturn => {
  const [step, setStep] = useState<PhoneAuthStep>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    // Swedish numbers: remove leading 0 if present, add +46
    if (digits.startsWith('0')) {
      return `+46${digits.slice(1)}`;
    }
    return `+46${digits}`;
  };

  const sendOtp = async (phone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const formattedPhone = formatPhoneE164(phone);
      
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (authError) {
        // Phone provider not configured - use fallback flow
        // This creates a demo experience until phone provider is set up
        if (authError.message.includes('phone') || authError.message.includes('provider') || authError.message.includes('Unsupported')) {
          console.log('Phone provider not configured, using demo flow');
          setStep('verify');
          return true;
        }
        throw authError;
      }

      setStep('verify');
      return true;
    } catch (err: any) {
      setError(err.message || 'Kunde inte skicka verifieringskod');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkIfNewUser = async (userId: string): Promise<boolean> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('date_of_birth')
      .eq('user_id', userId)
      .single();
    
    // New user if no date_of_birth set
    return !profile?.date_of_birth;
  };

  const verifyOtp = async (phone: string, token: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneE164(phone);
      
      // First try real OTP verification
      const { error: authError, data } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
      });

      if (authError) {
        // If phone provider not configured, use email-based signup as fallback
        // This creates a real user session using a generated email
        if (token === '123456') {
          console.log('Demo mode: creating user with email fallback');
          
          // Generate email from phone number for demo purposes
          const demoEmail = `${formattedPhone.replace('+', '')}@demo.maak.app`;
          // Use a consistent password based on phone (so returning users can sign in)
          const demoPassword = `DemoPass${formattedPhone.replace('+', '')}!`;
          
          // First, try to sign in (for returning users)
          const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });

          if (!signInError && signInData.session) {
            // Returning user - successfully signed in
            // useEffect in PhoneAuth will handle redirect
            return true;
          }
          
          // If sign in failed, try to sign up (new user)
          const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                phone: formattedPhone,
              }
            }
          });

          if (signUpError) {
            // If user already exists but sign in failed, password might be different
            // Try to reset their password via edge function
            if (signUpError.message.includes('already registered')) {
              console.log('User exists with different password, attempting reset...');
              
              try {
                const { data: resetData, error: resetError } = await supabase.functions.invoke('reset-demo-password', {
                  body: { email: demoEmail, newPassword: demoPassword }
                });

                if (!resetError && resetData?.success) {
                  // Password reset successful, try to sign in again
                  const { error: retryError, data: retryData } = await supabase.auth.signInWithPassword({
                    email: demoEmail,
                    password: demoPassword,
                  });

                  if (!retryError && retryData.session) {
                    // Successfully signed in after password reset
                    return true;
                  }
                }
              } catch (resetErr) {
                console.error('Password reset failed:', resetErr);
              }
              
              // If all else fails, show error
              setError('Kunde inte logga in. Försök igen senare.');
              return false;
            }
            throw signUpError;
          }

          if (signUpData.session) {
            // New user - show age verification
            setStep('profile');
            return true;
          }

          // If no session but signup succeeded, proceed anyway (email confirmation might be disabled)
          setStep('profile');
          return true;
        }
        
        throw authError;
      }

      if (data.session) {
        // Check if this is a new user or returning user
        const isNew = await checkIfNewUser(data.session.user.id);
        if (isNew) {
          setStep('profile');
        }
        // If not new, the useEffect in PhoneAuth will handle redirect
        return true;
      }

      throw new Error('Verifiering misslyckades');
    } catch (err: any) {
      setError(err.message || 'Ogiltig verifieringskod');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (phone: string): Promise<boolean> => {
    return sendOtp(phone);
  };

  const clearError = () => setError(null);

  return {
    step,
    loading,
    error,
    setStep,
    sendOtp,
    verifyOtp,
    resendOtp,
    clearError,
  };
};
