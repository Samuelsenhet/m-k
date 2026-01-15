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

      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Send OTP via Twilio Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/twilio-send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      let data: { success?: boolean; error?: string } = {};
      let text = "";
      try {
        text = await response.text();
        data = JSON.parse(text) as { success?: boolean; error?: string };
      } catch {
        data = {};
      }
      if (!response.ok || !data.success) {
        // Log the raw response for debugging
        console.error("OTP API error. Raw response:", text);

        // Better error messages based on status code and error content
        let userMessage = "Kunde inte skicka verifieringskod";

        if (response.status === 429) {
          userMessage = data.error || "För många försök. Vänta en stund och försök igen.";
        } else if (response.status === 400) {
          userMessage = "Ogiltigt telefonnummer. Kontrollera och försök igen.";
        } else if (data.error) {
          // Check for specific error messages from Twilio
          if (data.error.includes("invalid")) {
            userMessage = "Ogiltigt telefonnummer. Använd formatet: 070XXXXXXX";
          } else if (data.error.includes("många försök")) {
            userMessage = data.error; // Already in Swedish from edge function
          } else {
            userMessage = data.error;
          }
        }

        throw new Error(userMessage);
      }
      setStep("verify");
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Kunde inte skicka verifieringskod"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (phone: string, token: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneE164(phone);

      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Verify OTP via Twilio Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/twilio-verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ phone: formattedPhone, code: token }),
      });
      const data: {
        success?: boolean;
        error?: string;
        session?: { access_token: string; refresh_token: string };
        isNewUser?: boolean;
      } = await response.json();

      if (!response.ok || !data.success) {
        // Surface the actual server error for better debugging
        const serverError = data.error || "";
        let userMessage = "Ogiltig verifieringskod";

        if (response.status === 429) {
          userMessage = serverError || "För många försök. Vänta en stund och försök igen.";
        } else if (response.status === 401) {
          // OTP verification failed
          if (serverError.includes("utgått") || serverError.includes("canceled")) {
            userMessage = "Koden har utgått. Begär en ny kod.";
          } else if (serverError.includes("Fel kod") || serverError.includes("pending")) {
            userMessage = "Fel kod. Kontrollera och försök igen.";
          } else {
            userMessage = serverError || "Ogiltig kod. Kontrollera och försök igen.";
          }
        } else if (response.status === 500) {
          // Server error - surface actual message for debugging
          console.error("Server error during OTP verification:", serverError);
          userMessage = serverError || "Ett serverfel uppstod. Försök igen senare.";
        } else if (serverError) {
          // Use server error directly if it's in Swedish
          userMessage = serverError;
        }

        throw new Error(userMessage);
      }

      // Set the session returned from the backend
      if (!data.session) {
        throw new Error("Ingen session returnerades från servern");
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        console.error("Error setting session:", sessionError);
        throw new Error("Kunde inte skapa session");
      }

      // Check if new user needs to complete profile
      if (data.isNewUser) {
        setStep("profile");
      }

      return true;
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
