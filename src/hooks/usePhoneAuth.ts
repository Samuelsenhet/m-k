import { useState } from "react";
import { supabase, hasValidSupabaseConfig } from "@/integrations/supabase/client";

export type PhoneAuthStep = "phone" | "verify" | "profile";

export const usePhoneAuth = () => {
  const [step, setStep] = useState<PhoneAuthStep>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- HELPERS ---------- */

  const formatPhoneE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");

    // Swedish numbers: remove leading 0, add +46
    if (digits.startsWith("0")) {
      return `+46${digits.slice(1)}`;
    }

    // Already without leading zero
    if (digits.startsWith("46")) {
      return `+${digits}`;
    }

    return `+46${digits}`;
  };

  const getEnv = () => {
    // Try to get URL from multiple sources
    let url = import.meta.env.VITE_SUPABASE_URL;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anon =
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Construct URL from project ID if URL is not provided or is placeholder
    if ((!url || url.includes('your_project') || url.includes('placeholder')) && 
        projectId && 
        !projectId.includes('your_project') && 
        !projectId.includes('placeholder')) {
      url = `https://${projectId}.supabase.co`;
    }

    if (!url || !anon) {
      throw new Error("Supabase environment variables missing. Please set VITE_SUPABASE_URL (or VITE_SUPABASE_PROJECT_ID) and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file. See CHECK_SETUP.md for instructions.");
    }

    // Check for placeholder values
    const isPlaceholder = 
      url.includes('your_project') || 
      url.includes('your-project') ||
      url.includes('placeholder') ||
      anon.includes('your_anon') ||
      anon.includes('your-anon') ||
      anon.includes('placeholder');

    if (isPlaceholder) {
      throw new Error("Supabase environment variables contain placeholder values. Please update your .env file with real values from https://supabase.com/dashboard → Settings → API");
    }

    // Validate URL format
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      throw new Error(`Invalid Supabase URL format. Expected: https://xxx.supabase.co, got: ${url}`);
    }

    return { url, anon };
  };

  const handleError = (err: unknown, fallback: string) => {
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) console.error('Phone auth error:', err);
    }
    
    let errorMessage = fallback;
    
    if (err instanceof Error) {
      errorMessage = err.message;
      
      // Provide more helpful messages for common errors
      if (err.message.includes('fetch') || err.message.includes('network')) {
        errorMessage = 'Nätverksfel. Kontrollera din internetanslutning och att Supabase är korrekt konfigurerad.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS-fel. Kontrollera att edge-funktionerna är korrekt deployade.';
      } else if (err.message.includes('environment variables')) {
        errorMessage = 'Konfigurationsfel: Supabase miljövariabler saknas. Kontrollera .env-filen.';
      } else if (err.message.includes('edge-funktionen')) {
        errorMessage = err.message; // Already a helpful message
      }
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    setError(errorMessage);
    return false;
  };

  /* ---------- SEND OTP ---------- */

  const sendOtp = async (phone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    if (!hasValidSupabaseConfig) {
      setError("Supabase är inte konfigurerad. Lägg till VITE_SUPABASE_URL och VITE_SUPABASE_PUBLISHABLE_KEY i .env för inloggning, eller testa appen utan konto via Demo.");
      setLoading(false);
      return false;
    }

    try {
      getEnv();
      const formattedPhone = formatPhoneE164(phone);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          // allow new users to be created on first OTP
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        const msg = otpError.message || "Kunde inte skicka verifieringskod";
        // Common Supabase Phone Auth setup issues
        if (msg.toLowerCase().includes("captcha")) {
          throw new Error(
            "SMS-inloggning kräver CAPTCHA i din Supabase-inställning. Stäng av CAPTCHA för Phone Auth eller implementera captchaToken i klienten."
          );
        }
        if (msg.toLowerCase().includes("phone provider is disabled") || msg.toLowerCase().includes("provider")) {
          throw new Error(
            "SMS-inloggning är inte aktiverad i Supabase. Gå till Supabase Dashboard → Authentication → Providers → Phone och aktivera."
          );
        }
        throw new Error(msg);
      }

      setStep("verify");
      return true;
    } catch (err) {
      return handleError(err, "Kunde inte skicka verifieringskod");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- VERIFY OTP ---------- */

  const verifyOtp = async (phone: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    if (!hasValidSupabaseConfig) {
      setError("Supabase är inte konfigurerad. Lägg till .env för inloggning.");
      setLoading(false);
      return false;
    }

    try {
      getEnv();
      const formattedPhone = formatPhoneE164(phone);

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: "sms",
      });

      if (verifyError) {
        const msg = verifyError.message || "Ogiltig verifieringskod";
        if (msg.toLowerCase().includes("expired")) {
          throw new Error("Koden har utgått. Skicka en ny kod och försök igen.");
        }
        throw new Error(msg);
      }

      if (!data?.session) {
        throw new Error("Ingen session returnerades");
      }

      // After successful verification we always proceed to profile completion step (age verification)
      setStep("profile");

      return true;
    } catch (err) {
      return handleError(err, "Ogiltig verifieringskod");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (phone: string) => sendOtp(phone);
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
    hasValidSupabaseConfig,
  };
};
