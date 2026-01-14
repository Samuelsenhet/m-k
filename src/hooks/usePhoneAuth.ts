type SupabaseUser = { id: string };
// Defensive parsing for Supabase responses
const parseAuthResponse = <T>(response: { data?: T; error?: unknown }, context: string): T => {
  if (response.error) {
    console.error(`${context} error`, response.error);
    throw response.error;
  }
  if (!response.data) {
    throw new Error(`${context}: No data returned`);
  }
  return response.data;
};
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

      // Production: Send OTP via Twilio Edge Function
      const jwt = supabase.auth.getSession().then((res) => res.data.session?.access_token);
      const response = await fetch("/functions/v1/twilio-send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await jwt}`,
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      let data: { success?: boolean; error?: string } = {};
      let text = '';
      try {
        text = await response.text();
        data = JSON.parse(text) as { success?: boolean; error?: string };
      } catch {
        data = {};
      }
      if (!response.ok || !data.success) {
        // Log the raw response for debugging
        console.error('OTP API error. Raw response:', text);
        throw new Error(data.error || "Kunde inte skicka verifieringskod");
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

      // Production: Verify OTP via Twilio Edge Function
      const jwt = supabase.auth.getSession().then((res) => res.data.session?.access_token);
      const response = await fetch("/functions/v1/twilio-verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await jwt}`,
        },
        body: JSON.stringify({ phone: formattedPhone, code: token }),
      });
      const data: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Ogiltig verifieringskod");
      }
      // If Twilio verification succeeds, sign in/up with Supabase
      const supaData = parseAuthResponse(
        await supabase.auth.signInWithOtp({ phone: formattedPhone }),
        'signInWithOtp'
      );
      if (
        supaData.session &&
        typeof supaData.session.user === 'object' &&
        supaData.session.user !== null &&
        'id' in (supaData.session.user as object)
      ) {
        const userId = (supaData.session.user as SupabaseUser).id;
        const isNewUser = await checkIfNewUser(userId);
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
