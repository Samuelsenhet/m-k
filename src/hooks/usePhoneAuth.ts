import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PhoneAuthStep = "phone" | "verify" | "profile";

type ErrorWithMessage = { message?: string };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as ErrorWithMessage).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
};

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
  const [step, setStep] = useState<PhoneAuthStep>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    // Swedish numbers: remove leading 0 if present, add +46
    if (digits.startsWith("0")) {
      return `+46${digits.slice(1)}`;
    }
    return `+46${digits}`;
  };

  const sendOtp = async (phone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneE164(phone);

      // Only allow demo mode in development AND when explicitly enabled
      const DEMO_MODE_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';
      
      if (DEMO_MODE_ENABLED) {
        console.log(
          "Demo mode: Phone auth not configured, proceeding to verify step"
        );
        setStep("verify");
        return true;
      }

      // Production: Send real OTP via Supabase
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      setStep("verify");
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Kunde inte skicka verifieringskod"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkIfNewUser = async (userId: string): Promise<boolean> => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("date_of_birth")
      .eq("id", userId)
      .single();

    // New user if no date_of_birth set
    return !profile?.date_of_birth;
  };

  const verifyOtp = async (phone: string, token: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneE164(phone);

      // Only allow demo mode in development AND when explicitly enabled
      const DEMO_MODE_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';
      
      if (DEMO_MODE_ENABLED) {
        // Demo mode: Accept demo code 123456
        if (token !== "123456") {
          setError("Ogiltig verifieringskod. Använd 123456 för demo.");
          return false;
        }

        console.log("Demo mode: Using email-based authentication");

        // Use phone digits with a secret salt for more secure demo passwords
        const cleanPhone = phone.replace(/\D/g, "");
        const demoEmail = `${cleanPhone}@maak.app`;
        // Use environment variable for demo secret, with fallback only in dev
        const demoSecret = import.meta.env.VITE_DEMO_SECRET || 'dev-only-secret';
        // Create a more secure password by combining phone with secret
        const demoPassword = btoa(`${demoSecret}:${cleanPhone}`).slice(0, 32) + '!Aa1';

        // Try to sign in first (for returning users)
        const { error: signInError, data: signInData } =
          await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });

        if (!signInError && signInData.session) {
          // Returning user - check if profile is complete
          console.log("Returning user signed in successfully");
          const isNewUser = await checkIfNewUser(signInData.session.user.id);
          if (isNewUser) {
            setStep("profile");
          }
          return true;
        }

        // Check if phone number is already in use (only for non-deleted accounts)
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("user_id, phone")
          .eq("phone", formattedPhone)
          .single();

        if (existingProfile) {
          setError("Detta telefonnummer används redan. Logga in istället.");
          return false;
        }

        // New user - sign up with email confirmation disabled
        console.log("New user - creating account");
        const { error: signUpError, data: signUpData } =
          await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              emailRedirectTo: undefined,
              data: {
                phone: formattedPhone,
              },
            },
          });

        if (signUpError) {
          console.error("Sign up error:", signUpError);
          throw signUpError;
        }

        if (signUpData.user) {
          console.log("User created:", signUpData.user.id);
          // Check if this is a new user (should always be true here)
          const isNew = signUpData.session
            ? await checkIfNewUser(signUpData.user.id)
            : true;
          if (isNew) {
            setStep("profile");
          }
          return true;
        }

        throw new Error("Verifiering misslyckades");
      }

      // Production: Verify OTP with Supabase
      const { error, data } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token,
        type: "sms",
      });

      if (error) throw error;

      if (data.session) {
        // Check if profile is complete
        const isNewUser = await checkIfNewUser(data.session.user.id);
        if (isNewUser) {
          setStep("profile");
        }
        return true;
      }

      throw new Error("Verifiering misslyckades");
    } catch (err: unknown) {
      console.error("Verify OTP error:", err);
      setError(getErrorMessage(err, "Ogiltig verifieringskod"));
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
