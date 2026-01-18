import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PhoneAuthStep = "phone" | "verify" | "profile";

interface VerifyResponse {
  success?: boolean;
  error?: string;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  isNewUser?: boolean;
}

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
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !anon) {
      throw new Error("Supabase environment variables missing");
    }

    return { url, anon };
  };

  const handleError = (err: unknown, fallback: string) => {
    console.error(err);
    setError(err instanceof Error ? err.message : fallback);
    return false;
  };

  /* ---------- SEND OTP ---------- */

  const sendOtp = async (phone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { url, anon } = getEnv();
      const formattedPhone = formatPhoneE164(phone);

      const res = await fetch(`${url}/functions/v1/twilio-send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anon}`,
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Kunde inte skicka verifieringskod");
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

    try {
      const { url, anon } = getEnv();
      const formattedPhone = formatPhoneE164(phone);

      const res = await fetch(`${url}/functions/v1/twilio-verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anon}`,
        },
        body: JSON.stringify({ phone: formattedPhone, code }),
      });

      const data: VerifyResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ogiltig verifieringskod");
      }

      if (!data.session) {
        throw new Error("Ingen session returnerades");
      }

      // 🔐 Set Supabase session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }

      if (data.isNewUser) {
        setStep("profile");
      }

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
  };
};
