import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PhoneAuthStep = "phone" | "verify" | "profile";

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

      // Only allow demo mode in development
      if (import.meta.env.DEV) {
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
    } catch (err: any) {
      setError(err.message || "Kunde inte skicka verifieringskod");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkIfNewUser = async (userId: string): Promise<boolean> => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("date_of_birth")
      .eq("user_id", userId)
      .single();

    // New user if no date_of_birth set
    return !profile?.date_of_birth;
  };

  const verifyOtp = async (phone: string, token: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneE164(phone);

      // Only allow demo mode in development
      if (import.meta.env.DEV) {
        // Demo mode: Accept demo code 123456
        if (token !== "123456") {
          setError("Ogiltig verifieringskod. Använd 123456 för demo.");
          return false;
        }

        console.log("Demo mode: Using email-based authentication");

        // Use only phone digits (no special characters) for email
        const cleanPhone = phone.replace(/\D/g, "");
        // Use clean email format without special characters
        const demoEmail = `${cleanPhone}@maak.app`;
        const demoPassword = `Maak${cleanPhone}Demo!2026`;

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
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Ogiltig verifieringskod");
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
